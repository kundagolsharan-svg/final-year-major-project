import { NextResponse } from "next/server";

export async function GET() {
  const url = process.env.OLLAMA_URL || "http://127.0.0.1:11434";
  try {
    const headers = {
      "Content-Type": "application/json",
      "Bypass-Tunnel-Reminder": "true",
      "User-Agent": "sampat-server"
    };
    if (process.env.OLLAMA_API_KEY && !url.includes("127.0.0.1") && !url.includes("localhost")) {
      headers["Authorization"] = `Bearer ${process.env.OLLAMA_API_KEY}`;
    }
    const res = await fetch(`${url}/api/tags`, {
      method: "GET",
      headers,
      signal: AbortSignal.timeout(10000)
    });
    
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json({ success: true, url, data });
    } else {
      return NextResponse.json({ success: false, url, status: res.status, text: await res.text() }, { status: 500 });
    }
  } catch (err) {
    return NextResponse.json({ success: false, url, error: err.message, stack: err.stack }, { status: 500 });
  }
}
