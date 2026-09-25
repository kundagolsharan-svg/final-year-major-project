const fs = require('fs');
const path = require('path');

function replaceZodV3(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      replaceZodV3(fullPath);
    } else if (fullPath.endsWith('.js') || fullPath.endsWith('.cjs') || fullPath.endsWith('.mjs')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('zod/v3')) {
        content = content.replace(/zod\/v3/g, 'zod');
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Patched ${fullPath}`);
      }
    }
  }
}

console.log('Patching inngest package to remove zod/v3 imports...');
replaceZodV3(path.join(__dirname, '..', 'node_modules', 'inngest'));
console.log('Patching complete.');
