const fs = require('fs');
if (fs.existsSync('.env.vercel.pulled')) {
  const content = fs.readFileSync('.env.vercel.pulled', 'utf-8');
  content.split('\n').forEach(line => {
    if (line.includes('OLLAMA_URL') || line.includes('GEMINI_API_KEY')) {
      const parts = line.split('=');
      const key = parts[0].trim();
      const val = parts[1] ? parts[1].trim() : '';
      console.log(`${key}: length=${val.length}, value=${val.substring(0, 15)}...${val.substring(val.length - 5)}`);
    }
  });
} else {
  console.log('No file');
}
