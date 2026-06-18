import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { CacheService } from './cache.service';

interface FandomPage {
  title?: string;
  thumbnail?: { source?: string };
}

@Injectable({ providedIn: 'root' })
export class WookieepediaService {
  private readonly BASE_URL = 'https://starwars.fandom.com/api.php';
  private readonly http = inject(HttpClient);
  private readonly cacheService = inject(CacheService);

  getImageURL(name: string): Observable<string | null> {
    const cacheKey = `fandom_${name.replace(/\s+/g, '_')}`;

    const cached = this.cacheService.get<{ source: string | null }>(cacheKey);
    if (cached !== null) {
      return of(cached.source);
    }

    const url = `${this.BASE_URL}?action=query&generator=search&gsrsearch=${encodeURIComponent(name)}&prop=pageimages&format=json&pithumbsize=500&gsrlimit=10`;

    return this.http.jsonp<Record<string, unknown>>(url, 'callback').pipe(
      map(data => {
        const pages = (data['query'] as Record<string, unknown>)?.['pages'] as Record<string, unknown> | undefined;
        if (!pages) return null;

        const entries = Object.values(pages) as FandomPage[];

        const pick = this.pickBest(entries, name);
        const source = pick?.thumbnail?.source ?? null;
        this.cacheService.set(cacheKey, { source });
        return source;
      }),
    );
  }

  private pickBest(pages: FandomPage[], searchName: string): FandomPage | null {
    const exact = pages.find(p => p.title === searchName && !!p.thumbnail);
    if (exact) return exact;

    const good = pages.find(p => {
      if (!p.thumbnail) return false;
      const title = p.title ?? '';
      if (title.endsWith('/Legends')) return false;
      if (title.includes('(disambiguation)')) return false;
      return true;
    });
    if (good) return good;

    return pages.find(p => !!p.thumbnail) ?? null;
  }
}
