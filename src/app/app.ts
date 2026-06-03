import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { Category, CATEGORY_LABELS, ResourceData } from './core/types';
import { MobileHeaderComponent } from './core/components/mobile-header/mobile-header';
import { CategorySelectionComponent } from './core/components/category-selection/category-selection';
import { GlobalSearchComponent } from './core/components/global-search/global-search';
import { ResourceListComponent } from './core/components/resource-list/resource-list';
import { SwapiService } from './core/services/swapi.service';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    MobileHeaderComponent,
    CategorySelectionComponent,
    GlobalSearchComponent,
    ResourceListComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly swapiService = inject(SwapiService);
  private readonly themeService = inject(ThemeService);
  private readonly router = inject(Router);

  protected readonly currentCategory = signal<Category>('people');
  protected readonly searchQuery = signal('');
  protected readonly isLoading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly resources = signal<ResourceData[]>([]);

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
    this.loadResources();
  }

  private loadResources(): void {
    const cat = this.currentCategory();
    if (cat === 'all') {
      this.resources.set([]);
      this.isLoading.set(false);
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);

    this.getRequestForCategory(cat).pipe(
      map(data => this.mapResponse(data)),
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
      default: return this.swapiService.getPeople();
    }
  }

  private mapResponse(data: unknown): ResourceData[] {
    const response = data as { result: Array<{ properties: Record<string, unknown>; uid: string; description?: string }> } | null;
    if (!response?.result) return [];

    return response.result.map(r => ({
      uid: r.uid,
      id: r.uid,
      name: String(r.properties?.['name'] ?? r.properties?.['title'] ?? r.properties?.['model'] ?? ''),
      subtitle: r.description,
    }));
  }

  protected selectCategory(cat: Category): void {
    this.currentCategory.set(cat);
    this.loadResources();
  }

  protected onSearchChange(query: string): void {
    this.searchQuery.set(query);
  }

  protected navigateToDetail(item: ResourceData): void {
    this.router.navigate(['/detail', item.uid]);
  }

  protected toggleTheme(): void {
    this.themeService.toggleMode();
  }
}
