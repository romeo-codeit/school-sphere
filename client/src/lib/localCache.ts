type CacheEntry<T> = { key: string; value: T; time: number };

// Very small LRU cache for in-memory use; falls back to localStorage for persistence
export class LocalCache<T = any> {
  private maxEntries: number;
  private map: Map<string, CacheEntry<T>>;

  constructor(maxEntries = 50) {
    this.maxEntries = maxEntries;
    this.map = new Map();
  }

  get(key: string): T | undefined {
    const entry = this.map.get(key);
    if (!entry) return undefined;
    // promote
    this.map.delete(key);
    this.map.set(key, { ...entry, time: Date.now() });
    return entry.value;
  }

  set(key: string, value: T) {
    if (this.map.size >= this.maxEntries) {
      // evict oldest
      const firstKey = this.map.keys().next().value;
      if (firstKey !== undefined) this.map.delete(firstKey);
    }
    this.map.set(key, { key, value, time: Date.now() });
  }

  delete(key: string) {
    this.map.delete(key);
  }

  clear() {
    this.map.clear();
  }
}
