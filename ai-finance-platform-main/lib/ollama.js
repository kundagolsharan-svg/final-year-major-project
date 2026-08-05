/**
 * Hybrid Machine Learning Interface (Local Ollama + Cloud Gemini Fallback)
 * Works locally via Ollama, and automatically falls back to FREE Google Gemini when deployed to Vercel/Render.
 */

import { generateWithFallback as geminiGenerate } from "@/lib/gemini";

const OLLAMA_URL = process.env.OLLAMA_URL || "http://127.0.0.1:11434";

// Fetches the list of installed models from local Ollama
async function getInstalledModels() {
  try {
    const response = await fetch(`${OLLAMA_URL}/api/tags`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(3000),
    });
    
    if (!response.ok) return [];
    const data = await response.json();
    return data.models?.map(m => m.name) || [];
  } catch (error) {
    return [];
  }
}

/**
 * Shared helper for robust generation.
 * Tries local Ollama first. If unavailable (e.g. deployed on Vercel), seamlessly delegates to Gemini API.
 */
export async function generateWithFallback(prompt, isVision = false) {
  console.log(`[AI Engine] >>> Processing request (Vision: ${isVision})`);
  
  const installedModels = await getInstalledModels();
  
  // If Ollama is not running (Cloud Vercel / Render deployment), use Gemini API fallback
  if (installedModels.length === 0) {
    console.log("[AI Engine] Local Ollama not detected. Using Google Gemini Cloud AI...");
    return await geminiGenerate(prompt, isVision);
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
      console.log(`[Ollama AI] >>> Attempting generation with ${modelName}...`);
      const response = await fetch(`${OLLAMA_URL}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: modelName,
          prompt: prompt,
          stream: false,
        }),
        signal: AbortSignal.timeout(60000),
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

  // If local Ollama failed, delegate to Gemini Cloud API
  console.log("[AI Engine] Local Ollama models failed. Delegating to Gemini Cloud API...");
  return await geminiGenerate(prompt, isVision);
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

  const response = await fetch(`${OLLAMA_URL}/api/chat`, {
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
