import { Injectable } from '@angular/core';

const CACHE_PREFIX = 'swapi_cache_';
const CACHE_DURATION_MS = 30 * 60 * 1000;

@Injectable({ providedIn: 'root' })
export class CacheService {
  get<T>(key: string): T | null {
    const item = localStorage.getItem(CACHE_PREFIX + key);
    if (!item) return null;

    const { data, timestamp } = JSON.parse(item) as { data: T; timestamp: number };
    if (Date.now() - timestamp > CACHE_DURATION_MS) {
      localStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }

    return data;
  }

  set(key: string, data: unknown): void {
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({
      data,
      timestamp: Date.now(),
    }));
  }

  wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  clear(): void {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key?.startsWith(CACHE_PREFIX)) {
        localStorage.removeItem(key);
      }
    }
  }
}
