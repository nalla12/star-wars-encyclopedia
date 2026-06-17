import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map, switchMap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { Category, CATEGORY_LABELS, ResourceData } from '../../core/types';
import { GlobalSearchComponent } from '../../core/components/global-search/global-search';
import { ResourceListComponent } from '../../core/components/resource-list/resource-list';
import { CategorySelectionComponent } from '../../core/components/category-selection/category-selection';
import { DetailViewComponent } from '../../core/components/detail-view/detail-view';
import { SwapiService } from '../../core/services/swapi.service';

@Component({
  selector: 'app-list-page',
  imports: [
    GlobalSearchComponent,
    ResourceListComponent,
    CategorySelectionComponent,
    DetailViewComponent,
  ],
  templateUrl: './list-page.html',
  styleUrl: './list-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListPageComponent {
  private readonly swapiService = inject(SwapiService);
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly currentCategory = signal<Category>('characters');
  protected readonly searchQuery = signal('');
  protected readonly isLoading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly resources = signal<ResourceData[]>([]);
  protected readonly selectedResourceId = signal<string | null>(null);

  protected readonly isDetailView = computed(() => this.selectedResourceId() !== null);
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
    effect(() => {
      document.body.style.overflow = this.isDetailView() ? 'hidden' : '';
    });

    this.destroyRef.onDestroy(() => {
      document.body.style.overflow = '';
    });

    this.location.subscribe(() => {
      const segments = this.location.path().split('/').filter(Boolean);
      if (segments.length <= 1) {
        this.selectedResourceId.set(null);
      } else if (segments[0] === this.currentCategory()) {
        this.selectedResourceId.set(segments[1]);
      } else {
        this.selectedResourceId.set(null);
      }
    });

    this.route.params.pipe(
      takeUntilDestroyed(this.destroyRef),
      switchMap(params => {
        const cat = params['category'] as Category;
        this.currentCategory.set(cat);
        this.resources.set([]);
        this.isLoading.set(true);
        this.error.set(null);

        const segments = this.location.path().split('/').filter(Boolean);
        if (segments[0] === cat && segments.length > 1) {
          this.selectedResourceId.set(segments[1]);
        } else {
          this.selectedResourceId.set(null);
        }

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
      case 'characters': return this.swapiService.getCharacters();
      case 'planets': return this.swapiService.getPlanets();
      case 'films': return this.swapiService.getFilms();
      case 'starships': return this.swapiService.getStarships();
      case 'vehicles': return this.swapiService.getVehicles();
      case 'species': return this.swapiService.getSpecies();
    }
  }

  private mapResponse(data: any): ResourceData[] {
    if (!Array.isArray(data)) return [];

    return data.map(r => ({
      id: String(r.id),
      uid: String(r.id),
      name: String(r.name ?? r.title ?? r.model ?? ''),
      subtitle: '',
    }));
  }

  protected onSearchChange(query: string): void {
    this.searchQuery.set(query);
  }

  protected navigateToDetail(item: ResourceData): void {
    const url = `/${this.currentCategory()}/${item.uid}`;
    this.location.go(url);
    this.selectedResourceId.set(item.uid ?? null);
  }

  protected closeDetail(): void {
    const url = `/${this.currentCategory()}`;
    this.location.go(url);
    this.selectedResourceId.set(null);
  }
}
