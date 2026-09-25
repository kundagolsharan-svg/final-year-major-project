const fetch = require('node-fetch');

async function mapDataToTransactions(data) {
  const isCSV = false;
  let chunks = [data];

  for (let i = 0; i < chunks.length; i++) {
    const prompt = `
      You are an expert financial statement extractor. Extract EVERY single transaction record from this ${
        isCSV ? "CSV batch" : "Bank Statement PDF chunk"
      }.

      Statement Chunk Content:
      ${chunks[i]}

      Extraction Rules:
      1. Extract EVERY transaction line you find.
      2. For each transaction, return a JSON object with:
         - "amount": positive numeric amount in Indian Rupees (e.g. 240.50). 
           CRITICAL: Do NOT multiply or divide by 100. Read exact numbers. 
           "500.00" -> 500, "1,500.00" -> 1500, "50" -> 50.
         - "date": ISO date string (YYYY-MM-DD, e.g. "2024-03-15"). Parse dates accurately from any format like DD/MM/YYYY, DD-Mon-YYYY, etc.
         - "description": merchant name or transaction summary (e.g. "Swiggy Bangalore", "Amazon India", "Chai Point", "HPCL Petrol Pump", "Netflix Subscription").
         - "type": "EXPENSE" for debits, payments, purchases, ATM withdrawals, fees, or negative values. "INCOME" for deposits, salary, credits, refunds, interest, or "CR".
         - "category": one of: "food", "shopping", "groceries", "transportation", "utilities", "entertainment", "healthcare", "education", "travel", "housing", "insurance", "other-expense", "income".
           - Cold drinks, juices, cafe, tea, restaurants, Swiggy, Zomato -> "food"
           - E-commerce, clothes, electronics, Amazon, Flipkart, Myntra -> "shopping"
           - Blinkit, Zepto, DMart, BigBasket, Supermarket -> "groceries"
           - Uber, Ola, Petrol, Fuel, Metro, Fastag -> "transportation"
           - Electricity, water, mobile recharge, wifi, bills -> "utilities"

      Return ONLY a valid JSON array of objects.
      Example:
      [
        {"amount": 120.0, "date": "2024-03-10", "description": "Cold Drinks & Snacks Store", "type": "EXPENSE", "category": "food"},
        {"amount": 1499.0, "date": "2024-03-11", "description": "Amazon India Apparel", "type": "EXPENSE", "category": "shopping"}
      ]
      If no transactions are in this chunk, return [].
    `;

    try {
      const res = await fetch('http://127.0.0.1:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'llama3.2', prompt: prompt, stream: false, format: 'json' })
      });
      const data = await res.json();
      const rawText = data.response;
      console.log('RAW TEXT WITH FORMAT JSON:', rawText);
    } catch (err) {
      console.warn('Error:', err.message);
    }
  }
}

mapDataToTransactions("15/03/2024 Swiggy Bangalore 240.50 DR\n16/03/2024 Salary 50000.00 CR");
