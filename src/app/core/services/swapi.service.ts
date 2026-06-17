import { inject, Injectable } from '@angular/core';
import { from, Observable, of } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import { CacheService } from './cache.service';

@Injectable({ providedIn: 'root' })
export class SwapiService {
  private readonly BASE_URL = 'https://swapi.online/api';
  private readonly cacheService = inject(CacheService);

  getCharacters(page?: number): Observable<unknown> {
    return this.cacheableRequest('/characters');
  }

  getPlanets(page?: number): Observable<unknown> {
    return this.cacheableRequest('/planets');
  }

  getFilms(page?: number): Observable<unknown> {
    return this.cacheableRequest('/films');
  }

  getStarships(page?: number): Observable<unknown> {
    return this.cacheableRequest('/starships');
  }

  getSpecies(page?: number): Observable<unknown> {
    return this.cacheableRequest('/species');
  }

  getResource<T>(endpoint: string, id: number): Observable<T> {
    return this.cacheableRequest(`/${endpoint}/${id}`) as Observable<T>;
  }

  searchCharacters(term: string): Observable<unknown> {
    return this.cacheableRequest(`/characters?search=${encodeURIComponent(term)}`);
  }

  private cacheableRequest(endpoint: string): Observable<unknown> {
    const cached = this.cacheService.get<unknown>(endpoint);
    if (cached) {
      return of(cached);
    }

    return from(fetch(`${this.BASE_URL}${endpoint}`)).pipe(
      switchMap(response => {
        if (!response.ok) {
          throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
        return from(response.json() as Promise<unknown>);
      }),
      tap(data => this.cacheService.set(endpoint, data)),
    );
  }
}
