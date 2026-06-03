import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map, switchMap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { Category, CATEGORY_LABELS, ResourceData } from '../../core/types';
import { GlobalSearchComponent } from '../../core/components/global-search/global-search';
import { ResourceListComponent } from '../../core/components/resource-list/resource-list';
import { CategorySelectionComponent } from '../../core/components/category-selection/category-selection';
import { SwapiService } from '../../core/services/swapi.service';

@Component({
  selector: 'app-list-page',
  imports: [
    RouterOutlet,
    GlobalSearchComponent,
    ResourceListComponent,
    CategorySelectionComponent,
  ],
  templateUrl: './list-page.html',
  styleUrl: './list-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListPageComponent {
  private readonly swapiService = inject(SwapiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly currentCategory = signal<Category>('people');
  protected readonly searchQuery = signal('');
  protected readonly isLoading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly resources = signal<ResourceData[]>([]);
  protected readonly isDetailView = signal(false);

  protected readonly filteredResources = computed(() => {
    const all = this.resources();
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return all;
    return all.filter(r =>
      (r.name?.toLowerCase().includes(query)) ||
      (r.model?.toLowerCase().includes(query)) ||
      (r.title?.toLowerCase().includes(query))
    );
  });

  protected readonly isEmpty = computed(() => {
    return this.resources().length > 0 && this.filteredResources().length === 0;
  });

  protected getCategoryLabel(cat: Category): string {
    return CATEGORY_LABELS[cat];
  }

  constructor() {
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => {
      this.isDetailView.set(this.router.url.split('/').filter(Boolean).length > 1);
    });

    this.route.params.pipe(
      takeUntilDestroyed(this.destroyRef),
      switchMap(params => {
        const cat = params['category'] as Category;
        this.currentCategory.set(cat);
        this.isLoading.set(true);
        this.error.set(null);
        return this.getRequestForCategory(cat).pipe(
          map(data => this.mapResponse(data)),
        );
      }),
    ).subscribe({
      next: items => {
        this.resources.set(items);
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set('Failed to load resources. Please try again.');
        this.isLoading.set(false);
      },
    });
  }

  private getRequestForCategory(cat: Category): Observable<unknown> {
    switch (cat) {
      case 'people': return this.swapiService.getPeople();
      case 'planets': return this.swapiService.getPlanets();
      case 'films': return this.swapiService.getFilms();
      case 'starships': return this.swapiService.getStarships();
      case 'vehicles': return this.swapiService.getVehicles();
      case 'species': return this.swapiService.getSpecies();
    }
  }

  private mapResponse(data: unknown): ResourceData[] {
    type ResultItem = { properties: Record<string, unknown>; uid: string; description?: string };
    const response = data as { result?: ResultItem[] | ResultItem; results?: ResultItem[] } | null;
    const items = Array.isArray(response?.result) ? response!.result : response?.results;
    if (!items) return [];

    return items.map(r => ({
      uid: r.uid,
      id: r.uid,
      name: String(r.properties?.['name'] ?? r.properties?.['title'] ?? r.properties?.['model'] ?? ''),
      subtitle: r.description,
    }));
  }

  protected onSearchChange(query: string): void {
    this.searchQuery.set(query);
  }

  protected navigateToDetail(item: ResourceData): void {
    this.router.navigate(['/', this.currentCategory(), item.uid]);
  }
}
