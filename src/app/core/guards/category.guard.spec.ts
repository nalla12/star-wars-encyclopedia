import { TestBed } from '@angular/core/testing';
import type { ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Router } from '@angular/router';
import { categoryGuard } from './category.guard';
import { CATEGORIES } from '../types';

const redirect = { marker: 'redirect' } as unknown as UrlTree;

function runGuard(category: string | null) {
  const router = TestBed.inject(Router);
  const route = {
    paramMap: new Map([['category', category]]),
  } as unknown as ActivatedRouteSnapshot;

  const result = TestBed.runInInjectionContext(() =>
    categoryGuard(route, {} as RouterStateSnapshot),
  );

  return { result, router };
}

describe('categoryGuard', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: Router,
          useValue: { createUrlTree: vi.fn(() => redirect) },
        },
      ],
    });
  });

  it.each([...CATEGORIES])('allows the %s category', (category) => {
    const { result, router } = runGuard(category);

    expect(result).toBe(true);
    expect(router.createUrlTree).not.toHaveBeenCalled();
  });

  it('redirects an unknown category to /characters', () => {
    const { result, router } = runGuard('bogus');

    expect(router.createUrlTree).toHaveBeenCalledWith(['/characters']);
    expect(result).toBe(redirect);
  });

  it('redirects a missing category', () => {
    const { result } = runGuard(null);

    expect(result).toBe(redirect);
  });

  it('redirects a non-string category', () => {
    const { result } = runGuard('1');

    expect(result).toBe(redirect);
  });
});
