import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import { from, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { CacheService } from './cache.service';

const BASE_URL = 'https://starwars.fandom.com/api.php';
const THUMB_SIZE = 500;
const SEARCH_LIMIT = 10;
const IMAGE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const MISS_TTL_MS = 6 * 60 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 15_000;

interface FandomPage {
  index?: number;
  title?: string;
  thumbnail?: { source?: string };
}

interface CachedImage {
  source: string | null;
}

interface FandomResponse {
  query?: { pages?: Record<string, FandomPage> };
}

@Injectable({ providedIn: 'root' })
export class WookieepediaService {
  private readonly cacheService = inject(CacheService);

  getImageURL(name: string, abortSignal?: AbortSignal): Observable<string | null> {
    const key = this.cacheKey(name);
    const cached = this.cacheService.get<CachedImage>(key);

    if (cached !== null) {
      return of(cached.source ?? null);
    }

    const url =
      `${BASE_URL}?action=query&generator=search&gsrsearch=${encodeURIComponent(name)}` +
      `&gsrnamespace=0&gsrlimit=${SEARCH_LIMIT}&prop=pageimages&pithumbsize=${THUMB_SIZE}` +
      `&format=json&origin=*`;

    const signal = abortSignal
      ? AbortSignal.any([abortSignal, AbortSignal.timeout(REQUEST_TIMEOUT_MS)])
      : AbortSignal.timeout(REQUEST_TIMEOUT_MS);

    return from(fetch(url, { signal })).pipe(
      switchMap((response) => {
        if (!response.ok) {
          throw new Error(`Fandom API error: ${response.status} ${response.statusText}`);
        }
        return from(response.json() as Promise<FandomResponse>);
      }),
      map((data) => {
        const source = this.pickImage(data, name);
        this.cacheService.set<CachedImage>(key, { source }, source ? IMAGE_TTL_MS : MISS_TTL_MS);
        return source;
      }),
    );
  }

  private cacheKey(name: string): string {
    return `fandom_${name.trim().toLowerCase().replace(/\s+/g, '_')}`;
  }

  private pickImage(data: FandomResponse, searchName: string): string | null {
    const pages = Object.values(data.query?.pages ?? {});
    const ranked = pages
      .filter((page) => !!page.thumbnail?.source)
      .sort((a, b) => (a.index ?? Number.MAX_SAFE_INTEGER) - (b.index ?? Number.MAX_SAFE_INTEGER));

    const target = searchName.trim().toLowerCase();
    const source = (page: FandomPage | undefined) => page?.thumbnail?.source ?? null;

    return (
      source(ranked.find((page) => page.title?.toLowerCase() === target)) ??
      source(
        ranked.find((page) => this.stripSuffixes(page.title ?? '').toLowerCase() === target),
      ) ??
      source(
        ranked.find((page) =>
          this.stripSuffixes(page.title ?? '')
            .toLowerCase()
            .startsWith(target),
        ),
      ) ??
      source(ranked.find((page) => this.isUsableTitle(page.title ?? ''))) ??
      source(ranked[0])
    );
  }

  private isUsableTitle(title: string): boolean {
    return !title.includes('(disambiguation)') && !title.endsWith('/Legends');
  }

  private stripSuffixes(title: string): string {
    return title
      .replace(/\s*\([^)]*\)\s*$/, '')
      .replace(/\/Legends$/, '')
      .trim();
  }
}
