const url = "https://wide-zoos-feel.loca.lt";

async function test() {
  try {
    console.log("Fetching", `${url}/api/tags`);
    const response = await fetch(`${url}/api/tags`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Bypass-Tunnel-Reminder": "true",
        "User-Agent": "sampat-server"
      },
      signal: AbortSignal.timeout(10000)
    });
    console.log("Status:", response.status);
    const text = await response.text();
    console.log("Body:", text.slice(0, 200));
  } catch (err) {
    console.error("Error:", err);
  }
}

test();
