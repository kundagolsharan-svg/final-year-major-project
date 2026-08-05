// In-memory cache for heavy AI responses with TTL to make navigation instant
const aiCache = new Map();

const DEFAULT_TTL_MS = 10 * 60 * 1000; // 10 minutes

export function getFromAICache(key) {
  const cached = aiCache.get(key);
  if (!cached) return null;
  
  if (Date.now() > cached.expiry) {
    aiCache.delete(key);
    return null;
  }
  
  return cached.data;
}

export function setInAICache(key, data, ttlMs = DEFAULT_TTL_MS) {
  aiCache.set(key, {
    data,
    expiry: Date.now() + ttlMs,
  });
}

export function invalidateAICache(prefix) {
  if (!prefix) {
    aiCache.clear();
    return;
  }
  for (const key of aiCache.keys()) {
    if (key.startsWith(prefix)) {
      aiCache.delete(key);
    }
  }
}
