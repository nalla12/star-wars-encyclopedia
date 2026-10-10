import { Injectable } from '@angular/core';

const CACHE_PREFIX = 'swapi_cache_';

export const DEFAULT_CACHE_TTL_MS = 30 * 60 * 1000;

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttlMs: number;
}

@Injectable({ providedIn: 'root' })
export class CacheService {
  get<T>(key: string): T | null {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;

    let entry: CacheEntry<T>;
    try {
      entry = JSON.parse(raw) as CacheEntry<T>;
    } catch {
      this.remove(key);
      return null;
    }

    if (!entry || typeof entry.timestamp !== 'number') {
      this.remove(key);
      return null;
    }

    const ttlMs = typeof entry.ttlMs === 'number' ? entry.ttlMs : DEFAULT_CACHE_TTL_MS;
    if (Date.now() - entry.timestamp > ttlMs) {
      this.remove(key);
      return null;
    }

    return entry.data ?? null;
  }

  set<T>(key: string, data: T, ttlMs: number = DEFAULT_CACHE_TTL_MS): void {
    const entry: CacheEntry<T> = { data, timestamp: Date.now(), ttlMs };

    if (this.write(CACHE_PREFIX + key, JSON.stringify(entry))) return;

    this.evictOldest();

    if (!this.write(CACHE_PREFIX + key, JSON.stringify(entry))) {
      this.clear();
      this.write(CACHE_PREFIX + key, JSON.stringify(entry));
    }
  }

  clear(): void {
    for (const key of this.keys()) {
      localStorage.removeItem(key);
    }
  }

  private write(storageKey: string, value: string): boolean {
    try {
      localStorage.setItem(storageKey, value);
      return true;
    } catch {
      return false;
    }
  }

  private remove(key: string): void {
    localStorage.removeItem(CACHE_PREFIX + key);
  }

  private keys(): string[] {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(CACHE_PREFIX)) {
        keys.push(key);
      }
    }
    return keys;
  }

  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTimestamp = Infinity;

    for (const key of this.keys()) {
      try {
        const entry = JSON.parse(localStorage.getItem(key) ?? '') as CacheEntry<unknown>;
        if (entry.timestamp < oldestTimestamp) {
          oldestTimestamp = entry.timestamp;
          oldestKey = key;
        }
      } catch {
        localStorage.removeItem(key);
      }
    }

    if (oldestKey) {
      localStorage.removeItem(oldestKey);
    }
  }
}
