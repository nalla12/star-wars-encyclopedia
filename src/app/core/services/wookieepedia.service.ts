import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { CacheService } from './cache.service';

@Injectable({ providedIn: 'root' })
export class WookieepediaService {
  private readonly BASE_URL = 'https://starwars.fandom.com/api.php';
  private readonly http = inject(HttpClient);
  private readonly cacheService = inject(CacheService);

  getImageURL(name: string): Observable<string | null> {
    const pageName = name.replace(/\s+/g, '_');
    const cacheKey = `fandom_${pageName}`;

    const cached = this.cacheService.get<{ source: string | null }>(cacheKey);
    if (cached !== null) {
      return of(cached.source);
    }

    const url = `${this.BASE_URL}?action=query&titles=${encodeURIComponent(pageName)}&prop=pageimages&format=json&pithumbsize=500`;

    return this.http.jsonp<Record<string, unknown>>(url, 'callback').pipe(
      map(data => {
        const query = data['query'] as Record<string, unknown> | undefined;
        const pages = query?.['pages'] as Record<string, unknown> | undefined;
        if (!pages) return null;
        const page = Object.values(pages).find((p: unknown) => {
          const entry = p as Record<string, unknown>;
          return !!entry['thumbnail'];
        });
        const thumb = page
          ? (page as Record<string, unknown>)['thumbnail'] as Record<string, unknown> | undefined
          : undefined;
        const source = (thumb?.['source'] as string) ?? null;
        this.cacheService.set(cacheKey, { source });
        return source;
      }),
    );
  }
}
