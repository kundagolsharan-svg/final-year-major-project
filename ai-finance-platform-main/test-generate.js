const url = "https://wide-zoos-feel.loca.lt";

async function testGenerate() {
  try {
    const requestBody = {
      model: "llama3.2:latest",
      prompt: "Reply with the word SUCCESS only.",
      stream: false,
    };

    console.log("Fetching", `${url}/api/generate`);
    const response = await fetch(`${url}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Bypass-Tunnel-Reminder": "true",
        "User-Agent": "sampat-server"
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(30000)
    });
    
    console.log("Status:", response.status);
    const text = await response.text();
    console.log("Body:", text.slice(0, 500));
  } catch (err) {
    console.error("Error:", err);
  }
}

testGenerate();
