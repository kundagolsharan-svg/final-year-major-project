const fs = require('fs');
function getKey(file) {
  if (!fs.existsSync(file)) return null;
  const content = fs.readFileSync(file, 'utf-8');
  let key = null;
  content.split('\n').forEach(line => {
    if (line.includes('GEMINI_API_KEY')) {
      const parts = line.split('=');
      key = parts[1] ? parts[1].trim().replace(/^['"]|['"]$/g, '') : null;
    }
  });
  return key;
}

const localKey = getKey('.env');
const prodKey = getKey('.env.vercel.prod');
const pulledKey = getKey('.env.vercel.pulled');
console.log('Local key length:', localKey ? localKey.length : 0);
console.log('Prod key length:', prodKey ? prodKey.length : 0);
console.log('Pulled key length:', pulledKey ? pulledKey.length : 0);
console.log('Are local and pulled identical?', localKey === pulledKey);
if (pulledKey && pulledKey !== '[SENSITIVE]') {
  console.log('Pulled key first 10:', pulledKey.substring(0, 10));
}
