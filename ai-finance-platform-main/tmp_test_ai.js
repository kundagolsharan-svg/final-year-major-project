const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');
if (fs.existsSync('.env')) {
  const envContent = fs.readFileSync('.env', 'utf-8');
  envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const value = parts[1].trim().replace(/^['"]|['"]$/g, '');
      process.env[key] = value;
    }
  });
}

async function testConnection() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("No API key found in .env");
    return;
  }
  
  console.log("Testing API Key:", apiKey.substring(0, 10) + "...");
  const genAI = new GoogleGenerativeAI(apiKey);
  
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });
    const result = await model.generateContent("Say 'API is working'");
    const response = await result.response;
    console.log("Response:", response.text());
  } catch (error) {
    console.error("API Error:", error.message);
  }
}

testConnection();
