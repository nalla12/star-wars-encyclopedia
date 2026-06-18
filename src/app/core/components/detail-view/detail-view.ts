import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { toObservable } from '@angular/core/rxjs-interop';
import { map, switchMap } from 'rxjs/operators';
import { of, combineLatest } from 'rxjs';
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
  MGLT: 'MGLT',
  cargo_capacity: 'Cargo Capacity (kg)',
  vehicle_class: 'Vehicle Class',
  classification: 'Classification',
  designation: 'Designation',
  average_height: 'Average Height (cm)',
  average_lifespan: 'Average Lifespan (years)',
  hair_colors: 'Hair Colors',
  skin_colors: 'Skin Colors',
  eye_colors: 'Eye Colors',
  language: 'Language',
};

@Component({
  selector: 'app-detail-view',
  templateUrl: './detail-view.html',
  styleUrl: './detail-view.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DetailViewComponent {
  private readonly swapiService = inject(SwapiService);
  private readonly wookieepediaService = inject(WookieepediaService);
  private readonly destroyRef = inject(DestroyRef);

  readonly category = input.required<string>();
  readonly resourceId = input.required<string>();

  protected readonly resource = signal<Record<string, unknown> | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly imageUrl = signal<string | null>(null);

  protected readonly resourceTitle = computed(() => {
    const item = this.resource();
    return String(item?.['name'] ?? item?.['title'] ?? item?.['model'] ?? 'Unknown');
  });

  protected readonly detailEntries = computed(() => {
    const item = this.resource();
    if (!item) return [];

    return Object.entries(item)
      .filter(([key, value]) => {
        if (key.startsWith('_') || key === 'url' || key === 'uid' || key === 'description' || key === 'created' || key === 'edited') return false;
        return !(typeof value === 'string' && (value.startsWith('http://') || value.startsWith('https://')));
      })
      .map(([key, value]) => ({
        key,
        label: FIELD_LABELS[key] ?? this.labelize(key),
        value: this.formatValue(value),
      }));
  });

  constructor() {
    combineLatest([toObservable(this.category), toObservable(this.resourceId)]).pipe(
      takeUntilDestroyed(this.destroyRef),
      switchMap(([cat, id]) => {
        if (!cat || !id) return of(null);
        this.isLoading.set(true);
        this.error.set(null);
        this.imageUrl.set(null);
        return this.swapiService.getResource<Record<string, unknown>>(cat, parseInt(id, 10)).pipe(
          map(data => this.mapDetail(data)),
        );
      }),
      switchMap(item => {
        if (!item) return of(null);
        this.resource.set(item);
        this.isLoading.set(false);

        const title = String(item?.['name'] ?? item?.['title'] ?? item?.['model'] ?? '');
        if (!title || title === 'Unknown') return of(null);

        return this.wookieepediaService.getImageURL(title);
      }),
    ).subscribe(url => this.imageUrl.set(url));
  }

  private mapDetail(data: Record<string, unknown>): Record<string, unknown> {
    return {
      ...data,
      uid: String(data['id'] ?? ''),
    };
  }

  private labelize(key: string): string {
    return key
      .replace(/_/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
  }

  private formatValue(value: unknown): string {
    if (value === null || value === undefined) return '—';
    if (Array.isArray(value)) {
      const filtered = value.filter(v => typeof v !== 'string' || (!v.startsWith('http://') && !v.startsWith('https://')));
      return filtered.length > 0 ? filtered.join(', ') : '—';
    }
    return String(value);
  }
}
