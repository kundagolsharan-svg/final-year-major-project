const fetch = require('node-fetch');

async function test() {
  const prompt = `You are an expert financial statement extractor. Extract EVERY single transaction record from this Bank Statement PDF chunk.

Statement Chunk Content:
15/03/2024 Swiggy Bangalore 240.50 DR
16/03/2024 Salary 50000.00 CR
17/03/2024 Amazon 1200.00 DR

Extraction Rules:
1. Extract EVERY transaction line you find.
2. For each transaction, return a JSON object with: amount, date, description, type, category.
3. DO NOT WRITE ANY CODE, SCRIPTS, OR PYTHON. ONLY OUTPUT JSON.
4. MUST OUTPUT AN ARRAY OF JSON OBJECTS. START WITH [ AND END WITH ].

Example:
[
  {"amount": 120.0, "date": "2024-03-10", "description": "Cold Drinks Store", "type": "EXPENSE", "category": "food"},
  {"amount": 1499.0, "date": "2024-03-11", "description": "Amazon Apparel", "type": "EXPENSE", "category": "shopping"}
]`;

  const res = await fetch('http://127.0.0.1:11434/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'llama3.2', prompt: prompt, stream: false })
  });
  const data = await res.json();
  console.log('RAW TEXT:', data.response);
}
test().catch(console.error);
