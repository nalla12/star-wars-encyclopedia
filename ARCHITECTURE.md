# Architecture

## Stack

Angular 22 standalone components, Signals (`resource` / `rxResource` / `linkedSignal`), native control flow (`@if`/`@for`/`@switch`), zoneless change detection, CSS custom properties, `fetch()` (no `HttpClient`).

## Project Structure

```
src/
├── main.ts                          # Bootstrap entry
├── index.html                       # Host page (meta tags, Google Fonts, viewport-fit=cover)
├── styles/global.css                # Design tokens (CSS variables), dark theme
├── test-setup.ts                    # Vitest setup (matchMedia polyfill for jsdom)
└── app/
    ├── app.ts / .html / .css        # Root shell: mobile-header + router-outlet + bottom-nav
    ├── app.config.ts                # provideRouter(routes, withComponentInputBinding())
    ├── app.routes.ts                # 4 routes, lazy list-page, categoryGuard
    ├── core/
    │   ├── types.ts                 # Category, CATEGORIES, isCategory, labels, colors, ResourceData
    │   ├── guards/
    │   │   └── category.guard.ts    # Validates :category, redirects to /characters
    │   ├── icons/
    │   │   └── category-icons.ts    # CATEGORY_ICONS — SVG path data per category
    │   ├── services/
    │   │   ├── swapi.service.ts     # getCollection/getDetail + fetch() + cache
    │   │   ├── cache.service.ts     # localStorage, per-key TTL, quota eviction
    │   │   └── wookieepedia.service.ts # Fandom image lookup via fetch() + origin=*
    │   ├── directives/
    │   │   ├── swipe.directive.ts   # Touch gesture (50px threshold, axis lock, click suppression)
    │   │   └── scroll-lock.directive.ts # Body scroll lock, mobile viewports only
    │   └── components/
    │       ├── category-icon/       # Shared SVG icon renderer (takes a Category)
    │       ├── mobile-header/       # App title bar (hidden on desktop)
    │       ├── bottom-nav/          # 5 icon+label tabs, fixed bottom (hidden on desktop)
    │       ├── category-selection/  # 5 icon+label tabs, horizontal bar (hidden on mobile)
    │       ├── global-search/       # model<string> search box
    │       ├── resource-list/       # Button card grid with swipe, input-driven
    │       └── detail-view/         # Generic key-value grid, input-driven (no ActivatedRoute)
    └── pages/
        └── list-page/               # Route handler: rxResource list + detail sheet
```

## Routing

The URL is the single source of truth. Detail views are real routes.

| Path | Component | Behavior |
|------|-----------|----------|
| `/` | — | Redirects to `/characters` |
| `/:category` | `ListPageComponent` (lazy) | List of resources for a category |
| `/:category/:id` | `ListPageComponent` (lazy) | List with the detail sheet open |
| `**` | — | Redirects to `/characters` |

`/:category` and `/:category/:id` both carry `canActivate: [categoryGuard]`, which rejects anything outside `CATEGORIES` with a `UrlTree` to `/characters`.

Routes are configured with `withComponentInputBinding()`, so route params bind straight to `ListPageComponent` inputs:

- `category: input.required<Category>()`
- `id: input<string>()`

`isDetailView()` and `selectedResourceId()` are `computed()` from `id()`. Tapping a card calls `router.navigate(['/', category(), uid])`; closing calls `router.navigate(['/', category()])`. Browser back/forward works because the router owns the URL — no `Location.go()` or `popstate` handling.

## Data Flow

```
User taps a category tab
  → routerLink navigates to /:category
    → categoryGuard validates :category
      → ListPageComponent.category input updates
        → rxResource params change → SwapiService.getCollection()
          → CacheService.get() [hit → return cached]
          → fetch(swapi.online/api/<category>) [miss → store]
            → mapCollection() normalises to ResourceData[]
              → resources() computed → filteredResources() → UI renders

User taps a resource card
  → router.navigate(['/', category(), uid])
  → ListPageComponent.id input updates
  → isDetailView() computed → true
  → DetailViewComponent inputs change
  → rxResource → SwapiService.getDetail()  → detailEntries() computed → detail grid
  → second rxResource → WookieepediaService.getImageURL() → image
```

`rxResource` provides `value()`, `isLoading()`, `error()` and `reload()` directly, so there are no hand-rolled loading/error signals. The retry buttons call `reload()`.

## State Management

All state is local component state via signals. No global store.

- **Derived state**: `computed()` for `resources`, `filteredResources`, `isEmpty`, `isDetailView`, `selectedResourceId`, `categoryLabel`, `detailEntries`
- **Resets**: `linkedSignal` keyed on `category` clears `searchQuery` when the category changes
- **Side effects**: `effect()` inside `ScrollLockDirective`, `afterRenderEffect()` for focus management
- **No manual subscriptions**: `takeUntilDestroyed()` is only needed where an observable is owned outside a resource

## Detail Sheet (Responsive)

| Viewport | Behavior |
|----------|----------|
| Mobile (<768px) | Fixed bottom sheet slides up, 85vh max, backdrop + handle + close button |
| Tablet/Desktop (≥768px) | Sticky right panel (420px/480px) slides in next to the resource list |

Accessibility: the panel is `role="dialog"` with `aria-labelledby="detail-title"`, is `inert` when closed, closes on `Escape`, and moves focus to the sheet on open, restoring it on close. `ScrollLockDirective` locks body scroll via `matchMedia('(max-width: 767px)')` so it reacts to viewport changes.

## API Layer

| API | Base URL | Transport |
|-----|----------|-----------|
| SWAPI | `https://swapi.online/api` | `fetch()` |
| Star Wars Fandom | `https://starwars.fandom.com/api.php` | `fetch()` with `origin=*` |

- **No pagination** — collections return a flat array
- **Flat responses** — no `result.properties` nesting
- **Timeouts** — every request is wrapped in `AbortSignal.timeout(15_000)`, combined with the resource's `abortSignal` when one is supplied
- **Fandom CORS** — the API answers `Access-Control-Allow-Origin: *` when called with `origin=*`, so JSONP/`HttpClient` is not needed

## Caching

`CacheService` stores `swapi_cache_<key>` entries in `localStorage` as `{ data, timestamp, ttlMs }`.

| Data | TTL | Rationale |
|------|-----|-----------|
| SWAPI collections and details | 30 min | Static reference data |
| Fandom image found | 7 days | Thumbnails rarely change |
| Fandom image missing | 6 h | Retry later without hammering the API |

- `get()` returns `null` for a miss, an expired entry, corrupt JSON, or an entry with no timestamp — each case evicts the key
- `set()` catches `QuotaExceededError`, evicts the oldest entry, retries, and falls back to a full `clear()`
- Falsy payloads (`0`, `''`, `false`) are cached correctly — the miss check is `!== null`

## Services

| Service | Responsibility | providedIn |
|---------|---------------|------------|
| `SwapiService` | `getCollection`/`getDetail`, fetch, cache orchestration | root |
| `CacheService` | localStorage read/write, TTL, quota eviction | root |
| `WookieepediaService` | Fandom image lookup and best-match selection | root |

All use `inject()` (no constructor DI).

## Tooling

| Command | Purpose |
|---------|---------|
| `npm start` | Dev server |
| `npm run build` | Production build (budgets: 500 kB warn / 1 MB error initial) |
| `npm test` | Vitest via `@angular/build:unit-test` |
| `npm run lint` | ESLint (angular-eslint, TS, templates, a11y rules) |
| `npm run format` | Prettier |

`tsconfig.json` enables `noUnusedLocals` and `noUnusedParameters`.

## Conventions

- `input()` / `output()` / `model()` functions (never decorators); outputs are not prefixed with `on`
- Component selectors are `app-kebab-case`; directive selectors are `appCamelCase`
- `inject()` for DI (never constructor injection)
- `styleUrl` (singular), not `styleUrls`
- `ChangeDetectionStrategy.OnPush` on every component
- Separate `.html` template per component (no inline templates)
- `host` object for event listeners (no `@HostListener`/`@HostBinding`)
- `update()` / `set()` on signals (never `mutate()`)
- No `ngClass`/`ngStyle` — use `[class]`/`[style]` bindings
- Native control flow (`@if`/`@for`/`@switch`) — never `*ngIf`/`*ngFor`
- Interactive elements are real `<button>` elements so keyboard access and focus come for free
