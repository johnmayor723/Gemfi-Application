/**
 * Simple in-memory cache for journal entries.
 * Shared between General Ledger and Trial Balance so both pages
 * can aggregate the same dataset without re-fetching.
 */

const CACHE = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function getCachedEntries(key) {
  const entry = CACHE.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) return entry.data;
  if (entry) CACHE.delete(key);
  return null;
}

export function setCachedEntries(key, data) {
  CACHE.set(key, { data, timestamp: Date.now() });
}

export function clearEntryCache() {
  CACHE.clear();
}

export function getCacheKey(filters) {
  return JSON.stringify(filters || {});
}