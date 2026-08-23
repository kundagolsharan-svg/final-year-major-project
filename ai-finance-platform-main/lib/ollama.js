/**
 * Hybrid Machine Learning Interface (Local Ollama + Cloud Gemini Fallback)
 * Works locally via Ollama, and automatically falls back to FREE Google Gemini when deployed to Vercel/Render.
 */

import { generateWithFallback as geminiGenerate } from "@/lib/gemini";

let workingOllamaUrl = process.env.OLLAMA_URL || "http://127.0.0.1:11434";

// Fetches the list of installed models from local Ollama
async function getInstalledModels() {
  const urlsToTry = [process.env.OLLAMA_URL, "http://127.0.0.1:11434", "http://localhost:11434"].filter(Boolean);
  const uniqueUrls = [...new Set(urlsToTry)];

  for (const url of uniqueUrls) {
    try {
      const response = await fetch(`${url}/api/tags`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(3000),
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
 * Shared helper for robust generation.
 * Tries local Ollama first. If unavailable (e.g. deployed on Vercel), seamlessly delegates to Gemini API.
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
    throw new Error("Local Ollama not detected or no models installed. Please ensure Ollama is running.");
  }


  // Pre-filter models if vision is requested
  const visionSupportedModels = ["llava", "bakllava", "moondream"];
  let candidateModels = installedModels;

  if (isVision) {
    candidateModels = installedModels.filter(m => 
      visionSupportedModels.some(v => m.includes(v))
    );
    if (candidateModels.length === 0) {
      candidateModels = installedModels;
    }
  }

  const preferredModels = ["llama3.2", "llama3", "mistral", "gemma", "qwen", "phi3"];
  const sortedModels = candidateModels.sort((a, b) => {
    const aPref = preferredModels.findIndex(p => a.includes(p));
    const bPref = preferredModels.findIndex(p => b.includes(p));
    if (aPref !== -1 && bPref !== -1) return aPref - bPref;
    if (aPref !== -1) return -1;
    if (bPref !== -1) return 1;
    return 0;
  });

  const errors = [];

  for (const modelName of sortedModels) {
    try {
      console.log(`[Ollama AI] >>> Attempting generation with ${modelName} on ${workingOllamaUrl}...`);
      const requestBody = {
        model: modelName,
        prompt: safePrompt,
        stream: false,
      };
      if (base64Images.length > 0) requestBody.images = base64Images;
      if (format) requestBody.format = format;

      const response = await fetch(`${workingOllamaUrl}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

  // If local Ollama failed, do not fall back to Gemini per user request
  console.log("[AI Engine] Local Ollama models failed. Gemini fallback is disabled.");
  throw new Error("All local Ollama models failed to generate a response. Please check Ollama logs.");
}

/**
 * Streaming version helper
 */
export async function streamWithFallback(messages, modelOverride = null) {
  const installedModels = await getInstalledModels();
  if (installedModels.length === 0) {
    throw new Error("Ollama is not running locally.");
  }
  
  let ollamaMessages = messages.map(m => ({
    role: m.role === 'user' ? 'user' : 'assistant',
    content: m.content
  }));

  const modelName = modelOverride || installedModels.find(m => m.includes("llama3")) || installedModels[0];

  const response = await fetch(`${workingOllamaUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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
