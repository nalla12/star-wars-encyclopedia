import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { DetailViewComponent } from './detail-view';
import { SwapiService } from '../../services/swapi.service';
import { WookieepediaService } from '../../services/wookieepedia.service';

interface DetailEntry {
  key: string;
  label: string;
  value: string;
}

interface TestableDetailView {
  resource(): Record<string, unknown> | null;
  resourceTitle(): string;
  categoryColor(): string;
  detailEntries(): DetailEntry[];
  error(): string | null;
  isLoading(): boolean;
  imageUrl(): string | null;
  imageFailed(): boolean;
  retry(): void;
  onImageError(): void;
}

class SwapiStub {
  detail: Record<string, unknown> | null = { id: 1, name: 'Luke Skywalker' };
  error: Error | null = null;
  requested: { category: string; id: string }[] = [];

  getDetail(category: string, id: string) {
    this.requested.push({ category, id });
    return this.error ? throwError(() => this.error) : of(this.detail ?? {});
  }
}

class WookieepediaStub {
  image: string | null = null;

  getImageURL() {
    return of(this.image);
  }
}

describe('DetailViewComponent', () => {
  let fixture: ComponentFixture<DetailViewComponent>;
  let component: TestableDetailView;
  let swapi: SwapiStub;
  let wookieepedia: WookieepediaStub;

  beforeEach(async () => {
    swapi = new SwapiStub();
    wookieepedia = new WookieepediaStub();

    await TestBed.configureTestingModule({
      imports: [DetailViewComponent],
      providers: [
        { provide: SwapiService, useValue: swapi },
        { provide: WookieepediaService, useValue: wookieepedia },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DetailViewComponent);
    component = fixture.componentInstance as unknown as TestableDetailView;
  });

  const setInputs = async (id = '1', category: 'characters' | 'planets' = 'characters') => {
    fixture.componentRef.setInput('category', category);
    fixture.componentRef.setInput('resourceId', id);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };

  it('requests the resource for the given category and id', async () => {
    await setInputs('3');
    expect(swapi.requested).toEqual([{ category: 'characters', id: '3' }]);
  });

  it('shows the resource name as the title', async () => {
    await setInputs();
    expect(component.resourceTitle()).toBe('Luke Skywalker');
  });

  it('falls back to the title, then the model, then Unknown', async () => {
    swapi.detail = { title: 'A New Hope' };
    await setInputs();
    expect(component.resourceTitle()).toBe('A New Hope');

    swapi.detail = { model: 'X-wing' };
    fixture.componentRef.setInput('resourceId', '2');
    await fixture.whenStable();
    fixture.detectChanges();
    expect(component.resourceTitle()).toBe('X-wing');

    swapi.detail = {};
    fixture.componentRef.setInput('resourceId', '3');
    await fixture.whenStable();
    fixture.detectChanges();
    expect(component.resourceTitle()).toBe('Unknown');
  });

  it('hides id, url and internal keys', async () => {
    swapi.detail = {
      id: 1,
      name: 'Luke Skywalker',
      url: 'https://example.com/luke',
      uid: '1',
      description: 'nope',
      created: 'today',
      edited: 'today',
      _internal: 'x',
    };

    await setInputs();

    expect(component.detailEntries().map((e) => e.key)).toEqual(['name']);
  });

  it('hides fields whose value is a URL', async () => {
    swapi.detail = { id: 1, name: 'Luke', homepage: 'https://example.com', affiliation: 'Rebels' };

    await setInputs();

    expect(component.detailEntries().map((e) => e.key)).toEqual(['name', 'affiliation']);
  });

  it('labels known fields and title-cases unknown ones', async () => {
    swapi.detail = { id: 1, birth_year: '19BBY', some_new_field: 'x' };

    await setInputs();

    expect(component.detailEntries()).toEqual([
      { key: 'birth_year', label: 'Birth Year', value: '19BBY' },
      { key: 'some_new_field', label: 'Some New Field', value: 'x' },
    ]);
  });

  it('renders numeric and array values as readable strings', async () => {
    swapi.detail = { id: 1, episode_id: 4, producers: ['Gary Kurtz', 'Rick McCallum'] };

    await setInputs();

    expect(component.detailEntries().map((e) => e.value)).toEqual([
      '4',
      'Gary Kurtz, Rick McCallum',
    ]);
  });

  it('renders an em dash for missing or URL-only array values', async () => {
    swapi.detail = { id: 1, empty: '', missing: null, links: ['https://a.test', 'https://b.test'] };

    await setInputs();

    expect(component.detailEntries().map((e) => e.value)).toEqual(['—', '—', '—']);
  });

  it('maps the category to its colour', async () => {
    await setInputs('1', 'planets');
    expect(component.categoryColor()).toBe('#151B2E');
  });

  it('surfaces a fetch error message', async () => {
    swapi.error = new Error('API error: 404 Not Found');

    await setInputs();

    expect(component.error()).toBe('API error: 404 Not Found');
    expect(component.isLoading()).toBe(false);
  });

  it('renders an error state with a retry button', async () => {
    swapi.error = new Error('API error: 500 Internal Server Error');

    await setInputs();

    const errorState = fixture.nativeElement.querySelector('.error-state');
    expect(errorState.textContent).toContain('API error: 500');
    expect(errorState.querySelector('.retry-button')).toBeTruthy();
  });

  it('recovers on retry', async () => {
    swapi.error = new Error('boom');
    await setInputs();
    expect(component.error()).not.toBeNull();

    swapi.error = null;
    component.retry();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.error()).toBeNull();
    expect(component.resourceTitle()).toBe('Luke Skywalker');
  });

  it('shows the image when one is found', async () => {
    wookieepedia.image = 'https://static.wikia.test/luke.jpg';

    await setInputs();

    const img = fixture.nativeElement.querySelector('.detail-image-wrapper img');
    expect(img.getAttribute('src')).toBe('https://static.wikia.test/luke.jpg');
    expect(img.getAttribute('loading')).toBe('lazy');
    expect(img.getAttribute('alt')).toBe('Luke Skywalker');
  });

  it('shows the initial-letter placeholder when no image exists', async () => {
    wookieepedia.image = null;

    await setInputs();

    const placeholder = fixture.nativeElement.querySelector('.image-placeholder');
    expect(placeholder.textContent.trim()).toBe('L');
  });

  it('falls back to the placeholder when the image fails to load', async () => {
    wookieepedia.image = 'https://static.wikia.test/broken.jpg';

    await setInputs();

    const img = fixture.nativeElement.querySelector('img');
    img.dispatchEvent(new Event('error'));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.image-placeholder')).toBeTruthy();
  });

  it('links the dialog to the resource title', async () => {
    await setInputs();

    const heading = fixture.nativeElement.querySelector('#detail-title');
    expect(heading.textContent).toBe('Luke Skywalker');
  });
});
