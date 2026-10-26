// cache.js — simple in-memory cache with TTL and hit/miss counters.
const store = new Map();
let hits = 0;
let misses = 0;

// Normalize so "Min CIBIL?" and "  min cibil " map to the same key.
function makeKey(query) {
  return query.trim().toLowerCase().replace(/\s+/g, " ").replace(/[?.!]+$/, "");
}

export function getCached(query) {
  const key = makeKey(query);
  const entry = store.get(key);

  if (!entry) {
    misses++;
    return null;
  }
  if (Date.now() > entry.expiresAt) {
    store.delete(key); // expired = stale policy data risk
    misses++;
    return null;
  }
  hits++;
  return entry.value;
}

export function setCached(query, value, ttlMs = 60 * 60 * 1000) {
  store.set(makeKey(query), { value, expiresAt: Date.now() + ttlMs });
}

export function clearCache() {
  store.clear(); // call this after you re-ingest policy documents
}

export function cacheStats() {
  const total = hits + misses;
  return { hits, misses, hitRate: total ? hits / total : 0 };
}