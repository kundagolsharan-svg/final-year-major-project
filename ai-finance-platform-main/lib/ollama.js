/**
 * Ollama AI Interface
 * Supports both local Ollama (via local URL or public tunnel) and Ollama Cloud (via OLLAMA_API_KEY).
 * Exclusively uses Ollama — no Google Gemini.
 */

const DEFAULT_OLLAMA_URL = "http://127.0.0.1:11434";
export const OLLAMA_CLOUD_URL = "https://ollama.com";

export function isLoopbackOllamaUrl(url) {
  if (!url) return false;
  try {
    const hostname = new URL(url).hostname.toLowerCase().replace(/^\[|\]$/g, "");
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
  } catch {
    return false;
  }
}

export function isOllamaCloudUrl(url) {
  if (!url) return false;
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return hostname === "ollama.com" || hostname.endsWith(".ollama.com") || hostname.includes("ollama.ai");
  } catch {
    return false;
  }
}

export function getOllamaBaseUrl() {
  const configuredUrl = (process.env.OLLAMA_URL || process.env.ollama_url || "").trim().replace(/\/+$/, "");

  // On Vercel, a Cloud API key takes precedence over stale local/tunnel URLs.
  if (process.env.VERCEL && process.env.OLLAMA_API_KEY) {
    return OLLAMA_CLOUD_URL;
  }

  // If an API key is present but no URL is configured anywhere, default to cloud URL
  if (!configuredUrl && process.env.OLLAMA_API_KEY) {
    return OLLAMA_CLOUD_URL;
  }

  return configuredUrl || DEFAULT_OLLAMA_URL;
}

let workingOllamaUrl = getOllamaBaseUrl();

export function assertOllamaUrlIsReachableFromVercel(url) {
  if (!process.env.VERCEL) return;

  if (isLoopbackOllamaUrl(url)) {
    if (process.env.OLLAMA_API_KEY) {
      // With API key configured, cloud routing is enabled
      return;
    }
    throw new Error(
      "OLLAMA_URL on Vercel is set to localhost, which Vercel cannot reach. Set OLLAMA_API_KEY to use Ollama Cloud or set OLLAMA_URL to your public tunnel URL (e.g. from `npm run tunnel:sync`)."
    );
  }
}

export function getOllamaHeaders(url = workingOllamaUrl) {
  const headers = {
    "Content-Type": "application/json",
    "Bypass-Tunnel-Reminder": "true",
    "User-Agent": "sampat-server"
  };

  const apiKey = (process.env.OLLAMA_API_KEY || "").trim();
  if (apiKey && !isLoopbackOllamaUrl(url)) {
    headers["Authorization"] = `Bearer ${apiKey}`;
  }

  return headers;
}

export function selectOllamaModel(models, url = workingOllamaUrl, modelOverride = "") {
  const environmentModel = (process.env.OLLAMA_MODEL || "").trim();
  const isLocalDefaultOnCloud =
    isOllamaCloudUrl(url) &&
    (environmentModel === "llama3.2" || environmentModel === "llama3.2:latest");
  const configuredModel =
    modelOverride.trim() ||
    (isLocalDefaultOnCloud ? "" : environmentModel) ||
    (isOllamaCloudUrl(url) ? "gemma4:31b" : "llama3.2");

  if (!models || models.length === 0) return configuredModel;

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

  return sorted[0] || models[0] || configuredModel;
}

// Fetches the list of models from the configured Ollama server.
async function getInstalledModels() {
  const baseUrl = getOllamaBaseUrl();
  assertOllamaUrlIsReachableFromVercel(baseUrl);
  workingOllamaUrl = baseUrl;

  const urlsToTry = [baseUrl];
  if (process.env.OLLAMA_API_KEY && !urlsToTry.includes(OLLAMA_CLOUD_URL)) {
    urlsToTry.push(OLLAMA_CLOUD_URL);
  }
  if (!process.env.VERCEL) {
    urlsToTry.push(DEFAULT_OLLAMA_URL, "http://localhost:11434");
  }

  const uniqueUrls = [...new Set(urlsToTry.filter(Boolean))];

  for (const url of uniqueUrls) {
    if (process.env.VERCEL && isLoopbackOllamaUrl(url)) continue;
    try {
      const headers = getOllamaHeaders(url);

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

  // Ollama Cloud may not expose /api/tags, so use its configured model as a fallback.
  if (process.env.OLLAMA_API_KEY) {
    const fallbackUrl = isOllamaCloudUrl(baseUrl) ? baseUrl : OLLAMA_CLOUD_URL;
    const defaultModel = selectOllamaModel([], fallbackUrl);
    console.log(`[Ollama AI] Using configured cloud model '${defaultModel}' at ${fallbackUrl}`);
    workingOllamaUrl = fallbackUrl;
    return [defaultModel];
  }
  
  console.warn(`[Ollama AI] Exhausted URLs. Ollama appears to be offline or unreachable on ${baseUrl}.`);
  return [];
}

/**
 * Shared helper for robust generation using Ollama.
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
      `Ollama is unreachable at ${workingOllamaUrl}. Please ensure your Ollama server/tunnel is active or OLLAMA_API_KEY is configured.`
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

  const preferredModel = selectOllamaModel(candidateModels, workingOllamaUrl);
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
      // Ollama Cloud does not support structured outputs.
      if (format && !isOllamaCloudUrl(workingOllamaUrl)) requestBody.format = format;

      const headers = getOllamaHeaders(workingOllamaUrl);

      const response = await fetch(`${workingOllamaUrl.replace(/\/+$/, "")}/api/generate`, {
        method: "POST",
        headers,
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(60000),
      });

      if (!response.ok) {
        const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
        error.status = response.status;
        throw error;
      }

      const data = await response.json();
      const text = data.response?.trim();

      if (!text) {
        throw new Error("Received empty response from Ollama model.");
      }

      console.log(`[Ollama AI] <<< SUCCESS with ${modelName}`);
      return text;
      
    } catch (error) {
      console.warn(`[Ollama AI] Failed with ${modelName}:`, error.message);
      if (error.status === 401 && isOllamaCloudUrl(workingOllamaUrl)) {
        throw new Error(
          "Ollama Cloud rejected OLLAMA_API_KEY (HTTP 401). Set a valid, active API key in Vercel's server-side environment and redeploy."
        );
      }
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
    throw new Error(`Ollama is unreachable at ${workingOllamaUrl}. Please ensure your Ollama server/tunnel is active or OLLAMA_API_KEY is configured.`);
  }
  
  let ollamaMessages = messages.map(m => ({
    role: m.role === 'user' ? 'user' : 'assistant',
    content: m.content
  }));

  const modelName = selectOllamaModel(installedModels, workingOllamaUrl, modelOverride || "");
  const headers = getOllamaHeaders(workingOllamaUrl);

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
