import { GoogleGenerativeAI } from "@google/generative-ai";

// Standard models to check
const models = [
  "gemini-1.5-flash", 
  "gemini-1.5-pro",
  "gemini-1.0-pro",
  "gemini-pro", 
  "gemini-2.0-flash", 
  "gemini-2.0-flash-lite-preview-02-05"
];

const API_KEY = // User's key
const genAI = new GoogleGenerativeAI(API_KEY);

async function testAll() {
  console.log("--- STARTING AI KEY DIAGNOSTIC ---");
  for (const mName of models) {
    try {
      process.stdout.write(`[TEST] Checking ${mName}... `);
      const model = genAI.getGenerativeModel({ model: mName });
      const result = await model.generateContent("Say 'READY'");
      const response = await result.response;
      console.log(`✅ SUCCESS: "${response.text().trim()}"`);
    } catch (e) {
      console.log(`❌ FAIL: ${e.message.split('\n')[0]}`);
    }
  }
  console.log("--- DIAGNOSTIC COMPLETE ---");
}

testAll();
