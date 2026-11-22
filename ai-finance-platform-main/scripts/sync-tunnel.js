const { spawn, execFileSync } = require("child_process");

console.log("=================================================");
console.log("  SAMPAT AI — Cloudflare Tunnel & Vercel Sync   ");
console.log("=================================================");

// Cloudflare executable path or system command
const cloudflaredCmd = "C:\\Program Files (x86)\\cloudflared\\cloudflared.exe";

console.log("\n[1/3] Connecting to local Ollama via Cloudflare Tunnel...");

const tunnel = spawn(cloudflaredCmd, [
  "tunnel",
  "--url",
  "http://127.0.0.1:11434",
  "--http-host-header",
  "localhost",
]);

let synced = false;

function handleOutput(data) {
  const text = data.toString();
  process.stdout.write(text);

  const match = text.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/i);
  if (match && !synced) {
    synced = true;
    const tunnelUrl = match[0];
    console.log(`\n[2/3] Tunnel established: ${tunnelUrl}`);
    console.log(`[3/3] Syncing OLLAMA_URL to Vercel Production...`);

    try {
      execFileSync(
        "npx.cmd",
        ["vercel", "env", "update", "OLLAMA_URL", "--environment", "production", "--value", tunnelUrl, "-y"],
        { stdio: "inherit" }
      );
      execFileSync(
        "npx.cmd",
        ["vercel", "env", "update", "OLLAMA_MODEL", "--environment", "production", "--value", "llama3.2:latest", "-y"],
        { stdio: "inherit" }
      );
      console.log("\n=================================================");
      console.log("  SUCCESS! Vercel is now connected to your Ollama! ");
      console.log(`  Live URL: ${tunnelUrl}`);
      console.log("  Keep this process running while using AI on Vercel.");
      console.log("=================================================\n");
    } catch (err) {
      console.error("Failed to update Vercel environment variable automatically:", err.message);
      console.log(`Please manually run: npx vercel env update OLLAMA_URL --environment production --value "${tunnelUrl}" -y`);
    }
  }
}

tunnel.stdout.on("data", handleOutput);
tunnel.stderr.on("data", handleOutput);

tunnel.on("close", (code) => {
  console.log(`\nTunnel process ended with code ${code}.`);
  process.exit(code || 0);
});
