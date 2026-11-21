async function test() {
  const urls = ["http://127.0.0.1:11434", "http://localhost:11434", "http://[::1]:11434"];
  for (const url of urls) {
    try {
      console.log("Trying", url);
      const res = await fetch(`${url}/api/tags`, { signal: AbortSignal.timeout(3000) });
      console.log(url, "status:", res.status);
      const data = await res.json();
      console.log("Models:", data.models?.map(m => m.name));
    } catch (e) {
      console.error(url, "failed:", e.message);
    }
  }
}
test();
