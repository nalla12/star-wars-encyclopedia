type MediaQueryListener = (event: MediaQueryListEvent) => void;

const listeners = new WeakMap<MediaQueryList, Set<unknown>>();

class TestMediaQueryList implements MediaQueryList {
  readonly media: string;
  onchange: MediaQueryListener | null = null;

  constructor(readonly query: string) {
    this.media = query;
  }

  get matches(): boolean {
    return window.innerWidth <= 767;
  }

  addEventListener(_type: 'change', listener: unknown): void {
    const set = listeners.get(this) ?? new Set<unknown>();
    set.add(listener);
    listeners.set(this, set);
  }

  removeEventListener(_type: 'change', listener: unknown): void {
    listeners.get(this)?.delete(listener);
  }

  dispatchEvent(): boolean {
    return true;
  }

  addListener(listener: MediaQueryListener): void {
    this.addEventListener('change', listener);
  }

  removeListener(listener: MediaQueryListener): void {
    this.removeEventListener('change', listener);
  }
}

if (typeof window.matchMedia !== 'function') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: (query: string): MediaQueryList => new TestMediaQueryList(query),
  });
}
