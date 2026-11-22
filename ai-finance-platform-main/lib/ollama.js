/**
 * Local Ollama AI Interface
 * Connects directly to Ollama via local URL or public tunnel (e.g. Cloudflare Tunnel).
 * Exclusively uses Ollama — no Google Gemini.
 */

const DEFAULT_OLLAMA_URL = "http://127.0.0.1:11434";

export function isLoopbackOllamaUrl(url) {
  try {
    const hostname = new URL(url).hostname.toLowerCase().replace(/^\[|\]$/g, "");
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
  } catch {
    return false;
  }
}

export function getOllamaBaseUrl() {
  const configuredUrl = (process.env.OLLAMA_URL || process.env.ollama_url || "").trim().replace(/\/+$/, "");
  return configuredUrl || DEFAULT_OLLAMA_URL;
}

let workingOllamaUrl = getOllamaBaseUrl();

export function assertOllamaUrlIsReachableFromVercel(url) {
  if (!process.env.VERCEL) return;

  if (isLoopbackOllamaUrl(url)) {
    throw new Error(
      "OLLAMA_URL on Vercel is set to localhost, which Vercel cannot reach. Set OLLAMA_URL to your public tunnel URL (e.g. from `npm run tunnel:sync`)."
    );
  }
}

export function selectOllamaModel(models, url = workingOllamaUrl, modelOverride = "") {
  if (!models || models.length === 0) return "llama3.2:latest";

  const configuredModel =
    modelOverride.trim() ||
    (process.env.OLLAMA_MODEL || "").trim() ||
    "llama3.2";

  const configuredMatch = models.find(
    model => model === configuredModel || model.startsWith(`${configuredModel}:`)
  );
  if (configuredMatch) return configuredMatch;

  const preferredModels = ["llama3.2", "llama3", "mistral", "gemma", "qwen", "phi3"];
  const sorted = [...models].sort((a, b) => {
    const aPref = preferredModels.findIndex(preferred => a.includes(preferred));
    const bPref = preferredModels.findIndex(preferred => b.includes(preferred));
    if (aPref !== -1 && bPref !== -1) return aPref - bPref;
    if (aPref !== -1) return -1;
    if (bPref !== -1) return 1;
    return 0;
  });

  return sorted[0] || models[0];
}

// Fetches the list of models from the configured Ollama server.
async function getInstalledModels() {
  const baseUrl = getOllamaBaseUrl();
  assertOllamaUrlIsReachableFromVercel(baseUrl);
  workingOllamaUrl = baseUrl;

  const urlsToTry = [baseUrl];
  if (!process.env.VERCEL) {
    urlsToTry.push(DEFAULT_OLLAMA_URL, "http://localhost:11434");
  }

  const uniqueUrls = [...new Set(urlsToTry.filter(Boolean))];

  for (const url of uniqueUrls) {
    if (process.env.VERCEL && isLoopbackOllamaUrl(url)) continue;
    try {
      const headers = { 
        "Content-Type": "application/json",
        "Bypass-Tunnel-Reminder": "true",
        "User-Agent": "sampat-server"
      };

      const response = await fetch(`${url.replace(/\/+$/, "")}/api/tags`, {
        method: "GET",
        headers,
        signal: AbortSignal.timeout(10000),
      });
      
      if (response.ok) {
        const data = await response.json();
        const models = data.models?.map(m => m.name) || [];
        if (models.length > 0) {
          workingOllamaUrl = url;
          console.log(`[Ollama AI] Successfully connected to ${url}. Found models: ${models.join(", ")}`);
          return models;
        }
      }
    } catch (error) {
      console.warn(`[Ollama AI] Could not connect to ${url}:`, error.message);
    }
  }
  
  console.warn(`[Ollama AI] Exhausted URLs. Ollama appears to be offline or unreachable on ${baseUrl}.`);
  return [];
}

/**
 * Shared helper for robust generation using Ollama only.
 */
export async function generateWithFallback(prompt, isVision = false, format = null) {
  console.log(`[AI Engine] >>> Processing request with Ollama (Vision: ${isVision})`);

  let safePrompt = prompt;
  let base64Images = [];
  if (Array.isArray(prompt)) {
    const textPart = prompt.find(p => typeof p === "string");
    const imagePart = prompt.find(p => p.inlineData && p.inlineData.data);
    safePrompt = textPart ? textPart.trim() : "";
    if (imagePart) base64Images.push(imagePart.inlineData.data);
  } else if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
    throw new Error("AI prompt cannot be null or empty.");
  } else {
    safePrompt = prompt.trim();
  }

  const installedModels = await getInstalledModels();

  if (installedModels.length === 0) {
    throw new Error(
      `Ollama is unreachable at ${workingOllamaUrl}. Please ensure your local Ollama server and tunnel are active.`
    );
  }

  // Pre-filter models if vision is requested
  const visionSupportedModels = ["llava", "bakllava", "moondream", "gemma"];
  let candidateModels = installedModels;

  if (isVision) {
    candidateModels = installedModels.filter(m => 
      visionSupportedModels.some(v => m.includes(v))
    );
    if (candidateModels.length === 0) {
      candidateModels = installedModels;
    }
  }

  const preferredModel = selectOllamaModel(candidateModels);
  const errors = [];

  for (const modelName of [
    preferredModel,
    ...candidateModels.filter(model => model !== preferredModel),
  ]) {
    try {
      console.log(`[Ollama AI] >>> Attempting generation with ${modelName} on ${workingOllamaUrl}...`);
      const requestBody = {
        model: modelName,
        prompt: safePrompt,
        stream: false,
        options: {
          temperature: 0.0
        }
      };
      if (base64Images.length > 0) requestBody.images = base64Images;
      if (format) requestBody.format = format;

      const headers = { 
        "Content-Type": "application/json",
        "Bypass-Tunnel-Reminder": "true",
        "User-Agent": "sampat-server"
      };

      const response = await fetch(`${workingOllamaUrl}/api/generate`, {
        method: "POST",
        headers,
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(60000),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const text = data.response?.trim();

      if (!text) {
        throw new Error("Received empty response from local Ollama model.");
      }

      console.log(`[Ollama AI] <<< SUCCESS with ${modelName}`);
      return text;
      
    } catch (error) {
      console.warn(`[Ollama AI] Failed with ${modelName}:`, error.message);
      errors.push(`${modelName}: ${error.message}`);
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        break;
      }
    }
  }

  throw new Error(`All Ollama models failed on ${workingOllamaUrl}. Details: ${errors.join(" | ")}`);
}

/**
 * Streaming version helper using Ollama
 */
export async function streamWithFallback(messages, modelOverride = null) {
  const installedModels = await getInstalledModels();
  if (installedModels.length === 0) {
    throw new Error(`Ollama is unreachable at ${workingOllamaUrl}. Please ensure your local Ollama server and tunnel are active.`);
  }
  
  let ollamaMessages = messages.map(m => ({
    role: m.role === 'user' ? 'user' : 'assistant',
    content: m.content
  }));

  const modelName = selectOllamaModel(installedModels, workingOllamaUrl, modelOverride || "");

  const headers = { 
    "Content-Type": "application/json",
    "Bypass-Tunnel-Reminder": "true",
    "User-Agent": "sampat-server"
  };

  const response = await fetch(`${workingOllamaUrl.replace(/\/+$/, "")}/api/chat`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: modelName,
      messages: ollamaMessages,
      stream: true,
    }),
    signal: AbortSignal.timeout(60000),
  });

  if (!response.ok) {
    throw new Error(`Failed to start Ollama stream: HTTP ${response.status}`);
  }

  return response.body; 
}
