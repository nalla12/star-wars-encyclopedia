import { inject, Injectable } from '@angular/core';
import { from, Observable, of } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import { CacheService } from './cache.service';

@Injectable({ providedIn: 'root' })
export class SwapiService {
  private readonly BASE_URL = 'https://www.swapi.tech/api';
  private readonly cacheService = inject(CacheService);
  private requestTimestamps: number[] = [];

  private async applyRateLimit(): Promise<void> {
    const now = Date.now();
    const windowMs = 15 * 60 * 1000;
    this.requestTimestamps = this.requestTimestamps.filter(t => now - t < windowMs);
    if (this.requestTimestamps.length >= 5) {
      await this.cacheService.wait(100);
    }
    this.requestTimestamps.push(now);
  }

  getPeople(): Observable<unknown> {
    return this.cacheableRequest('/people/?expanded=true');
  }

  getPlanets(): Observable<unknown> {
    return this.cacheableRequest('/planets/?expanded=true');
  }

  getFilms(): Observable<unknown> {
    return this.cacheableRequest('/films/?expanded=true');
  }

  getStarships(): Observable<unknown> {
    return this.cacheableRequest('/starships/?expanded=true');
  }

  getVehicles(): Observable<unknown> {
    return this.cacheableRequest('/vehicles/?expanded=true');
  }

  getSpecies(): Observable<unknown> {
    return this.cacheableRequest('/species/?expanded=true');
  }

  getResource<T>(endpoint: string, id: number): Observable<T> {
    return this.cacheableRequest(`/${endpoint}/${id}`) as Observable<T>;
  }

  searchPeople(term: string): Observable<unknown> {
    return this.cacheableRequest(`/people/?search=${encodeURIComponent(term)}`);
  }

  private cacheableRequest(endpoint: string): Observable<unknown> {
    const cached = this.cacheService.get<unknown>(endpoint);
    if (cached) {
      return of(cached);
    }

    return from(this.applyRateLimit()).pipe(
      switchMap(() => from(fetch(`${this.BASE_URL}${endpoint}`))),
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
