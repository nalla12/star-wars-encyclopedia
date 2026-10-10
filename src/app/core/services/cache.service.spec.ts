import { TestBed } from '@angular/core/testing';
import { CacheService, DEFAULT_CACHE_TTL_MS } from './cache.service';

describe('CacheService', () => {
  let service: CacheService;

  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    TestBed.configureTestingModule({});
    service = TestBed.inject(CacheService);
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  it('returns null for an unknown key', () => {
    expect(service.get('missing')).toBeNull();
  });

  it('round-trips a value', () => {
    service.set('key', { a: 1 });
    expect(service.get<{ a: number }>('key')).toEqual({ a: 1 });
  });

  it('caches falsy values', () => {
    service.set('zero', 0);
    service.set('empty', '');

    expect(service.get<number>('zero')).toBe(0);
    expect(service.get<string>('empty')).toBe('');
  });

  it('expires an entry after the default TTL', () => {
    service.set('key', 'value');
    vi.advanceTimersByTime(DEFAULT_CACHE_TTL_MS + 1);

    expect(service.get('key')).toBeNull();
  });

  it('keeps an entry just under the TTL', () => {
    service.set('key', 'value');
    vi.advanceTimersByTime(DEFAULT_CACHE_TTL_MS - 1000);

    expect(service.get('key')).toBe('value');
  });

  it('honours a per-key TTL', () => {
    service.set('key', 'value', 1000);
    vi.advanceTimersByTime(1500);

    expect(service.get('key')).toBeNull();
  });

  it('evicts and re-reads after corrupt JSON', () => {
    localStorage.setItem('swapi_cache_broken', '{not json');

    expect(service.get('broken')).toBeNull();
    expect(localStorage.getItem('swapi_cache_broken')).toBeNull();
  });

  it('evicts an entry missing a timestamp', () => {
    localStorage.setItem('swapi_cache_shapeless', JSON.stringify({ data: 'x' }));

    expect(service.get('shapeless')).toBeNull();
    expect(localStorage.getItem('swapi_cache_shapeless')).toBeNull();
  });

  it('clears only its own prefixed keys', () => {
    service.set('mine', 1);
    localStorage.setItem('unrelated', 'keep me');

    service.clear();

    expect(localStorage.getItem('swapi_cache_mine')).toBeNull();
    expect(localStorage.getItem('unrelated')).toBe('keep me');
  });

  describe('when storage is full', () => {
    it('evicts the oldest entry and retries the write', () => {
      service.set('oldest', 'a');
      vi.advanceTimersByTime(1000);
      service.set('newer', 'b');

      const original = Storage.prototype.setItem;
      let deniedOnce = false;

      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (
        this: Storage,
        key: string,
        value: string,
      ) {
        if (key === 'swapi_cache_newest' && !deniedOnce) {
          deniedOnce = true;
          throw new DOMException('The quota has been exceeded.', 'QuotaExceededError');
        }
        original.call(this, key, value);
      });

      service.set('newest', 'c');

      expect(deniedOnce).toBe(true);
      expect(localStorage.getItem('swapi_cache_newest')).toContain('"data":"c"');
      expect(localStorage.getItem('swapi_cache_oldest')).toBeNull();

      vi.restoreAllMocks();
    });
  });
});
