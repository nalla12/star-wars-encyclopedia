import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { WookieepediaService } from './wookieepedia.service';
import { CacheService } from './cache.service';

function jsonResponse(body: unknown): Response {
  return { ok: true, status: 200, statusText: 'OK', json: () => Promise.resolve(body) } as Response;
}

function pages(entries: Record<string, unknown>): { query: { pages: Record<string, unknown> } } {
  return { query: { pages: entries } };
}

describe('WookieepediaService', () => {
  let service: WookieepediaService;
  let cache: CacheService;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(WookieepediaService);
    cache = TestBed.inject(CacheService);

    fetchMock = vi.fn().mockResolvedValue(jsonResponse({}));
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it('requests the fandom API with origin=*', async () => {
    await firstValueFrom(service.getImageURL('Luke Skywalker'));

    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain('starwars.fandom.com/api.php');
    expect(url).toContain('origin=*');
    expect(url).toContain('gsrsearch=Luke%20Skywalker');
  });

  it('returns the exact title match', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(
        pages({
          a: { index: 1, title: 'Luke Skywalker (film)', thumbnail: { source: 'wrong.jpg' } },
          b: { index: 2, title: 'Luke Skywalker', thumbnail: { source: 'right.jpg' } },
        }),
      ),
    );

    const result = await firstValueFrom(service.getImageURL('Luke Skywalker'));

    expect(result).toBe('right.jpg');
  });

  it('prefers a literal title match over search rank', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(
        pages({
          a: { index: 1, title: 'Luke Skywalker', thumbnail: { source: 'first.jpg' } },
          b: { index: 2, title: 'Luke', thumbnail: { source: 'second.jpg' } },
        }),
      ),
    );

    const result = await firstValueFrom(service.getImageURL('Luke'));

    expect(result).toBe('second.jpg');
  });

  it('falls back to search rank when nothing matches exactly', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(
        pages({
          a: { index: 2, title: 'Luke Organa', thumbnail: { source: 'second.jpg' } },
          b: { index: 1, title: 'Luke Skywalker', thumbnail: { source: 'first.jpg' } },
        }),
      ),
    );

    const result = await firstValueFrom(service.getImageURL('Luke'));

    expect(result).toBe('first.jpg');
  });

  it('skips disambiguation and Legends pages', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(
        pages({
          a: { index: 1, title: 'Han Solo (disambiguation)', thumbnail: { source: 'bad.jpg' } },
          b: { index: 2, title: 'Han Solo/Legends', thumbnail: { source: 'also-bad.jpg' } },
          c: { index: 3, title: 'Han Solo', thumbnail: { source: 'good.jpg' } },
        }),
      ),
    );

    const result = await firstValueFrom(service.getImageURL('Han Solo'));

    expect(result).toBe('good.jpg');
  });

  it('returns null when no page has a thumbnail', async () => {
    fetchMock.mockResolvedValue(jsonResponse(pages({ a: { index: 1, title: 'Unknown' } })));

    const result = await firstValueFrom(service.getImageURL('Unknown'));

    expect(result).toBeNull();
  });

  it('caches a positive result', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(
        pages({ a: { index: 1, title: 'Luke Skywalker', thumbnail: { source: 'l.jpg' } } }),
      ),
    );

    await firstValueFrom(service.getImageURL('Luke Skywalker'));
    const cached = await firstValueFrom(service.getImageURL('Luke Skywalker'));

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(cached).toBe('l.jpg');
  });

  it('caches a miss so it is not refetched', async () => {
    fetchMock.mockResolvedValue(jsonResponse(pages({})));

    expect(await firstValueFrom(service.getImageURL('Nothing Here'))).toBeNull();
    expect(await firstValueFrom(service.getImageURL('Nothing Here'))).toBeNull();
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('normalises the cache key by case and spacing', async () => {
    cache.set('fandom_luke_skywalker', { source: 'cached.jpg' });

    const result = await firstValueFrom(service.getImageURL('  LUKE   Skywalker '));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result).toBe('cached.jpg');
  });

  it('throws on a non-ok response', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 503,
      statusText: 'Unavailable',
      json: () => Promise.resolve({}),
    } as Response);

    await expect(firstValueFrom(service.getImageURL('Luke Skywalker'))).rejects.toThrow(
      /Fandom API error: 503/,
    );
  });
});
