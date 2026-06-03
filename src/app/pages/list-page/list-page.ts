import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map, switchMap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { Category, CATEGORY_LABELS, ResourceData } from '../../core/types';
import { GlobalSearchComponent } from '../../core/components/global-search/global-search';
import { ResourceListComponent } from '../../core/components/resource-list/resource-list';
import { CategorySelectionComponent } from '../../core/components/category-selection/category-selection';
import { InViewportDirective } from '../../core/directives/in-viewport.directive';
import { SwapiService } from '../../core/services/swapi.service';

@Component({
  selector: 'app-list-page',
  imports: [
    RouterOutlet,
    GlobalSearchComponent,
    ResourceListComponent,
    CategorySelectionComponent,
    InViewportDirective,
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
  protected readonly currentPage = signal(1);
  protected readonly totalPages = signal(0);
  protected readonly loadingMore = signal(false);

  protected readonly hasMoreData = computed(() => this.currentPage() < this.totalPages());

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
        this.currentPage.set(1);
        this.totalPages.set(0);
        this.resources.set([]);
        this.isLoading.set(true);
        this.error.set(null);
        return this.loadPage(cat, 1);
      }),
    ).subscribe({
      next: result => {
        this.resources.set(result.items);
        this.totalPages.set(result.totalPages);
        this.isLoading.set(false);
        this.drainCache();
      },
      error: () => {
        this.error.set('Failed to load resources. Please try again.');
        this.isLoading.set(false);
      },
    });
  }

  private drainCache(): void {
    if (this.hasMoreData() && !this.loadingMore()) {
      this.loadMore();
    }
  }

  protected loadMore(): void {
    if (this.loadingMore() || !this.hasMoreData() || this.searchQuery().trim()) return;
    this.loadingMore.set(true);
    const cat = this.currentCategory();
    const nextPage = this.currentPage() + 1;
    this.loadPage(cat, nextPage).subscribe({
      next: result => {
        this.resources.update(current => [...current, ...result.items]);
        this.currentPage.set(nextPage);
        this.totalPages.set(result.totalPages);
        this.loadingMore.set(false);
        this.drainCache();
      },
      error: () => {
        this.loadingMore.set(false);
      },
    });
  }

  private loadPage(cat: Category, page: number): Observable<{ items: ResourceData[]; totalPages: number }> {
    return this.getRequestForCategory(cat, page).pipe(
      map((data: any) => ({
        items: this.mapResponse(data),
        totalPages: data.total_pages ?? 1,
      })),
    );
  }

  private getRequestForCategory(cat: Category, page: number): Observable<unknown> {
    switch (cat) {
      case 'people': return this.swapiService.getPeople(page);
      case 'planets': return this.swapiService.getPlanets(page);
      case 'films': return this.swapiService.getFilms(page);
      case 'starships': return this.swapiService.getStarships(page);
      case 'vehicles': return this.swapiService.getVehicles(page);
      case 'species': return this.swapiService.getSpecies(page);
    }
  }

  private mapResponse(data: any): ResourceData[] {
    const items = Array.isArray(data?.result) ? data.result : data?.results;
    if (!items || !Array.isArray(items)) return [];

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
