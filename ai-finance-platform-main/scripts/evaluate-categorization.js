import fs from 'fs';
import { parse } from 'csv-parse/sync';
import { categorizeTransaction } from '../actions/transaction.js';

// Usage: node scripts/evaluate-categorization.js <path-to-labeled-csv>
// CSV should have headers: description,amount,expected_category

async function evaluate() {
  const csvPath = process.argv[2];
  if (!csvPath) {
    console.error("Please provide a path to a labeled CSV file.");
    console.error("Usage: node scripts/evaluate-categorization.js <path-to-csv>");
    process.exit(1);
  }

  console.log(`Loading dataset from ${csvPath}...`);
  const fileContent = fs.readFileSync(csvPath, 'utf8');
  
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true
  });

  console.log(`Loaded ${records.length} transactions. Starting evaluation...\n`);

  let correct = 0;
  const misclassifications = [];
  const stats = {}; 

  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    const { description, expected_category } = record;
    
    if (!stats[expected_category]) {
      stats[expected_category] = { tp: 0, fp: 0, fn: 0 };
    }

    try {
      const actual_category = await categorizeTransaction(description);
      
      if (!stats[actual_category]) {
        stats[actual_category] = { tp: 0, fp: 0, fn: 0 };
      }

      if (actual_category === expected_category) {
        correct++;
        stats[expected_category].tp++;
      } else {
        stats[expected_category].fn++;
        stats[actual_category].fp++;
        
        misclassifications.push({
          description,
          expected: expected_category,
          actual: actual_category
        });
      }
      
      process.stdout.write(`\rProcessed ${i + 1}/${records.length}`);
    } catch (error) {
      console.error(`\nFailed to categorize "${description}": ${error.message}`);
    }
  }

  console.log("\n\n=== Evaluation Results ===");
  const accuracy = (correct / records.length) * 100;
  console.log(`Overall Accuracy: ${accuracy.toFixed(2)}% (${correct}/${records.length})\n`);

  console.log("=== Per Category Metrics ===");
  console.log("Category | Precision | Recall | F1 Score");
  console.log("----------------------------------------");
  
  Object.keys(stats).sort().forEach(cat => {
    const { tp, fp, fn } = stats[cat];
    if (tp === 0 && fp === 0 && fn === 0) return;
    
    const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
    const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
    const f1 = precision + recall > 0 ? 2 * (precision * recall) / (precision + recall) : 0;
    
    console.log(`${cat.padEnd(20)} | ${(precision*100).toFixed(1)}% | ${(recall*100).toFixed(1)}% | ${(f1*100).toFixed(1)}%`);
  });

  if (misclassifications.length > 0) {
    console.log("\n=== Confusion List (Misclassifications) ===");
    misclassifications.forEach((m, idx) => {
      console.log(`${idx + 1}. DESC: "${m.description}" | EXPECTED: ${m.expected} | ACTUAL: ${m.actual}`);
    });
  }
}

evaluate().catch(console.error);
