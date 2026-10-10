import { TestBed } from '@angular/core/testing';
import { firstValueFrom, throwError } from 'rxjs';
import { SwapiService } from './swapi.service';
import { CacheService } from './cache.service';

function jsonResponse(body: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    statusText: ok ? 'OK' : 'Not Found',
    json: () => Promise.resolve(body),
  } as Response;
}

describe('SwapiService', () => {
  let service: SwapiService;
  let cache: CacheService;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(SwapiService);
    cache = TestBed.inject(CacheService);

    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it('requests the collection endpoint for a category', async () => {
    fetchMock.mockResolvedValue(jsonResponse([{ id: 1, name: 'Luke Skywalker' }]));

    const result = await firstValueFrom(service.getCollection('characters'));

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0][0]).toBe('https://swapi.online/api/characters');
    expect(result).toEqual([{ id: 1, name: 'Luke Skywalker' }]);
  });

  it('uses a distinct endpoint per category', async () => {
    fetchMock.mockResolvedValue(jsonResponse([]));

    await firstValueFrom(service.getCollection('transports'));

    expect(fetchMock.mock.calls[0][0]).toBe('https://swapi.online/api/transports');
  });

  it('requests a detail resource by id', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ id: 1, name: 'Luke Skywalker' }));

    const result = await firstValueFrom(service.getDetail('characters', '1'));

    expect(fetchMock.mock.calls[0][0]).toBe('https://swapi.online/api/characters/1');
    expect(result['name']).toBe('Luke Skywalker');
  });

  it('serves a cache hit without hitting the network', async () => {
    cache.set('/characters', [{ id: 1, name: 'Luke Skywalker' }]);

    const result = await firstValueFrom(service.getCollection('characters'));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result).toEqual([{ id: 1, name: 'Luke Skywalker' }]);
  });

  it('does not treat a cached falsy payload as a miss', async () => {
    cache.set('/films/1', 0);

    const result = await firstValueFrom(service.getDetail('films', '1'));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result).toBe(0);
  });

  it('writes the response into the cache', async () => {
    fetchMock.mockResolvedValue(jsonResponse([{ id: 2 }]));

    await firstValueFrom(service.getCollection('planets'));

    expect(cache.get('/planets')).toEqual([{ id: 2 }]);
  });

  it('throws on a non-ok response', async () => {
    fetchMock.mockResolvedValue(jsonResponse(null, false, 404));

    await expect(firstValueFrom(service.getDetail('characters', '999'))).rejects.toThrow(
      /API error: 404/,
    );
  });

  it('does not cache a failed response', async () => {
    fetchMock.mockResolvedValue(jsonResponse(null, false, 500));

    await expect(firstValueFrom(service.getCollection('species'))).rejects.toThrow();
    expect(cache.get('/species')).toBeNull();
  });

  it('passes an abort signal through to fetch', async () => {
    fetchMock.mockResolvedValue(jsonResponse([]));
    const controller = new AbortController();

    await firstValueFrom(service.getCollection('films', controller.signal));

    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it('surfaces a fetch rejection', async () => {
    fetchMock.mockReturnValue(throwError(() => new Error('network down')));

    await expect(firstValueFrom(service.getCollection('planets'))).rejects.toThrow('network down');
  });
});

describe('SwapiService cache emission', () => {
  it('emits the cached value without waiting for a network round trip', async () => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    const service = TestBed.inject(SwapiService);
    TestBed.inject(CacheService).set('/species', [{ id: 1 }]);
    vi.stubGlobal('fetch', vi.fn());

    const values: unknown[] = [];
    await new Promise<void>((resolve) => {
      service.getCollection('species').subscribe({
        next: (value) => values.push(value),
        complete: resolve,
      });
    });

    expect(values).toEqual([[{ id: 1 }]]);
    vi.unstubAllGlobals();
  });
});
