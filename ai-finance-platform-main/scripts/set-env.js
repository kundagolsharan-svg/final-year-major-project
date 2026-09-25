const { execFileSync } = require('child_process');

console.log("Setting OLLAMA_URL...");
execFileSync('npx.cmd', ['vercel', 'env', 'add', 'OLLAMA_URL', 'production,preview', '--value', 'https://wide-zoos-feel.loca.lt', '--force', '--yes'], { stdio: 'inherit' });
console.log("Done!");
