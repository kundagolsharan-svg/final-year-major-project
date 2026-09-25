const fetch = require('node-fetch');

async function test() {
  const prompt = `You are an expert financial statement extractor. Extract EVERY single transaction record from this Bank Statement PDF chunk.

Statement Chunk Content:
Hello World! 240.50 on 2024-03-15 at Swiggy Bangalore

Extraction Rules:
1. Extract EVERY transaction line you find.
2. For each transaction, return a JSON object with: amount, date, description, type, category.

Return ONLY a valid JSON array of objects.
Example:
[{"amount": 120.0, "date": "2024-03-10", "description": "Cold Drinks & Snacks Store", "type": "EXPENSE", "category": "food"}]`;

  const res = await fetch('http://127.0.0.1:11434/api/generate', {
    method: 'POST',
    body: JSON.stringify({ model: 'llama3.2', prompt: prompt, stream: false, format: 'json' })
  });
  const data = await res.json();
  console.log("RESPONSE:", data.response);
}

test().catch(console.error);
