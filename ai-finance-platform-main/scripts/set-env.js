const { execFileSync } = require('child_process');

const productionVariables = [
  ["OLLAMA_URL", "https://ollama.com"],
  ["OLLAMA_MODEL", "gemma4:31b"],
];

for (const [name, value] of productionVariables) {
  console.log(`Setting ${name} for Vercel production...`);
  execFileSync(
    "npx.cmd",
    ["vercel", "env", "add", name, "production", "--value", value, "--force", "--yes"],
    { stdio: "inherit" }
  );
}

console.log("Set OLLAMA_API_KEY separately as a sensitive Vercel environment variable.");
