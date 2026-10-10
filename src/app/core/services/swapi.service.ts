import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import { from, of } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import { CacheService } from './cache.service';
import type { Category } from '../types';

const BASE_URL = 'https://swapi.online/api';
const REQUEST_TIMEOUT_MS = 15_000;

type SwapiCollection = Record<string, unknown>[];

const COLLECTION_ENDPOINTS: Record<Category, string> = {
  characters: 'characters',
  planets: 'planets',
  films: 'films',
  transports: 'transports',
  species: 'species',
};

@Injectable({ providedIn: 'root' })
export class SwapiService {
  private readonly cacheService = inject(CacheService);

  getCollection(category: Category, abortSignal?: AbortSignal): Observable<SwapiCollection> {
    return this.cacheableRequest(`/${COLLECTION_ENDPOINTS[category]}`, abortSignal);
  }

  getDetail(
    category: Category,
    id: string,
    abortSignal?: AbortSignal,
  ): Observable<Record<string, unknown>> {
    return this.cacheableRequest(
      `/${COLLECTION_ENDPOINTS[category]}/${encodeURIComponent(id)}`,
      abortSignal,
    );
  }

  private cacheableRequest<T>(endpoint: string, abortSignal?: AbortSignal): Observable<T> {
    const cached = this.cacheService.get<T>(endpoint);
    if (cached !== null) {
      return of(cached);
    }

    const signal = abortSignal
      ? AbortSignal.any([abortSignal, AbortSignal.timeout(REQUEST_TIMEOUT_MS)])
      : AbortSignal.timeout(REQUEST_TIMEOUT_MS);

    return from(fetch(`${BASE_URL}${endpoint}`, { signal })).pipe(
      switchMap((response) => {
        if (!response.ok) {
          throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
        return from(response.json() as Promise<T>);
      }),
      tap((data) => this.cacheService.set(endpoint, data)),
    );
  }
}
