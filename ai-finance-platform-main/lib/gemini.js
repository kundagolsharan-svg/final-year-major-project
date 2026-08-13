import { GoogleGenerativeAI } from "@google/generative-ai";

// Lazy initialization — avoid creating client at module load time when env may not be ready
let _genAI = null;
function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set in environment variables.");
  }
  // Reset client if key changed (edge case)
  if (!_genAI) {
    _genAI = new GoogleGenerativeAI(apiKey);
  }
  return _genAI;
}

/**
 * Gets a generative model by name.
 */
export function getModel(modelName) {
  const genAI = getGenAI();
  return genAI.getGenerativeModel({ model: modelName });
}

/**
 * Returns the ordered list of model names to try, best first.
 */
export function getModelList(isVision = false) {
  // Ordered by preference: stable free-tier models first
  const textModels = [
    "gemini-1.5-flash",       // Most stable free-tier model
    "gemini-1.5-flash-8b",    // Smaller, faster fallback
    "gemini-2.0-flash",       // Newer but may have stricter quotas
    "gemini-2.0-flash-lite",  // Lightweight fallback
    "gemini-1.0-pro",         // Legacy stable
    "gemini-pro",             // Original stable
  ];
  const visionModels = [
    "gemini-1.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-pro",
    "gemini-pro-vision",
  ];
  return isVision ? visionModels : textModels;
}

/**
 * Shared helper for robust generation with model fallback.
 * Throws a clear error if all models fail — never returns fake data.
 */
export async function generateWithFallback(prompt, isVision = false) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error(
      "GEMINI_API_KEY is not set. Please add your API key to the .env file."
    );
  }

  // Guard: ensure prompt is a valid non-empty string to avoid "payload is null" error
  if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
    throw new Error("AI prompt cannot be null or empty.");
  }

  const safePrompt = prompt.trim();
  const models = getModelList(isVision);
  const errors = [];

  for (const modelName of models) {
    try {
      console.log(`[AI] >>> Attempting with ${modelName}...`);
      const model = getModel(modelName);
      const result = await model.generateContent(safePrompt);
      const response = result.response;
      const text = response.text();
      if (!text) throw new Error("Empty response from AI model");
      console.log(`[AI] <<< SUCCESS with ${modelName}`);
      return text;
    } catch (error) {
      const errorMsg = error.message || String(error) || "unknown error";
      console.error(`[AI] !!! FAILED with ${modelName}:`, errorMsg);
      errors.push(`${modelName}: ${errorMsg}`);

      // Retryable errors — quota, server errors, payload/null issues
      const isRetryable =
        errorMsg.includes("429") ||
        errorMsg.toLowerCase().includes("quota") ||
        errorMsg.includes("RESOURCE_EXHAUSTED") ||
        errorMsg.includes("limit: 0") ||
        errorMsg.includes("404") ||
        errorMsg.includes("403") ||
        errorMsg.includes("503") ||
        errorMsg.toLowerCase().includes("payload") ||
        errorMsg.toLowerCase().includes("received null") ||
        errorMsg.toLowerCase().includes("invalid argument");

      if (isRetryable) {
        console.warn(`[AI] --- ${modelName} unavailable, trying fallback...`);
        continue;
      }

      // Non-retryable error — throw immediately
      throw error;
    }
  }

  // All models failed — throw a descriptive error
  const failureDetails = errors.join(" | ");
  console.error("[AI] ALL MODELS FAILED:", failureDetails);
  throw new Error(
    `SAMPAT AI is temporarily unavailable. All models failed: ${failureDetails}. ` +
    `Please check your GEMINI_API_KEY and try again in a few minutes.`
  );
}
