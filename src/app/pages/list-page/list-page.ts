import type { ElementRef } from '@angular/core';
import {
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  linkedSignal,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { rxResource } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import type { Category, ResourceData } from '../../core/types';
import { CATEGORY_LABELS } from '../../core/types';
import { GlobalSearchComponent } from '../../core/components/global-search/global-search';
import { ResourceListComponent } from '../../core/components/resource-list/resource-list';
import { CategorySelectionComponent } from '../../core/components/category-selection/category-selection';
import { DetailViewComponent } from '../../core/components/detail-view/detail-view';
import { ScrollLockDirective } from '../../core/directives/scroll-lock.directive';
import { SwapiService } from '../../core/services/swapi.service';

@Component({
  selector: 'app-list-page',
  imports: [
    GlobalSearchComponent,
    ResourceListComponent,
    CategorySelectionComponent,
    DetailViewComponent,
    ScrollLockDirective,
  ],
  templateUrl: './list-page.html',
  styleUrl: './list-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListPageComponent {
  private readonly swapiService = inject(SwapiService);
  private readonly router = inject(Router);

  readonly category = input.required<Category>();
  readonly id = input<string>();

  protected readonly resourcesRef = rxResource<ResourceData[], Category>({
    params: () => this.category(),
    stream: ({ params, abortSignal }) =>
      this.swapiService
        .getCollection(params, abortSignal)
        .pipe(map((data) => this.mapCollection(data))),
  });

  protected readonly resources = computed<ResourceData[]>(() =>
    this.resourcesRef.hasValue() ? this.resourcesRef.value() : [],
  );

  protected readonly isLoading = computed(() => this.resourcesRef.isLoading());
  protected readonly error = computed(() => this.resourcesRef.error());

  protected readonly searchQuery = linkedSignal<Category, string>({
    source: () => this.category(),
    computation: () => '',
  });

  protected readonly isDetailView = computed(() => this.id() !== undefined);
  protected readonly selectedResourceId = computed(() => this.id() ?? null);

  protected readonly filteredResources = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return this.resources();

    return this.resources().filter((item) => item.name?.toLowerCase().includes(query));
  });

  protected readonly isEmpty = computed(() => {
    return this.resources().length > 0 && this.filteredResources().length === 0;
  });

  protected readonly categoryLabel = computed(() => CATEGORY_LABELS[this.category()]);

  private readonly sheetRef = viewChild<ElementRef<HTMLElement>>('sheet');
  private lastFocused: HTMLElement | null = null;

  constructor() {
    afterRenderEffect(() => {
      const open = this.isDetailView();
      const sheet = this.sheetRef()?.nativeElement;

      if (!open || !sheet || sheet.matches(':focus-within')) return;

      this.lastFocused = document.activeElement as HTMLElement | null;
      sheet.focus();
    });
  }

  protected restoreFocus(): void {
    this.lastFocused?.focus();
    this.lastFocused = null;
  }

  protected retry(): void {
    this.resourcesRef.reload();
  }

  protected navigateToDetail(item: ResourceData): void {
    this.router.navigate(['/', this.category(), item.uid]);
  }

  protected closeDetail(): void {
    this.restoreFocus();
    this.router.navigate(['/', this.category()]);
  }

  private mapCollection(data: Record<string, unknown>[]): ResourceData[] {
    if (!Array.isArray(data)) return [];

    return data
      .filter((item) => item['name'] ?? item['title'] ?? item['model'])
      .map((item) => ({
        id: String(item['id']),
        uid: String(item['id']),
        name: String(item['name'] ?? item['title'] ?? item['model']),
      }));
  }
}
