const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');

async function testPulledKey() {
  if (!fs.existsSync('.env.vercel.pulled')) {
    console.log('No .env.vercel.pulled file');
    return;
  }
  const content = fs.readFileSync('.env.vercel.pulled', 'utf-8');
  let apiKey = null;
  content.split('\n').forEach(line => {
    if (line.startsWith('GEMINI_API_KEY=')) {
      const parts = line.split('=');
      apiKey = parts[1].trim().replace(/^['"]|['"]$/g, '');
    }
  });

  if (!apiKey) {
    console.error("No API key found in .env.vercel.pulled");
    return;
  }

  console.log("Testing pulled API key against gemini-3.6-flash...");
  const genAI = new GoogleGenerativeAI(apiKey);
  
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });
    const result = await model.generateContent("Say 'PULLED API KEY IS WORKING'");
    const response = await result.response;
    console.log("Response:", response.text().trim());
  } catch (error) {
    console.error("API Error with pulled key:", error.message);
  }
}

testPulledKey();
