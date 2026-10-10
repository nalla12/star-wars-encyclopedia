import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';
import type { Category } from '../../types';
import { CATEGORY_COLORS } from '../../types';
import { SwapiService } from '../../services/swapi.service';
import { WookieepediaService } from '../../services/wookieepedia.service';

const FIELD_LABELS: Record<string, string> = {
  name: 'Name',
  title: 'Title',
  model: 'Model',
  birth_year: 'Birth Year',
  eye_color: 'Eye Color',
  gender: 'Gender',
  hair_color: 'Hair Color',
  height: 'Height (cm)',
  mass: 'Mass (kg)',
  skin_color: 'Skin Color',
  climate: 'Climate',
  terrain: 'Terrain',
  surface_water: 'Surface Water (%)',
  diameter: 'Diameter (km)',
  population: 'Population',
  rotation_period: 'Rotation Period (hours)',
  orbital_period: 'Orbital Period (days)',
  gravity: 'Gravity',
  episode_id: 'Episode',
  opening_crawl: 'Opening Crawl',
  director: 'Director',
  producer: 'Producer',
  release_date: 'Release Date',
  starship_class: 'Starship Class',
  manufacturer: 'Manufacturer',
  cost_in_credits: 'Cost (credits)',
  length: 'Length (m)',
  crew: 'Crew',
  passengers: 'Passengers',
  max_atmosphering_speed: 'Max Speed (km/h)',
  hyperdrive_rating: 'Hyperdrive Rating',
  mglt: 'MGLT',
  cargo_capacity: 'Cargo Capacity (kg)',
  consumables: 'Consumables',
  vehicle_class: 'Vehicle Class',
  classification: 'Classification',
  designation: 'Designation',
  average_height: 'Average Height (cm)',
  average_lifespan: 'Average Lifespan (years)',
  hair_colors: 'Hair Colors',
  skin_colors: 'Skin Colors',
  eye_colors: 'Eye Colors',
  language: 'Language',
  homeworld: 'Homeworld',
  species: 'Species',
};

const HIDDEN_KEYS = new Set(['id', 'url', 'uid', 'description', 'created', 'edited']);

interface DetailEntry {
  key: string;
  label: string;
  value: string;
}

@Component({
  selector: 'app-detail-view',
  templateUrl: './detail-view.html',
  styleUrl: './detail-view.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DetailViewComponent {
  private readonly swapiService = inject(SwapiService);
  private readonly wookieepediaService = inject(WookieepediaService);

  readonly category = input.required<Category>();
  readonly resourceId = input.required<string>();

  protected readonly detailRef = rxResource<
    Record<string, unknown>,
    { category: Category; id: string }
  >({
    params: () => ({ category: this.category(), id: this.resourceId() }),
    stream: ({ params, abortSignal }) =>
      this.swapiService.getDetail(params.category, params.id, abortSignal),
  });

  protected readonly resource = computed<Record<string, unknown> | null>(() =>
    this.detailRef.hasValue() ? this.detailRef.value() : null,
  );

  protected readonly isLoading = computed(() => this.detailRef.isLoading());
  protected readonly error = computed(() => this.detailRef.error()?.message ?? null);

  protected readonly resourceTitle = computed(() => {
    const item = this.resource();
    return String(item?.['name'] ?? item?.['title'] ?? item?.['model'] ?? 'Unknown');
  });

  protected readonly categoryColor = computed(() => CATEGORY_COLORS[this.category()]);

  protected readonly detailEntries = computed<DetailEntry[]>(() => {
    const item = this.resource();
    if (!item) return [];

    return Object.entries(item)
      .filter(([key, value]) => {
        if (key.startsWith('_') || HIDDEN_KEYS.has(key)) return false;
        return !this.isUrl(value);
      })
      .map(([key, value]) => ({
        key,
        label: FIELD_LABELS[key] ?? this.labelize(key),
        value: this.formatValue(value),
      }));
  });

  protected readonly imageRef = rxResource<string | null, string>({
    params: () => this.resourceTitle(),
    stream: ({ params, abortSignal }) => {
      if (params === 'Unknown') return of(null);
      return this.wookieepediaService.getImageURL(params, abortSignal);
    },
  });

  protected readonly imageUrl = computed(() => this.imageRef.value() ?? null);
  protected readonly imageLoading = computed(() => this.imageRef.isLoading());
  protected readonly imageFailed = signal(false);

  protected retry(): void {
    this.detailRef.reload();
  }

  protected onImageError(): void {
    this.imageFailed.set(true);
  }

  protected retryImage(): void {
    this.imageFailed.set(false);
    this.imageRef.reload();
  }

  private isUrl(value: unknown): boolean {
    return typeof value === 'string' && /^https?:\/\//.test(value);
  }

  private labelize(key: string): string {
    return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }

  private formatValue(value: unknown): string {
    if (value === null || value === undefined || value === '') return '—';
    if (Array.isArray(value)) {
      const filtered = value.filter((v) => !this.isUrl(v));
      return filtered.length > 0 ? filtered.join(', ') : '—';
    }
    return String(value);
  }
}
