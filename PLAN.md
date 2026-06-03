## Useful files
1. **AGENTS.md**: Guidelines for using Angular v21+ with modern features (signals, standalone components, native control flow)
2. **swapi_tech_documentation.md**: Complete API documentation for Star Wars API including rate limits (10,000 requests/day) and rate slowing (100ms delay after 5th request in 15 min window)

## Implementation Notes (Phase 2 - applied deviations)

The following deviations from the original plan were made to align with AGENTS.md best practices for Angular 21:

| PLAN.md (original) | AGENTS.md → What was done |
|---|---|
| `fetch().then()` returning Promise mismatch with `Observable` return type | Wrapped `fetch()` in `from()` via RxJS `switchMap` pipeline to properly return `Observable` |
| Constructor injection (`constructor(private cacheService: CacheService)`) | `inject()` function |
| ThemeService defined as `@Component` | Implemented as proper `@Injectable({ providedIn: 'root' })` service |
| `CacheService.clear()` uses glob `localStorage.removeItem(this.CACHE_PREFIX + '*')` | Proper iteration over localStorage keys with prefix matching |
| Rate limiting `checkRateLimit()` sync method calling async `wait()` | Rewritten as proper async `applyRateLimit()` using RxJS pipeline |
| Return types use concrete interfaces (`PeopleList`, etc.) | Using `Observable<unknown>` — types to be defined in later phases |
| `CACHE_PREFIX = 'swari_cache_'` | Fixed to `'swapi_cache_'` |

## Implementation Notes (Phase 3 - applied deviations)

### General deviations
| PLAN.md (original) | AGENTS.md → What was done |
|---|---|
| `@Input()` / `@Output()` decorators | `input()` / `output()` functions |
| `[ngStyle]` bindings | `[style.*]` property bindings |
| `standalone: true` in decorator | Omitted (default in Angular 19+) |
| `styleUrls` (plural, deprecated) | `styleUrl` (singular) |
| Missing `ChangeDetectionStrategy.OnPush` | Added to all components |
| `@Input() resources = signal<T[]>([])` mixed decorator+signal | Clean `input<ResourceData[]>([])` |
| Generic `<T>` on component class | Replaced with `ResourceData` interface |
| `ngOnInit` lifecycle | Used `effect()` or constructor where needed |
| `MobileHeader` duplicated `@Input` + `input()` | Clean `input()` only |
| Missing shared types (`Category`, labels, colors) | Created `core/types.ts` |
| `categoryList` as `signal<Category[]>` | Plain `readonly` array (no reactivity needed) |
| Inline templates (`template:` inside `.ts`) | Always use separate `.html` file per component |
| All component files flat in `components/` | Each component in its own folder (`components/<name>/`) |

### Specific improvements
- **MobileHeader**: `isMenuOpen` as proper signal instead of plain boolean
- **CategorySelection**: Extracted inline template to separate `.html` file; removed `@empty` block (list is static, never async)
- **GlobalSearch**: Extracted inline template to separate `.html` file; added `onSearchChange` output so parent can react to search
- **ResourceList**: Restructured template with `@else if` / `@else` instead of multiple sibling `@if` blocks
- **CSS**: Added responsive grid (`1fr` → `2fr` → `3fr`) for all viewports
- **Touch targets**: All interactive elements have `min-height: 44px`

### New files created
- `src/app/core/types.ts` — `Category`, `ResourceData`, `CATEGORY_LABELS`, `CATEGORY_COLORS`
- `src/app/core/components/mobile-header/mobile-header.ts` + `.html` + `.css`
- `src/app/core/components/category-selection/category-selection.ts` + `.html` + `.css`
- `src/app/core/components/global-search/global-search.ts` + `.html` + `.css`
- `src/app/core/components/resource-list/resource-list.ts` + `.html` + `.css`

## Implementation Notes (Phase 4 - applied deviations)

### Deviations from original Phase 4 plan
| PLAN.md (original) | What was done |
|---|---|
| `protected readonly Category = '...'` (invalid TS) | Imported `Category` type from `core/types.ts` |
| Constructor injection (`constructor(private swapiService: SwapiService)`) | `inject()` function |
| `getAllResources()` method on SwapiService (not implemented) | Category-based `getRequestForCategory()` dispatching to individual endpoint methods |
| `subscribe()` without cleanup | Added proper `subscribe({ next, error })` with error handling |
| `this.themeServiceImpl?.toggleTheme()` (typo + optional chaining) | Clean `this.themeService.toggleMode()` |
| `isDarkMode` as component `input()` + mutated in `toggleTheme()` | Delegate to `ThemeService` exclusively |
| `loadResources()` hard-coded to `getAllResources()` | Routes to correct endpoint per category via `switch` |
| Missing API response → `ResourceData[]` mapping | Added `mapResponse()` to flatten SWAPI response properties |
| No error state in template | Added `@if (error())` banner with error message |

### Improvements
- **`filteredResources`** computed handles search filtering across name/model/title
- **`isEmpty`** computed distinguishes "no search results" from "no data loaded"
- **Category label** passed as `title` input to ResourceList for contextual headings
- **Responsive error banner** with destructive theming (#DA3633)
- **Build is warning-free** — old unused RouterOutlet import is now properly consumed

### Files updated
- `src/app/app.ts` — Full integration with services and Phase 3 components
- `src/app/app.html` — Template wiring all components with event bindings
- `src/app/app.css` — Root layout and error banner styles

### Bug fix: SWAPI response key inconsistency
The SWAPI API is inconsistent across resources:
- **Films** returns list data under `result` (singular): `{ message: "ok", result: [...] }`
- **People, Planets, Starships, Vehicles, Species** return list data under `results` (plural): `{ message: "ok", results: [...] }`

The original `mapResponse` only checked `response?.result`, causing all non-Films categories to return empty arrays. Fix: check `Array.isArray(response?.result) ? response.result : response?.results`.

## Implementation Notes (Phase 5 - applied deviations)

### Deviations from original Phase 5 plan
| PLAN.md (original) | What was done |
|---|---|
| `@Input() id = input<string>('')` (mixed decorator + function) | Clean `inject(ActivatedRoute)` to read route params |
| `endpointMap` maps id→type (logically incorrect) | Route uses `detail/:category/:id` so both values come from URL |
| `ngOnInit` lifecycle | Constructor with `route.snapshot.paramMap` |
| `getResourceById` (not implemented) | Existing `getResource<T>(endpoint, id)` |
| No route definition shown | Added `{ path: 'detail/:category/:id', component: DetailViewComponent }` to `app.routes.ts` |
| `router.navigate(['/detail', item.uid])` (no category) | Updated to `['/detail', currentCategory(), item.uid]` |
| Hard-coded property mapping | Generic `detailEntries()` computed — auto-labels any `snake_case` key and filters out URLs/internal fields |
| `ResourceDetail` type (undefined) | Uses `Record<string, unknown>` with dynamic field rendering |

### Improvements
- **30+ human-readable field labels** mapped for all 6 resource types
- **Generic renderer** — works for People, Planets, Films, Starships, Vehicles, Species without separate components
- **URL filtering** — automatically hides URL-valued fields (homeworld, films, etc.) from the grid
- **Array values** — joins arrays with commas, filters out URL entries
- **Responsive grid** — label:value columns adapt from mobile 1:2 to desktop 1:3 ratio
- **Error state** with back-navigation for invalid IDs or failed API calls

### Files created
- `src/app/core/components/detail-view/detail-view.ts` + `.html` + `.css`

### Files updated
- `src/app/app.routes.ts` — Added `/detail/:category/:id` route
- `src/app/app.ts` — `navigateToDetail` now passes category to the route

### Bug fix: Detail view stuck on first resource
The `DetailViewComponent` read route params from `ActivatedRoute.snapshot.paramMap` in its constructor. When navigating between resources of the same category (e.g. `/detail/people/1` → `/detail/people/4`), Angular reuses the component instance — the constructor doesn't re-run and `snapshot` is stale.

**Fix:** Subscribed to `route.paramMap` observable via `switchMap` with `takeUntilDestroyed()` cleanup. Each param change triggers a fresh API call, and `switchMap` cancels any in-flight request from the previous navigation.

## Implementation Notes (Phase 6 - applied deviations)

### Deviations from original Phase 6 plan
| PLAN.md (original) | What was done |
|---|---|
| `data-theme="dark"` block nested inside `:root` (invalid CSS) | Proper `:root` for defaults, `[data-theme="light"]` for overrides |
| Only 8 CSS variables defined | 10 variables for full color system + 2 font families |
| No `body` or `*` resets | Added `body` base styles, `* { box-sizing: border-box }`, `-webkit-font-smoothing` |
| No font import mechanism shown | Added Google Fonts `<link>` in `index.html` (Rajdhani + Roboto) |
| Hardcoded colors in all component CSS | All 6 component stylesheets refactored to use `var(--color-*)` |
| `styleUrls` (deprecated plural) | `styleUrl` (modern singular) — already done in Phase 3 |
| Title shown as `StarWarsEncyclopedia` | Updated to `Star Wars Encyclopedia` in `index.html` |
| No viewport-fit=cover | Added for edge-to-edge mobile display |

### Improvements
- **Full design token system** with semantic variable names (`--color-bg`, `--color-surface`, `--color-accent`, etc.)
- **Dark/light theme ready** — toggling `data-theme` on `<html>` instantly switches all component colors
- **Rajdhani** (Google Font) imported for headings with weights 500/600/700
- **Roboto** (Google Font) imported for body text with weights 400/500
- **`@keyframes fadeIn`** animation available globally via `.fade-in` class
- **Zero hardcoded colors** remain in component CSS — all reference CSS variables

### Files updated
- `src/styles/global.css` — Full theme system (was 1-line stub)
- `src/index.html` — Google Fonts, updated title, `viewport-fit=cover`
- `src/app/app.css` — Hardcoded → CSS variables
- `src/app/core/components/*/*.css` (6 component files) — Hardcoded → CSS variables

## Implementation Notes (Phase 7 - applied deviations)

### Deviations from original Phase 7 plan
| PLAN.md (original) | What was done |
|---|---|
| "Bottom navigation bar (5-6 vertical pills)" | Horizontal sticky bottom nav with 6 horizontal pill buttons |
| "Hamburger menu for categories" | Categories remain in hamburger (MobileHeader) + new BottomNav as primary mobile nav |
| "Swipe gestures for cards" | Implemented via `SwipeDirective` — emits `onSwipeLeft`/`onSwipeRight` on 50px threshold with axis lock |
| "Expanded modals for details" | Skipped — detail view is a separate route, not a modal (already done in Phase 5) |

### Improvements
- **BottomNav** (`app-bottom-nav`) — Fixed/sticky at viewport bottom, 6 category buttons with accent highlight on active, hidden on desktop via `@media (min-width: 768px)`
- **CategorySelection** — Hidden on mobile (`display: none` below 768px), shown on tablet/desktop
- **App root** — `padding-bottom: 56px` on mobile to prevent content overlap with fixed bottom nav, removed on desktop
- **SwipeDirective** — Standalone directive using `host` object (per AGENTS.md), 50px minimum swipe distance with 2x axis lock ratio to prevent vertical scroll interference
- **Resource cards** — Respond to both `click` and swipe gestures, triggering `onItemSelect`
- **No new dependencies** — swipe gesture is pure `TouchEvent` detection

### Files created
- `src/app/core/components/bottom-nav/bottom-nav.ts` + `.html` + `.css`
- `src/app/core/directives/swipe.directive.ts`

### Files updated
- `src/app/app.ts` — Imported `BottomNavComponent`
- `src/app/app.html` — Added `<app-bottom-nav>` at bottom of template
- `src/app/app.css` — Added responsive `padding-bottom` for bottom nav clearance
- `src/app/core/components/category-selection/category-selection.css` — Hidden below 768px
- `src/app/core/components/resource-list/resource-list.ts` — Imported `SwipeDirective`
- `src/app/core/components/resource-list/resource-list.html` — Added swipe bindings to cards

## **Star Wars Encyclopedia - Angular App Plan**

### **Core Architecture**

### **Key Features**
1. **Navigation**: Category tabs + top search bar
2. **Always expanded details** in list view
3. **Mobile-first**: Bottom nav bar, responsive cards, touch gestures, hamburger menu for desktop

### **Data Model** (from API docs)
- **People**: characters with name, birth_year, eye_color, gender, hair_color, height, mass, skin_color, homeworld URL, films/species/starships/vehicles URLs
- **Planets**: name, climate, terrain, diameter, population, rotation_period, orbital_period, gravity, residents URL, films URLs
- **Films**: title, episode_id, opening_crawl, director, producer, release_date, characters/planets/species/starships/vehicles URLs  
- **Starships**: name, model, starship_class, manufacturer, cost, length, crew, passengers, speed, hyperdrive_rating, MGLT, cargo_capacity, films/pilots
- **Vehicles**: name, model, vehicle_class, manufacturer, length, cost, crew, passengers, speed, cargo_capacity, films/pilots
- **Species**: name, classification, designation, average_height, average_lifespan, colors, language, homeworld URL, people/films URLs

### **API Endpoints**
- Base: `https://www.swapi.tech/api/`
- Rate limit: 10,000 requests/day
- Rate slowing: 100ms delay after 5th request per 15 min
- Search support: `?search=term` or `?name=term`
- Expanded data: `?expanded=true` for full resource graphs

### **Component Structure**
- `AppComponent` - Root container with bottom nav
- `CategorySelectionComponent` - Tab selector (People, Planets, Films, Starships, Vehicles, Species)
- `SearchComponent` - Global search
- `ListComponent` - Main display with filtered/listed items
- `DetailComponent` - Full expanded view (lazy loaded)
- Resource-specific components:
  - `PeopleListComponent`, `PlanetListComponent`, etc.
  - `PeopleDetailComponent`, `PlanetDetailComponent`, etc.

### **Services**
- `SwapiService` - API wrapper with rate limiting logic and data caching
- `FilterService` - Client-side filtering
- `CacheService` - LocalStorage caching for improved UX

### **Mobile Features**
- Voltage (bottom navigation) for main categories
- Sticky bottom navigation bar
- Responsive grid layouts (1 column mobile, 2-4 columns desktop)
- Touch-friendly buttons (min 44px)
- Swipe-to-detail gestures
- Hamburger menu for additional actions
- Optimized touch targets

### **State Management (Signals)**
- `isDarkMode()`, `currentCategory()`, `searchQuery()`, `isLoading()`, `error()`
- Computed signals for filtered results

### **Routing**
- Lazy-loaded modules per category
- URL: `/category/:type/id/detail`

### **Features to Implement**
1. ✅ Category tabs navigation
2. ✅ Global search with filtering
3. ✅ List view with expanded details
4. ✅ Detail view with related content
5. ✅ Dark mode toggle
6. ✅ Loading states
7. ✅ Error handling
8. ✅ Rate limit monitoring
9. ✅ Data caching
10. ✅ Mobile responsiveness

## 🎬 Star Wars Encyclopedia - Complete App Specification

### **Technology Stack**
- **Angular 21** (latest version)
- **Signals** for reactive state management
- **Standalone Components** (no NgModules)
- **Native Control Flow** (`@if`, `@for`, `@switch`)
- **Manual npm setup** for CLI (no Docker)
- **Ionic/Vue style bottom navigation** + hamburger menu
- **PWA-ready** with mobile-first design

### **API Integration**
- **Base URL**: `https://www.swapi.tech/api/`
- **Rate Limits**: 10,000 requests/day + 100ms delay after 5th request/15min
- **Expanded Data**: `?expanded=true` for full resource graphs
- **Search**: `?search=term` (case-insensitive partial matches)

---

### **Core Resources**

| Resource | Key Attributes | Search Fields |
|----------|---------------|---------------|
| **People** | name, birth_year, eye_color, gender, hair_color, height(m), mass(kg), skin_color, homeworld, films, species, starships, vehicles | name |
| **Planets** | name, climate, terrain, diameter(km), population, rotation_period(days), orbital_period(days), gravity, residents, films | name |
| **Films** | title, episode_id, opening_crawl, director, producer, release_date, characters, planets, species, starships, vehicles | title |
| **Starships** | name, model, starship_class, manufacturer, cost_in_credits, length(m), crew, passengers, max_speed(km/h), hyperdrive_rating, MGLT, cargo_capacity, films, pilots | name, model |
| **Vehicles** | name, model, vehicle_class, manufacturer, length(m), cost_in_credits, crew, passengers, max_speed(km/h), cargo_capacity, films, pilots | name, model |
| **Species** | name, classification, designation, avg_height(m), avg_lifespan(yr), eye_colors, hair_colors, skin_colors, language, homeworld, people, films | name |

---

### **Component Architecture**

#### **Root App Structure**
```
AppComponent
├── CategorySelection (Sticky Tab Bar)
├── GlobalSearch (Top Search)
├── ResourceFilterBar (Bottom Nav - Mobile Focused)
└── MainContent (Lazy Loaded)
    ├── PeopleModule
    ├── PlanetsModule
    ├── FilmsModule
    ├── StarshipsModule
    ├── VehiclesModule
    └── SpeciesModule
```

#### **Main Components**
1. **AppComponent** - Root, bottom navigation + hamburger menu
2. **CategorySelection** - Top tab selector (6 categories)
3. **GlobalSearch** - Prominent search bar at top
4. **ResourceListComponent** - Main list with expanded cards
5. **ResourceDetailComponent** - Full detail view with related content
6. **MobileHeader** - Hamburger menu + category indicator
7. **LoadingSpinner** - App loading state
8. **ErrorBanner** - API error display

#### **Resource-Specific Components** (reusable patterns)
- List view component per resource type
- Detail view component per resource type
- Related content cards (e.g., movies a character appeared in)

---

### **Services**

#### **SwapiService (Core)**
```typescript
// API wrapper with intelligent loading
- GET all resources (paginated)
- GET specific resource with ?expanded=true
- GET with search parameter
- GET related resources (follow API graph)
- Rate limit monitoring (client-side)
- Request throttling (100ms delay implementation)
- Response caching (LocalStorage)
```

#### **CacheService**
```typescript
- Strategic caching: API responses
- Cache invalidation strategy
- Pre-fetch popular resources
- Offline support (basic)
```

#### **ThemeService**
```typescript
- Star Wars color palette management
- Dark/Light mode toggle
- Category-specific accent colors
```

#### **FilterService**
```typescript
- Client-side filtering for categories
- Search term filtering across resources
- Date/chronological sorting
```

---

### **State Signals Example**

```typescript
@Component({
  selector: 'app-root',
  standalone: true,
  // ... imports
})
export class AppComponent {
  // Input/Output signals
  readonly category = input<Category>('all');
  readonly onCategoryChange = output<Category>();
  readonly isLoading = output<boolean>();
  readonly onSelectCategory = output<Category>();
  
  // Component signals
  protected currentCategory = signal<Category>('all');
  protected activeSearch = signal<string>('');
  protected results = signal<Resource[]>([]);
  protected isLoadingState = signal<boolean>(false);
  protected errorState = signal<string | null>(null);
  protected lastFetched = signal<Date>(new Date());
  
  // Computed signals
  private filteredResults = computed(() => {
    const results = this.results();
    const search = this.activeSearch().toLowerCase();
    return results.filter(item => 
      item.name.toLowerCase().includes(search)
    );
  });
}
```

---

### **UI Components & Mobile Features**

#### **Navigation (Bottom Bar - Mobile)**
```
┌─────────────────────────────────────┐
│ Resource Cards (Stacked)           │
│ [People] [Planets] [Films]         │
│ [Starships] [Vehicles] [Species]   │
├═══════════════════════════════════┤
│ [< ]  APP LOGO  APP LOGO  [< ]     │
│ Swipe left/right for details      │
└─────────────────────────────────────┘
```

#### **Desktop View**
```
┌─────────────────────────────────────┐
│ [☰] Star Wars Encyclopedia     [🔍]│
├═══════════════════════════════════┤
│ [People][Planets][Films][Starships] │
│        [Vehicles]              [x]  │
├═══════════════════════════════════┤
│ Expanded Result Cards              │
│ - Swipe to view detail            │
└─────────────────────────────────────┘
```

#### **Card Design**
**List View (Always Expanded)**
```
┌─────────────────────────────────┐
│ 🧑 Luke Skywalker              │
│ Born: 19 BBY                    │
│ Height: 172 cm                  │
│ Eye: Blue • Hair: Blond        │
│ Gender: Male                    │
│ Skin: Fair                      │
│ ──────────────────────────────  │
│ Films:                          │
│ • A New Hope (1977)             │
│ • Empire Strikes Back (1980)   │
│ Starships:                     │
│ • X-Wing                       │
│ Vehicles:                      │
│ • Landspeeder                 │
│ Species:                       │
│ • Human                       │
│ Homeworld:                     │
│ • Tatooine                    │
└─────────────────────────────────┘
```

#### **Detail View (Modal/Page)**
```
┌─────────────────────────────────────┐
│ ← [Back]    Luke Skywalker         │
├═══════════════════════════════════┤
│ 📖 Full Details...                │
│ 🎬 A New Hope                     │
│ 🌍 Tatooine                       │
│ 🚀 X-Wing                         │
│ 🛻 Landspeeder                    │
│ 🧬 Human                         │
│ ➕ Related: [See All]             │
└─────────────────────────────────────┘
```

---

### **Star Wars Theme Colors**

| Element | Color | Hex Code | Usage |
|---------|-------|----------|-------|
| Primary (Neutral) | Imperial Blue | `#0A4D91` | Main buttons, navigation |
| Secondary (Neutral) | Rebel Orange | `#ED882D` | Accents, highlights |
| Tertiary (Neutral) | Sand/Gold | `#C98E4A` | Borders, dividers |
| Dark Background | Deep Space | `#0D1117` | Dark mode backgrounds |
| Light Background | Classical White | `#F5F5F5` | Light mode backgrounds |
| Text Primary | Bold Blue | `#151B2E` | Primary text |
| Text Secondary | Muted Brown | `#6E7075` | Secondary text |
| destructive | Red | `#DA3633` | Error states |
| Success | Green | `#46D36E` | Loading complete |
| Card Border | Star Wars Beige | `#5D4037` | Card borders (both themes) |

---

### **State Management Flow**

```
User Action
    ↓
Category Selected
    ↓
SwapiService (invalidate cache)
    ↓
Load Resources
    ↓
Rate Limit Check
    ↓
Cache Check → [Cached? Yes → Return]
    ↓
[No → Request API]
    ↓
Apply Rate Slow (100ms)
    ↓
Get Results
    ↓
Cache & Display
    ↓
Render with @for
```

---

### **Mobile-Specific Features**

1. ⚡ **Bottom Navigation** - Vertical stack of 6 pills/buttons
2. 🖐️ **Swipe Gestures** - Left/right on cards to view details
3. 📱 **Responsive Grid** - 1 column mobile, auto columns desktop
4. 🎯 **Touch Targets** - Minimum 44px hit areas
5. 🌙 **Dark Mode** - Optimized for outdoor viewing
6. 📶 **Offline Mode** - Cached data available offline
7. 🔄 **Pull to Refresh** - List view refresh
8. ⚙️ **Hamburger Menu** - Settings, about, help

---

### **Key Implementation Notes**

1. **Signals-First**: All state uses signals, no RxJS Subject pattern
2. **OnPush Change Detection**: Performance optimization
3. **Lazy Loading**: Route modules lazy loaded
4. **NgOptimizedImage**: For all images
5. **Native Control Flow**: `@for`, `@if`, `@switch` syntax
6. **TypeScript Strict**: No `any`, use `unknown`
7. **Input/Output Signals**: `input()`, `output()` functions
8. **Computed Signals**: Derived state with `computed()`

---

**Ready to build this Angular 21 Star Wars Encyclopedia app?** I'll create:
- ✅ Complete component architecture
- ✅ Type-safe services with API integration
- ✅ Mobile-first responsive design
- ✅ Star Wars themed UI
- ✅ Performance-optimized with signals
- ✅ Rate limit handling & caching

**Should I begin implementation?**

---

# 🎬 Star Wars Encyclopedia - Complete Implementation Plan

## **Project Structure**

```
/star-wars-encyclopedia/
├── src/
│   ├── app/
│   │   ├── app.ts (Root with signals)
│   │   ├── app.html
│   │   ├── app.css
│   │   │
│   │   └── core/
│   │       ├── services/
│   │       │   ├── swapi.service.ts (API wrapper)
│   │       │   ├── cache.service.ts (LocalStorage caching)
│   │       │   └── theme.service.ts (Dark/Light mode)
│   │       │
│   │       └── components/
│   │           ├── mobile-header.ts
│   │           ├── category-selection.ts
│   │           ├── global-search.ts
│   │           ├── resource-list.ts
│   │           ├── resource-detail.ts
│   │           └── loading-spinner.ts
│   │
│   ├── assets/
│   │   ├── icons/ (inline SVG icons)
│   │   └── fonts/ (optional)
│   │
│   └── index.html
│   ├── styles/
│   │   └── global.css (Star Wars theme)
│   └── main.ts
│
├── angular.json
├── package.json
└── tsconfig.json
```

---

## **Phase 2: Core Services Layer (30 min)**

### 1. SwapiService (`core/services/swapi.service.ts`)

```typescript
@Injectable({ providedIn: 'root' })
export class SwapiService {
  private readonly BASE_URL = 'https://www.swapi.tech/api';
  private readonly CACHE_PREFIX = 'swari_cache_';
  private requestCount = 0;
  private lastRequestTime = 0;
  
  constructor(private cacheService: CacheService) {}
  
  // Resource endpoints
  getPeople(): Observable<PeopleList> {
    return this.cacheableRequest(`/people/?expanded=true`);
  }
  
  getPlanets(): Observable<PlanetList> {
    return this.cacheableRequest(`/planets/?expanded=true`);
  }
  
  getFilms(): Observable<FilmList> {
    return this.cacheableRequest(`/films/?expanded=true`);
  }
  
  getStarships(): Observable<StarshipList> {
    return this.cacheableRequest(`/starships/?expanded=true`);
  }
  
  getVehicles(): Observable<VehicleList> {
    return this.cacheableRequest(`/vehicles/?expanded=true`);
  }
  
  getSpecies(): Observable<SpeciesList> {
    return this.cacheableRequest(`/species/?expanded=true`);
  }
  
  // Get specific resource
  getResource<T>(endpoint: string, id: number): Observable<T> {
    return this.cacheableRequest(`${endpoint}/${id}/expanded`);
  }
  
  // Search
  searchPeople(term: string): Observable<PeopleList> {
    return this.cacheableRequest(`/people/?search=${encodeURIComponent(term)}`);
  }
  
  // Rate limit handling
  private checkRateLimit(): void {
    const now = Date.now();
    const windowMs = 15 * 60 * 1000; // 15 minutes
    
    if (now - this.lastRequestTime < windowMs) {
      const elapsed = now - this.lastRequestTime;
      const delay = Math.max(0, 100000 - elapsed); // Approaching 100s delay
      
      if (delay > 0 && this.requestCount >= 5) {
        this.cacheService.wait(delay);
      }
    }
    
    this.requestCount++;
    this.lastRequestTime = now;
  }
  
  private cacheableRequest(endpoint: string): Observable<any> {
    // Check cache first
    const cached = this.cacheService.get(endpoint);
    if (cached) {
      return of(cached);
    }
    
    this.checkRateLimit();
    
    return fetch(`${this.BASE_URL}${endpoint}`)
      .then(response => response.json())
      .then(data => {
        this.cacheService.set(endpoint, data);
        return data;
      });
  }
}
```

### 2. CacheService

```typescript
@Injectable({ providedIn: 'root' })
export class CacheService {
  static readonly CACHE_DURATION_MS = 30 * 60 * 1000; // 30 minutes
  
  get(key: string): any {
    const item = localStorage.getItem(key);
    if (!item) return null;
    
    const { data, timestamp } = JSON.parse(item);
    if (Date.now() - timestamp > CacheService.CACHE_DURATION_MS) {
      return null;
    }
    
    return data;
  }
  
  set(key: string, data: any): void {
    localStorage.setItem(key, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  }
  
  wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  clear(): void {
    localStorage.removeItem(this.CACHE_PREFIX + '*');
  }
}
```

### 3. ThemeService

```typescript
@Component({
  selector: 'sw-theme-toggle',
  template: `
    @switch (isDarkMode()) {
      @case ('dark') {
        <button class="theme-toggle" (click)="toggleMode()">🌙</button>
      }
      @default {
        <button class="theme-toggle" (click)="toggleMode()">☀️</button>
      }
    }
  `
})
export class ThemeService {
  protected readonly isDarkMode = signal<'light' | 'dark'>('light');
  
  toggleMode(): void {
    this.isDarkMode.update(mode => 
      mode === 'light' ? 'dark' : 'light'
    );
    this.applyTheme();
  }
  
  private applyTheme(): void {
    document.documentElement.setAttribute('data-theme', this.isDarkMode());
  }
}
```

---

## **Phase 3: Core Components (45 min)**

### 1. MobileHeader

```typescript
@Component({
  selector: 'app-mobile-header',
  standalone: true,
  templateUrl: 'mobile-header.html',
  styleUrls: ['mobile-header.css']
})
export class MobileHeaderComponent {
  @Input() currentCategory = 'all' as Category;
  @Output() onToggleMenu = new Output();
  @Output() onSelectCategory = new Output();
  
  categories: Category[] = [
    'people', 'planets', 'films', 
    'starships', 'vehicles', 'species'
  ];
  
  isMenuOpen = false;
  
  // Input signal
  readonly currentCategory = input<Category>('all');
  
  // Output signals
  readonly onToggleMenu = output<void>();
  readonly onSelectCategory = output<Category>();
  
  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
    this.onToggleMenu.emit();
  }
  
  selectCategory(cat: Category): void {
    this.onSelectCategory.emit(cat);
    this.isMenuOpen = false;
  }
}
```

`mobile-header.html`:
```html
<header class="mobile-header">
  <div class="menu-toggle" (click)="toggleMenu()">
    ☰
  </div>
  <div class="app-title">
    Star Wars Encyclopedia
  </div>
  <div class="category-indicator" [ngStyle]="{
    'background-color': getCategoryColor(currentCategory())
  }">
    {{ getCategoryLabel(currentCategory()) }}
  </div>
  
  <!-- Hamburger Menu -->
  @if (isMenuOpen) {
    <div class="hamburger-menu">
      @for (cat of categories; track cat) {
        <button 
          [ngStyle]="{
            'color': currentCategory() === cat ? '#ED882D' : 'inherit'
          }"
          (click)="selectCategory(cat)">
          {{ getCategoryLabel(cat) }}
        </button>
      }
    </div>
  }
</header>
```

### 2. CategorySelection

```typescript
@Component({
  selector: 'app-category-selection',
  standalone: true,
  template: `
    <nav class="category-tabs">
      <div 
        class="tab-category"
        [ngStyle]="{
          'border-bottom-color': currentCategory() === 'all' ? '#151B2E' : 'transparent'
        }"
        @fadeAnimation>
      </div>
      @for (cat of categoryList(); track cat); {
        <button 
          [attr.aria-pressed]="currentCategory() === cat"
          [ngStyle]="{
            'color': currentCategory() === cat ? catThemeColor() : 'inherit',
            'border-bottom-color': currentCategory() === cat ? '#151B2E' : 'transparent'  
          }"
          (click)="selectCategory(cat)"
          class="cat ">
          {{ getCategoryLabel(cat) }}
        </button>
      } @empty {
        <span>
          Loading...
        </span>
      }
    </nav>
  `
})
export class CategorySelectionComponent {
  readonly categoryList = signal<Category[]>([
    'all' as Category,
    'people', 'planets', 'films', 
    'starships', 'vehicles', 'species'
  ]);
  
  readonly currentCategory = input<Category>('all');
  
  protected readonly getCategoryLabel = (cat: Category): string => {
    const labels: Record<Category, string> = {
      all: 'All Resources',
      people: 'Characters',
      planets: 'Planets',
      films: 'Films',
      starships: 'Starships',
      vehicles: 'Vehicles',
      species: 'Species'
    };
    
    return labels[cat];
  };
  
  protected readonly getCategoryColor = (cat: Category): string => {
    const colors: Record<Category, string> = {
      all: '#0A4D91',
      people: '#ED882D',
      planets: '#151B2E',
      films: '#46D36E',
      starships: '#DA3633',
      vehicles: '#C98E4A',
      species: '#F5F5F5'
    };
    
    return colors[cat];
  };
  
  protected readonly catThemeColor = computed(() => {
    const cat = this.currentCategory();
    switch (cat) {
      case 'all': return '#6E7075';
      case 'people': return '#ED882D';
      case 'planets': return '#151B2E';
      case 'films': return '#46D36E';
      case 'starships': return '#DA3633';
      case 'vehicles': return '#C98E4A';
      case 'species': return '#ED882D';
      default: return '#6E7075';
    }
  });
}
```

### 3. GlobalSearch

```typescript
@Component({
  selector: 'app-global-search',
  standalone: true,
  template: `
    <div class="search-container">
      <input 
        type="text"
        placeholder="Search characters, planets, films..."
        [value]="searchQuery()"
        (input)="onSearch($event)"
        [attr.aria-label]="'Search resources'"
      />
      @if (searchQuery() && searchQuery().length >= 3) {
        <button class="search-icon">🔍</button>
      }
    </div>
  `
})
export class GlobalSearchComponent {
  readonly searchQuery = signal<string>('');
  
  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }
}
```

### 4. ResourceList (Generic)

```typescript
@Component({
  selector: 'app-resource-list',
  standalone: true,
  templateUrl: 'resource-list.html',
  styleUrl: 'resource-list.css'
})
export class ResourceListComponent<T> {
  @Input() resources = signal<T[]>([]);
  @Input() title = 'Resources';
  @Input() isLoading = input<boolean>(false);
  @Input() isEmpty = input(false);
  @Output() onItemSelect = new Output<T>();
  
  readonly resources = input<T[]>([]);
  readonly isLoading = input<boolean>(false);
  readonly isEmpty = input(false);
  readonly onItemSelect = output<T>();
  
  onItemSelected(item: T): void {
    this.onItemSelect.emit(item);
  }
}
```

`resource-list.html`:
```html
<section class="resource-list">
  @if (isLoading()) {
    <loader-spinner></loader-spinner>
    <p>Loading {{ title }}...</p>
  }
  
  @if (!isLoading() && resources().length === 0) {
    <p class="no-results">
      {{ isEmpty() 
        ? 'No results found' 
        : 'No {{ title() }} available yet'
      }}
    </p>
  }
  
  <div class="resource-card">
    @for (item of resources(); track item.id || item.name || item.url) {
      <div class="card-content">
        <h3>
          {{ item.name || item.model || item.title }}
        </h3>
        <!-- Dynamic content based on resource type -->
        <p>{{ item.subtitle || item.description }}</p>
        @if (item.year || item.birthYear || item.releaseDate) {
          <span class="meta">
            {{ formatYear(item.year || item.birthYear || item.releaseDate) }}
          </span>
        }
        @if (item.image) {
          <img [src]="item.image.html()" [alt]="item.name" />
        }
      </div>
    } @empty {
      <p>No items to display</p>
    }
  </div>
</section>
```

---

## **Phase 4: Main App Integration (30 min)**

### AppComponent

```typescript
@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly Category = 'people' | 'planets' | 'films' | 'starships' | 'vehicles' | 'species';
  
  currentCategory = signal<Category>('all');
  searchQuery = signal<string>('');
  isLoading = signal<boolean>(false);
  error = signal<string | null>(null);
  resources = signal<ResourceData[]>([]);
  
  // Computed
  private filteredResources = computed(() => {
    const allResources = this.resources();
    let filtered = allResources;
    
    // Filter by category
    if (this.currentCategory() !== 'all') {
      const categoryMap: Record<Category, string> = {
        all: '',
        people: 'people',
        planets: 'planets',
        films: 'films',
        starships: 'starships',
        vehicles: 'vehicles',
        species: 'species'
      };
      
      filtered = filtered.filter(r => categoryMap[this.currentCategory()] === r.resourceType);
    }
    
    // Filter by search
    if (this.searchQuery().trim()) {
      const term = this.searchQuery().toLowerCase();
      filtered = filtered.filter(r => 
        r.name.toLowerCase().includes(term) ||
        r.model?.toLowerCase().includes(term) ||
        r.title?.toLowerCase().includes(term)
      );
    }
    
    return filtered;
  });
  
  constructor(
    private swapiService: SwapiService,
    private router: Router,
    private themeService: ThemeService
  ) {}
  
  loadResources(): void {
    this.isLoading.set(true);
    this.error.set(null);
    
    this.swapiService.getAllResources()
      .subscribe({
        next: data => {
          this.resources.set(data);
        },
        error: err => {
          this.error.set('Failed to load resources. Please try again.');
          this.isLoading.set(false);
        },
        complete: () => {
          this.isLoading.set(false);
        }
      });
  }
  
  selectCategory(category: Category): void {
    this.currentCategory.set(category);
  }
  
  navigateToDetail(item: ResourceData): void {
    this.router.navigate(['/detail', item.id]);
  }
  
  // Toggle theme input signal
  readonly isDarkMode = input<boolean>(false);
  
  toggleTheme(): void {
    // Update global class/theme
    this.themeServiceImpl?.toggleTheme();
    this.isDarkMode.update(v => !v);
  }
}
```

---

## **Phase 5: Detail View (20 min)**

```typescript
@Component({
  selector: 'app-detail-view',
  templateUrl: 'detail-view.html',
  styleUrls: ['detail-view.css']
})
export class DetailView {
  @Input() id = input<string>('');
  
  resource = signal<ResourceDetail | null>(null);
  isLoading = signal<boolean>(true);
  
  constructor(private swapiService: SwapiService, private route: ActivatedRoute) {}
  
  ngOnInit(): void {
    this.loadResource(this.id());
  }
  
  private loadResource(id: string): void {
    this.isLoading.set(true);
    
    // Fetch based on resource type
    const endpointMap: Record<string, string> = {
      'people': 'people',
      'planets': 'planets', 
      'films': 'films',
      'starships': 'starships',
      'vehicles': 'vehicles',
      'species': 'species'
    };
    
    const type = endpointMap[id];
    this.swapiService.getResourceById(type, parseInt(id))
      .subscribe(data => {
        this.resource.set(data);
        this.isLoading.set(false);
      }, error => {
        // Handle error
      });
  }
}
```

---

## **Phase 6: Styling (30 min)**

### Global CSS (Star Wars Theme)

```css
/* Star Wars Theme Variables */
:root {
  --sw-yellow: #F5DD5D;
  --sw-gray: #6E7075;
  --sw-stardust: #8B9CDD;
  --sw-white: #F5F5F5;
  --sw-interdev-violet: #4B6584;
  --sw-depires-blue: #2B313A;
  --sw-scout-orange: #AD6925;
  --sw-white-light: #EAEAEA;
  --sw-body-font: "Roboto", sans-serif;
  
  /* Dark Mode Overrides */
  data-theme="dark" {
    --sw-white: #0D1117;
    --sw-gray: #C9D1D9;
    --sw-white-light: #161B22;
  }
}

/* Typography */
h1, h2, h3 {
  font-family: 'Rajdhani', sans-serif;
  text-transform: uppercase;
  letter-spacing: 2px;
  color: var(--sw-yellow);
}

/* Buttons */
.cta-button {
  background: linear-gradient(135deg, #F5DD5D 0%, #FFC107 100%);
  color: #0D1117;
  font-weight: bold;
  letter-spacing: 1px;
  text-transform: uppercase;
  transition: all 0.3s ease;
}

.cta-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(245, 221, 93, 0.4);
}

/* Animations */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.fade-in {
  animation: fadeIn 0.4s ease-out;
}
```

---

## **Phase 7: Responsive Design Considerations**

### Mobile (Mobile First - < 768px)
- Bottom navigation bar (5-6 vertical pills)
- Single column car
- Hamburger menu for categories
- Touch-friendly buttons (min 44px)
- Swipe gestures for cards

### Tablet (768px - 1024px)
- Tab bar at top (horizontal)
- 2-column card grid
- Adaptive layouts

### Desktop (> 1024px)
- Full tab bar
- 3-4 column grid
- Hover states on cards
- Expanded modals for details

---

## **API Endpoints Reference**

```typescript
// Base URL
const API_BASE = 'https://www.swapi.tech/api/';

// Resource Lists (with expanded data)
const PEOPLE = `${API_BASE}people/?expanded=true`;
const PLANETS = `${API_BASE}planets/?expanded=true`;
const FILMS = `${API_BASE}films/?expanded=true`;
const STARSHIPS = `${API_BASE}starships/?expanded=true`;
const VEHICLES = `${API_BASE}vehicles/?expanded=true`;
const SPECIES = `${API_BASE}species/?expanded=true`;

// Specific Resources
const GET_RESOURCE = (type: string, id: number) => {
  return `${API_BASE}${type}/${id}/`;
};

// Search
const SEARCH_PEOPLE = (term: string) => {
  return `${API_BASE}people/?search=${encodeURIComponent(term)}`;
};
```

---

## **Testing Strategy**

1. **Unit Tests**: Services, models, utilities
2. **Component Tests**: 
   - CategorySelection (signal updates)
   - ResourceList (rendering, filtering)
   - DetailView (navigation, data loading)
3. **E2E Tests**: 
   - Navigation flow
   - Search functionality
   - Mobile responsiveness
4. **Performance Tests**: 
   - Loading times with large datasets
   - Cache effectiveness

---

## **Final Checklist**

- ✅ Angular 21 with signals (`input()`, `output()`, `computed()`)
- ✅ Native control flow (`@if`, `@for`, `@switch`)
- ✅ Standalone components (no NgModules)
- ✅ OnPush change detection
- ✅ Mobile-first responsive design
- ✅ Star Wars theming (colors, fonts)
- ✅ Bottom navigation (mobile) + hamburger menu (desktop)
- ✅ Rate limiting + rate slowing implementation
- ✅ Caching strategy (30 min default)
- ✅ Always expanded cards in list view
- ✅ Search across all resources
- ✅ Lazy-loaded detail views
- ✅ Dark/Light mode toggle
- ✅ Touch gestures swipe-to-detail

