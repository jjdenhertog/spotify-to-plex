// Cache utilities

export type CacheEntry<T> = {
  data: T;
  timestamp: number;
  ttl: number;
}

export class MemoryCache<T = any> {
  private readonly cache = new Map<string, CacheEntry<T>>();
  private readonly defaultTTL: number;

  constructor(defaultTTL: number = 3_600_000) { // 1 hour default
    this.defaultTTL = defaultTTL;
  }

  set(key: string, value: T, ttl?: number): void {
    this.cache.set(key, {
      data: value,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    });
  }

  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return undefined;
    }

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);

      return undefined;
    }

    return entry.data;
  }

  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  cleanup(): void {
    const now = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  values(): T[] {
    const values: T[] = [];

    for (const key of this.cache.keys()) {
      const value = this.get(key);
      if (value !== undefined) {
        values.push(value);
      }
    }

    return values;
  }
}

export const globalCache = new MemoryCache();