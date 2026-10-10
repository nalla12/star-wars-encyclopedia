import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, withComponentInputBinding } from '@angular/router';
import { routes } from './app.routes';

describe('routing smoke', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter(routes, withComponentInputBinding())],
    });
  });

  it('resolves a category detail deep link', async () => {
    const router = TestBed.inject(Router);
    await router.navigate(['/characters', '1']);
    expect(router.url).toBe('/characters/1');
  });

  it('redirects an invalid category to /characters', async () => {
    const router = TestBed.inject(Router);
    await router.navigate(['/bogus']);
    expect(router.url).toBe('/characters');
  });

  it('redirects an unknown path to /characters', async () => {
    const router = TestBed.inject(Router);
    await router.navigate(['/characters/1/extra']);
    expect(router.url).toBe('/characters');
  });

  it('redirects the empty path to /characters', async () => {
    const router = TestBed.inject(Router);
    await router.navigate(['/']);
    expect(router.url).toBe('/characters');
  });
});
