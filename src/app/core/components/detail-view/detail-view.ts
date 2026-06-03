import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { map, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { SwapiService } from '../../services/swapi.service';

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
  rotation_period: 'Rotation Period (days)',
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
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly resource = signal<Record<string, unknown> | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly error = signal<string | null>(null);

  protected readonly resourceTitle = computed(() => {
    const item = this.resource();
    return String(item?.['name'] ?? item?.['title'] ?? item?.['model'] ?? 'Unknown');
  });

  protected readonly detailEntries = computed(() => {
    const item = this.resource();
    if (!item) return [];

    return Object.entries(item)
      .filter(([key, value]) => {
        if (key.startsWith('_') || key === 'url' || key === 'uid' || key === 'description') return false;
        if (typeof value === 'string' && (value.startsWith('http://') || value.startsWith('https://'))) return false;
        return true;
      })
      .map(([key, value]) => ({
        key,
        label: FIELD_LABELS[key] ?? this.labelize(key),
        value: this.formatValue(value),
      }));
  });

  constructor() {
    this.route.paramMap.pipe(
      takeUntilDestroyed(this.destroyRef),
      switchMap(params => {
        const category = params.get('category');
        const id = params.get('id');
        if (!category || !id) {
          this.error.set('Invalid resource identifier.');
          this.isLoading.set(false);
          return of(null);
        }
        this.isLoading.set(true);
        this.error.set(null);
        return this.swapiService.getResource<unknown>(category, parseInt(id)).pipe(
          map(data => this.mapDetail(data)),
        );
      }),
    ).subscribe(item => {
      if (item) {
        this.resource.set(item);
        this.isLoading.set(false);
      }
    });
  }

  private mapDetail(data: unknown): Record<string, unknown> {
    const response = data as { result: { properties: Record<string, unknown>; description?: string; uid: string } } | null;
    const result = response?.result;
    if (!result?.properties) return {};

    return {
      ...result.properties,
      uid: result.uid,
      description: result.description,
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

  protected goBack(): void {
    this.router.navigate(['/']);
  }
}
