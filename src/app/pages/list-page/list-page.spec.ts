import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ListPageComponent } from './list-page';
import { SwapiService } from '../../core/services/swapi.service';
import type { Category, ResourceData } from '../../core/types';

interface TestableListPage {
  resources(): ResourceData[];
  filteredResources(): ResourceData[];
  isEmpty(): boolean;
  isLoading(): boolean;
  isDetailView(): boolean;
  selectedResourceId(): string | null;
  error(): Error | undefined;
  categoryLabel(): string;
  searchQuery: { set(value: string): void; (): string };
  retry(): void;
  navigateToDetail(item: ResourceData): void;
  closeDetail(): void;
}

class SwapiStub {
  collections: Record<string, Record<string, unknown>[]> = {
    characters: [
      { id: 1, name: 'Luke Skywalker' },
      { id: 2, name: 'Leia Organa' },
      { id: 3, name: 'C-3PO' },
    ],
    planets: [{ id: 1, name: 'Tatooine' }],
    films: [{ id: 1, title: 'A New Hope' }],
    transports: [{ id: 2, name: 'CR90 corvette' }],
    species: [{ id: 1, name: 'Human' }],
  };

  error: Error | null = null;
  requested: string[] = [];

  getCollection(category: Category) {
    this.requested.push(category);
    return this.error ? throwError(() => this.error) : of(this.collections[category] ?? []);
  }

  getDetail() {
    return of({ id: 1, name: 'Luke Skywalker' });
  }
}

describe('ListPageComponent', () => {
  let fixture: ComponentFixture<ListPageComponent>;
  let component: TestableListPage;
  let swapi: SwapiStub;
  let router: Router;

  beforeEach(async () => {
    swapi = new SwapiStub();

    await TestBed.configureTestingModule({
      imports: [ListPageComponent],
      providers: [provideRouter([]), { provide: SwapiService, useValue: swapi }],
    }).compileComponents();

    fixture = TestBed.createComponent(ListPageComponent);
    component = fixture.componentInstance as unknown as TestableListPage;
    router = TestBed.inject(Router);
  });

  const setRoute = (category: Category, id?: string) => {
    fixture.componentRef.setInput('category', category);
    if (id) {
      fixture.componentRef.setInput('id', id);
    }
    fixture.detectChanges();
  };

  it('maps a collection to card data', async () => {
    setRoute('characters');
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.filteredResources()).toEqual([
      { id: '1', uid: '1', name: 'Luke Skywalker' },
      { id: '2', uid: '2', name: 'Leia Organa' },
      { id: '3', uid: '3', name: 'C-3PO' },
    ]);
  });

  it('uses the title field for films', async () => {
    setRoute('films');
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.filteredResources()[0].name).toBe('A New Hope');
  });

  it('drops entries with no name, title or model', async () => {
    swapi.collections['planets'] = [{ id: 1 }, { id: 2, name: 'Tatooine' }];

    setRoute('planets');
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.resources()).toEqual([{ id: '2', uid: '2', name: 'Tatooine' }]);
  });

  it('returns an empty list when the payload is not an array', async () => {
    swapi.collections['species'] = null as unknown as Record<string, unknown>[];

    setRoute('species');
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.resources()).toEqual([]);
  });

  it('filters by name, case-insensitively', async () => {
    setRoute('characters');
    await fixture.whenStable();
    fixture.detectChanges();

    component.searchQuery.set('leia');
    fixture.detectChanges();

    expect(component.filteredResources().map((r) => r.name)).toEqual(['Leia Organa']);
  });

  it('ignores surrounding whitespace in the query', async () => {
    setRoute('characters');
    await fixture.whenStable();
    fixture.detectChanges();

    component.searchQuery.set('  c3po  '.replace('3po', '-3PO'));
    fixture.detectChanges();

    expect(component.filteredResources().map((r) => r.name)).toEqual(['C-3PO']);
  });

  it('reports the empty state only when resources exist but none match', async () => {
    setRoute('characters');
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.isEmpty()).toBe(false);

    component.searchQuery.set('zzz');
    fixture.detectChanges();

    expect(component.isEmpty()).toBe(true);
  });

  it('does not report the empty state while still loading', () => {
    swapi.error = new Error('boom');
    setRoute('characters');

    expect(component.isEmpty()).toBe(false);
  });

  it('surfaces a load error', async () => {
    swapi.error = new Error('Failed to load resources.');

    setRoute('characters');
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.error()?.message).toBe('Failed to load resources.');
    expect(component.isLoading()).toBe(false);
  });

  it('reloads on retry', async () => {
    swapi.error = new Error('boom');
    setRoute('characters');
    await fixture.whenStable();
    fixture.detectChanges();

    swapi.error = null;
    component.retry();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.error()).toBeUndefined();
    expect(component.resources().length).toBe(3);
  });

  it('refetches when the category changes', async () => {
    setRoute('characters');
    await fixture.whenStable();

    setRoute('planets');
    await fixture.whenStable();
    fixture.detectChanges();

    expect(swapi.requested).toEqual(['characters', 'planets']);
    expect(component.resources()[0].name).toBe('Tatooine');
  });

  it('closes the detail view when no id is present', () => {
    setRoute('characters');

    expect(component.isDetailView()).toBe(false);
    expect(component.selectedResourceId()).toBeNull();
  });

  it('opens the detail view when an id is present', () => {
    setRoute('characters', '1');

    expect(component.isDetailView()).toBe(true);
    expect(component.selectedResourceId()).toBe('1');
  });

  it('navigates to the detail route', async () => {
    setRoute('characters');
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    component.navigateToDetail({ uid: '2', name: 'Leia Organa' });

    expect(navigate).toHaveBeenCalledWith(['/', 'characters', '2']);
    navigate.mockRestore();
  });

  it('navigates back to the category when closing', () => {
    setRoute('characters', '1');
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    component.closeDetail();

    expect(navigate).toHaveBeenCalledWith(['/', 'characters']);
    navigate.mockRestore();
  });

  it('resets the search query when the category changes', async () => {
    setRoute('characters');
    await fixture.whenStable();
    component.searchQuery.set('leia');

    setRoute('planets');
    fixture.detectChanges();

    expect(component.searchQuery()).toBe('');
  });

  it('labels the list with the category name', () => {
    setRoute('transports');
    expect(component.categoryLabel()).toBe('Transports');
  });

  it('renders a card per resource', async () => {
    setRoute('characters');
    await fixture.whenStable();
    fixture.detectChanges();

    const cards = fixture.nativeElement.querySelectorAll('.resource-card');
    expect(cards.length).toBe(3);
    expect(cards[0].textContent).toContain('Luke Skywalker');
    expect(cards[0].tagName).toBe('BUTTON');
  });

  it('renders the retry button on error', async () => {
    swapi.error = new Error('Failed to load resources. Please try again.');
    setRoute('characters');
    await fixture.whenStable();
    fixture.detectChanges();

    const banner = fixture.nativeElement.querySelector('.error-banner');
    expect(banner).toBeTruthy();
    expect(banner.querySelector('.retry-button')).toBeTruthy();
  });
});
