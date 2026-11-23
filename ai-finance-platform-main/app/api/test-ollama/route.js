import { NextResponse } from "next/server";
import {
  assertOllamaUrlIsReachableFromVercel,
  getOllamaBaseUrl,
  getOllamaHeaders,
} from "@/lib/ollama";

export async function GET() {
  const url = getOllamaBaseUrl();
  try {
    assertOllamaUrlIsReachableFromVercel(url);
    const headers = getOllamaHeaders(url);
    const res = await fetch(`${url.replace(/\/+$/, "")}/api/tags`, {
      method: "GET",
      headers,
      signal: AbortSignal.timeout(10000)
    });
    
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json({ success: true, url, data });
    } else {
      return NextResponse.json({
        success: false,
        url,
        status: res.status,
        text: await res.text(),
        hasApiKey: !!process.env.OLLAMA_API_KEY
      }, { status: res.status >= 400 && res.status < 600 ? res.status : 500 });
    }
  } catch (err) {
    return NextResponse.json({
      success: false,
      url,
      error: err.message,
      hasApiKey: !!process.env.OLLAMA_API_KEY
    }, { status: 500 });
  }
}
