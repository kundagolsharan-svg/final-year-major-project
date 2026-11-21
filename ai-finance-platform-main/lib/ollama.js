/**
 * Local Ollama AI Interface — llama3.2:latest
 * Connects to local Ollama server at http://127.0.0.1:11434
 * No Gemini fallback: Ollama is required.
 */

const DEFAULT_OLLAMA_URL = "http://127.0.0.1:11434";
export const OLLAMA_CLOUD_URL = "https://ollama.com";

function isLoopbackOllamaUrl(url) {
  try {
    const hostname = new URL(url).hostname.toLowerCase().replace(/^\[|\]$/g, "");
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
  } catch {
    return false;
  }
}

export function getOllamaBaseUrl() {
  const configuredUrl = (process.env.OLLAMA_URL || "").trim().replace(/\/+$/, "");
  if (
    process.env.VERCEL &&
    process.env.OLLAMA_API_KEY &&
    (!configuredUrl || isLoopbackOllamaUrl(configuredUrl))
  ) {
    return OLLAMA_CLOUD_URL;
  }
  return configuredUrl || DEFAULT_OLLAMA_URL;
}

let workingOllamaUrl = getOllamaBaseUrl();

export function assertOllamaUrlIsReachableFromVercel(url) {
  if (!process.env.VERCEL) return;

  if (isLoopbackOllamaUrl(url)) {
    throw new Error(
      "OLLAMA_URL points to localhost, which Vercel cannot access. Set OLLAMA_API_KEY to use Ollama Cloud or configure a reachable Ollama server."
    );
  }
}

function isOllamaCloudUrl(url) {
  try {
    return new URL(url).hostname === "ollama.com";
  } catch {
    return false;
  }
}

export function selectOllamaModel(models, url = workingOllamaUrl, modelOverride = "") {
  const configuredModel =
    modelOverride.trim() ||
    (process.env.OLLAMA_MODEL || "").trim() ||
    (isOllamaCloudUrl(url) ? "gemma4:31b" : "");
  const configuredMatch = models.find(
    model => model === configuredModel || model.startsWith(`${configuredModel}:`)
  );

  if (configuredModel && !configuredMatch && isOllamaCloudUrl(url)) {
    throw new Error(
      `OLLAMA_MODEL "${configuredModel}" is not available in Ollama Cloud. Set OLLAMA_MODEL to gemma4:31b or another model from Ollama's cloud catalog.`
    );
  }
  if (configuredMatch) return configuredMatch;

  const preferredModels = ["llama3.2", "llama3", "mistral", "gemma", "qwen", "phi3"];
  return [...models].sort((a, b) => {
    const aPref = preferredModels.findIndex(preferred => a.includes(preferred));
    const bPref = preferredModels.findIndex(preferred => b.includes(preferred));
    if (aPref !== -1 && bPref !== -1) return aPref - bPref;
    if (aPref !== -1) return -1;
    if (bPref !== -1) return 1;
    return 0;
  })[0];
}

// Fetches the list of models from the configured Ollama server.
async function getInstalledModels() {
  const baseUrl = getOllamaBaseUrl();
  assertOllamaUrlIsReachableFromVercel(baseUrl);
  workingOllamaUrl = baseUrl;

  const urlsToTry = process.env.VERCEL
    ? [baseUrl]
    : [baseUrl, DEFAULT_OLLAMA_URL, "http://localhost:11434"];

  if (process.env.OLLAMA_API_KEY && !urlsToTry.includes(OLLAMA_CLOUD_URL)) {
    urlsToTry.push(OLLAMA_CLOUD_URL);
  }
  
  const uniqueUrls = [...new Set(urlsToTry)];

  for (const url of uniqueUrls) {
    try {
      const headers = { 
        "Content-Type": "application/json",
        "Bypass-Tunnel-Reminder": "true",
        "User-Agent": "sampat-server"
      };
      
      if (process.env.OLLAMA_API_KEY && !url.includes("127.0.0.1") && !url.includes("localhost")) {
        headers["Authorization"] = `Bearer ${process.env.OLLAMA_API_KEY}`;
      }

      const response = await fetch(`${url.replace(/\/+$/, "")}/api/tags`, {
        method: "GET",
        headers,
        signal: AbortSignal.timeout(10000),
      });
      
      if (response.ok) {
        const data = await response.json();
        const models = data.models?.map(m => m.name) || [];
        if (models.length > 0) {
          workingOllamaUrl = url; // Save the working URL
          console.log(`[Ollama AI] Successfully connected to ${url}. Found models: ${models.join(", ")}`);
          return models;
        }
      }
    } catch (error) {
      console.warn(`[Ollama AI] Could not connect to ${url}:`, error.message);
    }
  }
  
  console.warn(`[Ollama AI] Exhausted all local URLs. Ollama appears to be offline or no models are installed.`);
  return [];
}

/**
 * Shared helper for robust generation using Ollama only.
 */
export async function generateWithFallback(prompt, isVision = false, format = null) {
  console.log(`[AI Engine] >>> Processing request (Vision: ${isVision})`);

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
      "No Ollama models were returned. Check OLLAMA_URL and, for Ollama Cloud, configure a valid OLLAMA_API_KEY."
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
      if (format && !isOllamaCloudUrl(workingOllamaUrl)) requestBody.format = format;

      const headers = { 
        "Content-Type": "application/json",
        "Bypass-Tunnel-Reminder": "true",
        "User-Agent": "sampat-server"
      };
      if (process.env.OLLAMA_API_KEY && !workingOllamaUrl.includes("127.0.0.1") && !workingOllamaUrl.includes("localhost")) {
        headers["Authorization"] = `Bearer ${process.env.OLLAMA_API_KEY}`;
      }

      const response = await fetch(`${workingOllamaUrl}/api/generate`, {
        method: "POST",
        headers,
        body: JSON.stringify(requestBody)
        // Removed timeout to allow slow local models to complete
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const text = data.response?.trim();

      if (!text) {
        throw new Error("Received empty response from local model.");
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

  // All Ollama models failed — throw error (no Gemini fallback)
  console.error("[AI Engine] All Ollama models failed.");
  throw new Error(`All Ollama models failed. Details: ${errors.join(" | ")}`);
}

/**
 * Streaming version helper
 */
export async function streamWithFallback(messages, modelOverride = null) {
  const installedModels = await getInstalledModels();
  if (installedModels.length === 0) {
    throw new Error("Ollama is not running. Please ensure Ollama is active or OLLAMA_API_KEY is configured.");
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
  if (process.env.OLLAMA_API_KEY && !workingOllamaUrl.includes("127.0.0.1") && !workingOllamaUrl.includes("localhost")) {
    headers["Authorization"] = `Bearer ${process.env.OLLAMA_API_KEY}`;
  }

  const response = await fetch(`${workingOllamaUrl.replace(/\/+$/, "")}/api/chat`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: modelName,
      messages: ollamaMessages,
      stream: true,
    })
  });

  if (!response.ok) {
    throw new Error("Failed to start Ollama stream");
  }

  return response.body; 
}
