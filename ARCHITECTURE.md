# Architecture

## Stack
Angular 21 standalone components, Signals, RxJS, native control flow (`@if`/`@for`/`@switch`), CSS custom properties, `fetch()` API (no HttpClient).

## Project Structure

```
src/
├── main.ts                          # Bootstrap entry
├── index.html                       # Host page (Google Fonts, viewport-fit=cover)
├── styles/global.css                # Design tokens (CSS variables), dark/light theme
└── app/
    ├── app.ts / .html / .css        # Root shell: mobile-header + router-outlet + bottom-nav
    ├── app.config.ts                # provideRouter
    ├── app.routes.ts                # Routes: '' → /people, /:category → ListPageComponent
    ├── core/
    │   ├── types.ts                 # Category, CATEGORY_LABELS, CATEGORY_COLORS, CATEGORY_ICONS, ResourceData
    │   ├── services/
    │   │   ├── swapi.service.ts     # HTTP wrapper, cacheable GET via fetch() + rxjs from()
    │   │   ├── cache.service.ts     # localStorage with 30-min TTL
    │   │   └── theme.service.ts     # data-theme toggle (light/dark)
    │   ├── directives/
    │   │   └── swipe.directive.ts   # Touch gesture (50px threshold, axis lock)
    │   └── components/
    │       ├── mobile-header/       # App title bar (hidden on desktop)
    │       ├── bottom-nav/          # 6 icon+label tabs, fixed bottom (hidden on desktop)
    │       ├── category-selection/  # 6 icon+label tabs, horizontal bar (hidden on mobile)
    │       ├── global-search/       # Search input with output<string>()
    │       ├── resource-list/       # Card grid with swipe/click, shrunk layout input
    │       └── detail-view/         # Generic key-value grid, input-driven (no ActivatedRoute)
    └── pages/
        └── list-page/              # Route handler: loads resources, manages detail sheet, Location.go()
```

## Routing

Only 2 routes defined — detail views are NOT separate routes:

| Path | Component | Behavior |
|------|-----------|----------|
| `/` | — | Redirects to `/people` |
| `/:category` | `ListPageComponent` | Matches `people`/`planets`/`films`/`starships`/`vehicles`/`species` |

When a user taps a resource card, `ListPageComponent` calls `Location.go('/:category/:id')` to update the URL bar, then sets `selectedResourceId` signal to show the detail sheet. No Angular router navigation occurs — this avoids re-rendering the entire page. `Location.subscribe()` listens for browser back/forward (popstate) events to close the sheet.

## Data Flow

```
User taps category tab
  → routerLink navigates to /:category
    → ListPageComponent reads route.params
      → SwapiService.getCategory() via fetch() + from() + switchMap
        → CacheService.get() [cache hit → return]
        → fetch(swapi.online/api/…) [cache miss → store]
          → mapResponse() flattens JSON array → ResourceData[]
            → resources signal set → UI renders

User taps resource card
  → Location.go('/:category/:id')
  → selectedResourceId signal set
  → isDetailView() computed returns true
  → DetailViewComponent receives category + resourceId inputs
  → SwapiService.getResource() fetch
  → mapDetail() flattens → render detail grid
```

## State Management

All state is local component state via `signal()`. No global store.

- **Derived state**: `computed()` for `filteredResources`, `isDetailView`, `isEmpty`, `resourceTitle`, `detailEntries`
- **Side effects**: `effect()` for body scroll lock when detail sheet opens
- **Cleanup**: `takeUntilDestroyed()`, `destroyRef.onDestroy()`

## Detail Sheet (Responsive)

| Viewport | Behavior |
|----------|----------|
| Mobile (<768px) | Fixed bottom sheet slides up, 85vh max, backdrop + handle + close button |
| Tablet/Desktop (≥768px) | Sticky right panel (420px/480px) slides in next to resource list |

## API Layer

- **Base URL**: `https://swapi.online/api`
- **No pagination** — returns all resources in a flat array
- **Flat responses** — no `result.properties` nesting
- **Caching**: localStorage with `swapi_cache_` prefix, 30-minute TTL
- **No rate limiting** (swapi.online has no rate limits)

## Services

| Service | Responsibility | providedIn |
|---------|---------------|------------|
| `SwapiService` | HTTP GET, cache orchestration, response mapping | root |
| `CacheService` | localStorage read/write, TTL expiry | root |
| `ThemeService` | `data-theme` attribute toggle on `<html>` | root |

All use `inject()` function (no constructor DI).

## Conventions

- `input()` / `output()` functions (never decorators)
- `inject()` for DI (never constructor injection)
- `styleUrl` (singular), not `styleUrls`
- `ChangeDetectionStrategy.OnPush` on every component
- Separate `.html` template per component (no inline templates)
- `host` object for event listeners (no `@HostListener`/`@HostBinding`)
- `update()` / `set()` on signals (never `mutate()`)
- No `ngClass`/`ngStyle` — use `[class]`/`[style]` bindings
- Native control flow (`@if`, `@for`, `@switch`) — never `*ngIf`/`*ngFor`
