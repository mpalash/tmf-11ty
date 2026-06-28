# TMF-11ty — Claude Code Guide

## Project Overview
Tyeb Mehta Foundation website. Built with **Eleventy v3** (SSG), **Hygraph CMS** (headless), and deployed on **Netlify**. SCSS for styles, GSAP for scroll animations, Nunjucks templates.

## Commands
- `npm start` — Dev server with hot reload (port 8080)
- `npm run build` — Production build (sets `NODE_ENV=production`, disables CSS source maps)
- `npm run debug` — Build with Eleventy debug output

## Directory Structure
```
content/           # Eleventy input directory
  css/styles.scss  # Main SCSS entry point (imports all partials)
  events.njk       # Event detail pages (paginated from CMS data)
  pages.njk        # CMS pages (paginated)
  timelines.njk    # Timeline pages (paginated)
  search.njk       # Search page
_includes/
  layouts/base.njk # Base HTML layout (all pages extend this)
  components/      # Nunjucks partials (hero, header, footer, etc.)
  scss/            # SCSS partials (prefixed with _)
_data/             # Data files (fetch from Hygraph CMS via GraphQL)
  _lib/hygraph.js  # Shared fetchHygraph() helper (env, POST, TTL cache, debug) + shared GraphQL snippets
  meta.js          # Site metadata, nav links, SEO defaults
  pages.js         # CMS pages
  events.js        # CMS events
  timelines.js     # CMS timelines
_config/
  filters.js       # Nunjucks filters (date formatting, markdown, etc.)
public/
  js/              # Client-side JavaScript (passthrough copied to _site/)
  img/             # Static images
  vid/             # Video files (hero mask videos)
_site/             # Build output (gitignored)
eleventy.config.js # Eleventy configuration
```

## Data Flow
Hygraph CMS (GraphQL API) → `_data/_lib/hygraph.js` `fetchHygraph()` (TTL-cached via `@11ty/eleventy-fetch`) → `_data/*.js` (query + post-processing) → Nunjucks templates render HTML → Eleventy outputs to `_site/`

Each `_data/*.js` file is a thin wrapper: a GraphQL query string + a `fetchHygraph(query, label)` call + post-processing (e.g. events sort, meta fallback). The helper handles env vars, the POST, error handling, debug logging, and caching. Responses are cached in `.cache/` keyed on the query body — distinct queries cache separately. Cache duration: **1h in dev** (warm rebuilds skip the CMS network entirely), **0s in production** (always fresh); override with `GRAPH_CACHE_DURATION` (e.g. `0s`, `5m`, `1d`). Shared GraphQL snippets (`dest`, `seoImage`) are exported from `hygraph.js` to DRY the queries.

## Key Conventions
- **SCSS**: Partials prefixed with `_`, imported via `@use` in `styles.scss`. Design tokens are CSS custom properties defined in `_variables.scss`.
- **Breakpoints**: 480px (small), 600px (tablet), 720px (mid), 1024px (desktop), 1280px (wide). Not centralized as SCSS variables — used inline in media queries.
- **Grid**: CSS Grid with `subgrid`. 4-col mobile → 8-col tablet → 12-col desktop.
- **Animations**: GSAP v3.14 (ScrollTrigger, SplitText) loaded via CDN with `defer`. Custom JS in `public/js/`.
- **Images**: Eleventy Image Transform plugin auto-generates avif/webp/original at 800/1200/1600px widths. Default lazy loading.
- **Fonts**: Adobe Typekit (peridot-pe-variable) loaded via `<link>` in head-seo.njk with `preconnect`.

## Active JavaScript Files

### Global scripts (separate files in `public/js/`, loaded via `<script defer>` in base.njk)
| File | Purpose |
|------|---------|
| `heroReveal.js` | Hero video mask reveal + reduced-motion |
| `smoothScroll.js` | Lenis init — the **single scroll source of truth** (`lenis.on('scroll', ScrollTrigger.update)` drives all ScrollTriggers; `gsap.ticker` drives `lenis.raf`) |
| `bgColorTransitionSmooth.js` | Section bg-color via scrubbed GSAP ScrollTrigger tweens on `body.backgroundColor` (Phase H2 — no per-frame ticker) |
| `headingAnimations-v2.js` | Blur-focus heading reveal animations |
| `imgReveal.js` | IntersectionObserver + GSAP clip-path reveal only; markup/sizing emitted at build time by `components/imageReveal.njk` (Phase H1) |
| `columnScrollAnimation.js` | Column stagger animations |

### Per-page logic (inlined into `{% js %}` blocks, see Phase E)
| Logic | Template | Purpose |
|-------|----------|---------|
| Accordion | `events.njk` | Accordion toggle for event details |
| YouTube embed | `events.njk` | Lazy YouTube embed |
| Image fade-in | `events.njk` | Image fade-in + caption from alt |
| Parvus lightbox | `events.njk` | Image lightbox (`import` of vendor ESM) |
| Event status | `eventsList.njk` | Past/upcoming/ongoing badge logic |
| Poster hover | `eventsList.njk` | Poster thumbnail hover reveal (GSAP) |
| Marquee | `banner.njk` | GSAP infinite marquee |
| Nav toggle + header sentinel | `header.njk` | Mobile nav + IntersectionObserver header hide/show via `.header-sentinel` (Phase H3) |
| Back-to-top | `footer.njk` | Smooth scroll to top |
| Subscribe form | `subscribe.njk` | Async newsletter form submit |
| Site search | `search.njk` | Pagefind incremental search (dynamic `import('/pagefind/pagefind.js')`, Phase: pagefind migration) |

### Script Loading Rules
- **Global scripts** (base.njk): separate `public/js/*.js` files loaded via `<script defer>`.
- **Per-page scripts** (Phase E): inlined into `{% js %}{% endjs %}` paired shortcodes and bundled by `eleventy-plugin-bundle` into **one hashed module per page**, emitted to `_site/dist/` and loaded via `<script type="module" src="{% getBundleFileUrl 'js' %}">`.
  - The module `<script>` tag is placed **after** the deferred GSAP/animation scripts in base.njk. Module scripts are deferred and execute in document order, so this guarantees GSAP has loaded before the bundle runs — important because some IIFEs call their `init()` immediately (when `readyState !== 'loading'`) and bail if `gsap` is undefined.
  - Each moved script is wrapped in an IIFE (or was already one) so top-level declarations don't collide when all `{% js %}` blocks on a page concatenate into a single module.
  - Vendor lib Parvus is pulled in via top-level ES `import` from the passthrough-copied ESM build (`/js/parvus.esm.min.js`). Search uses Pagefind via a runtime dynamic `import('/pagefind/pagefind.js')` (generated post-build, see below).
  - Production: the `eleventy.after` terser hook minifies both `_site/js/` (script mode) and `_site/dist/` (module mode, preserves `import`).

## Video Masking Technique (Hero Section)
**Files**: `_includes/components/hero.njk`, `_includes/scss/_hero.scss`, `public/vid/vidMask_lo.mp4`

**How it works**: A `<video>` element is stacked on top of the hero `<img>` via CSS Grid (same grid-row). The video has `mix-blend-mode: screen` with `background-color: white`. White areas of the video become transparent (screen blending), dark areas reveal/mask the image beneath. On image load, the video plays to create an animated reveal effect.

### Known Improvement Opportunities
**High priority:**
1. Replace inline `onload` handler on hero img — currently pollutes global scope with `img` and `video` variables. Move to external JS with proper event listeners.
2. Add `prefers-reduced-motion` support — skip video playback, show static image instead.
3. Add WebM `<source>` before MP4 for ~30-40% smaller file size in Chrome/Firefox.
4. Consider CSS `mask-image` as a lighter alternative to video-based masking for static masks.

**Medium priority:**
5. Change `object-fit: fill` to `object-fit: cover` on video to prevent distortion at non-native aspect ratios.
6. Use IntersectionObserver for video playback — only play when hero is visible.
7. Skip video mask on mobile viewports for bandwidth/performance savings.

**Lower priority:**
8. Add `poster` attribute to `<video>` for faster perceived load.
9. Explore `requestVideoFrameCallback` for frame-accurate compositing.

## Environment Variables
```
GRAPH_TOKEN=            # Hygraph API bearer token
GRAPH_PATH=             # Hygraph GraphQL endpoint URL
ROOT_URL=               # Site URL override (optional)
GRAPH_CACHE_DURATION=   # Optional eleventy-fetch TTL override (e.g. 0s, 5m, 1h, 1d). Default: 1h dev / 0s prod
```

## Worktree / Fresh Clone Setup
`.env` is gitignored. For worktrees, **symlink** it from the main repo:
```bash
ln -s /path/to/main-repo/.env /path/to/worktree/.env
```
This keeps a single source of truth for environment variables. Do not copy — symlink ensures changes propagate automatically.

Sharp requires **version-matched** platform binaries:
```bash
npm install
npm install @img/sharp-libvips-darwin-arm64@1.0.4
```
The `@img/sharp-libvips-darwin-arm64` version **must match** what `@img/sharp-darwin-arm64` expects (check its `optionalDependencies` in `package.json`). Using `npm install --os=darwin --cpu=arm64 sharp` alone may install a mismatched libvips version.

**Always test the build** in the worktree before finalizing changes:
```bash
npx @11ty/eleventy                        # dev build
NODE_ENV=production npx @11ty/eleventy    # production build (with JS minification)
```

## Session-End Update Instructions
At the end of each Claude Code session, update this file with:
- New patterns or conventions discovered
- Bugs found and fixed (briefly)
- Architectural decisions made
- Files added, removed, or significantly restructured
- Any gotchas or pitfalls encountered

This ensures mistakes are not repeated and learning is iterative across sessions.

## Phase B — Accessibility (COMPLETE)

### SCSS edits — DONE
- `_accordion.scss` — added `.accordion-header` button reset (border/bg/padding/font/cursor/width)
- `_header.scss` — added button resets to `.toggle-nav` block
- `_events.scss` — `li a` selector expanded to `li a, .accordion-header`; `.all-event-details li a` changed to `.all-event-details li .accordion-header`
- `_typography.scss` — `h1::before { animation }` wrapped in `@media (prefers-reduced-motion: no-preference)`

### Template/JS edits — DONE

- **B1** `content/events.njk`: accordion `<a class="accordion-header">` → `<button type="button" ... aria-expanded="false" aria-controls="accordion-panel-{{ detailIdx }}">` ; `<div class="accordion-content">` → `<div class="accordion-content" id="accordion-panel-{{ detailIdx }}">`
- **B2** `_includes/components/header.njk`: hamburger `<a class="toggle-nav">` → `<button type="button" ... aria-expanded="false" aria-controls="primary-nav" aria-label="Toggle navigation">` ; `<nav>` → `<nav id="primary-nav">` ; inline script updated: querySelector uses `.toggle-nav`, removed `e.preventDefault()`, added `aria-expanded` toggle after class toggle
- **B3** Icon alt text: `header.njk` icons (`Open menu`, `Close`, `""`) ; `events.njk` expand/collapse (`Expand`, `Collapse`) ; `search.njk` clear icon (`Clear search`)
- **B4** `content/search.njk`: `<label for="search-input" class="visually-hidden">Search the site</label>` added before input
- **B5** Already done (typography SCSS)
- **B6** width/height on all icon/logo `<img>` tags: logos use CMS dimensions (`meta.headerLogo.width/height`, `meta.footerLogo.width/height`); icons use `width="24" height="24"`; expand/collapse use `width="64" height="64"`
- **B7** `content/events.njk` lightbox: `aria-label="View image: {{ i.caption }}"` added to each `<a class="lightbox">`
- **B8** Contrast fix: `.image-caption` changed from `var(--grey-500)` (#838178, 3.91:1 FAIL) to `var(--grey-600)` (#5f5e57, ~5.9:1 PASS AA) in `_globals.scss`. Other `--grey-500` usages (`_parvus.scss`, `_timelines.scss`) are on dark backgrounds and were not changed.

### Key architectural note
The `.accordion-header` SCSS reset is in `_accordion.scss`. The grid layout styling the header row comes from `_events.scss`. Both must be present for the button to look correct. `accordion.js` `e.preventDefault()` removed (was needed for `<a>`, no-op on `<button>`).

---

## Change Log
- **2026-03-02**: Initial CLAUDE.md created. Codebase audit completed:
  - Fixed CSS syntax error (`_globals.scss:183` missing comma in selector list)
  - Fixed typo (`_hero.scss:133` `padding-rght` → `padding-right`)
  - Removed broken `pageTransitions.js` script reference from `base.njk`
  - Moved scripts inside `<body>` with `defer` attribute (were outside `</body>`)
  - Consolidated 4 vendor-prefixed placeholder rules to `::placeholder`
  - Deduplicated identical OG image meta tag conditional
  - Made CSS source maps conditional on `NODE_ENV` (dev only)
  - Moved Typekit font from CSS `@import` to HTML `<link>` with `preconnect`
  - Added conditional video preload for hero pages
  - Removed unused JS files: `headingAnimations.js`, `bgColorTransition.js`, `animateOnScroll.js`, `pageLoader.js`
  - Removed commented-out debug import from `styles.scss`
- **2026-03-03**: Fixed GSAP loading error on Talks & Exhibitions and event detail pages:
  - Reverted `defer` on per-page scripts in `eventsList.njk` and `events.njk` — these load inside `{{ content | safe }}` before GSAP CDN scripts, so `defer` caused them to execute before GSAP was available
  - Added "Script Loading Rules" section documenting the `defer` vs non-`defer` pattern for global vs per-page scripts
- **2026-03-03**: Hero refinement, console log cleanup, JS minification:
  - Replaced inline `onload` handler on hero `<img>` with external `heroReveal.js` — eliminates global scope pollution (`img`, `video` vars)
  - Added `prefers-reduced-motion` support: CSS hides video and removes opacity transition; JS skips video playback and shows static image
  - Added error handling for hero: `video.play().catch()` for autoplay-blocked browsers, `img error` listener as fallback
  - Fixed `object-fit: fill` → `object-fit: cover` on hero video to prevent distortion
  - Removed empty `section[data-layout=hero]` ruleset and commented-out animation from `_hero.scss`
  - Removed all verbose `console.log` statements from client-side JS (smoothScroll, bgColorTransitionSmooth, headingAnimations-v2, imgReveal, accordion, eventStatus, imgFadeIn, eventPosterHover, columnScrollAnimation)
  - Cleaned up all commented-out `// console.*` dead code from JS files and `_data/*.js` files
  - Kept legitimate `console.error`/`console.warn` for real error conditions (missing dependencies, broken images)
  - Added `terser` as devDependency for production JS minification
  - Added `eleventy.after` event in `eleventy.config.js` — minifies all JS files in `_site/js/` during production builds with `drop_console: true` (strips any remaining console calls)
  - New file: `public/js/heroReveal.js` — hero video mask reveal logic
- **2026-06-28**: Phase A refactors (Steps 1–10) and Phase B SCSS (partial):
  - Step 1: Hoisted `markdownIt` instance to module scope in `_config/filters.js` — gotcha: the `quotes` string `'""'''` uses Unicode curly quotes as content (U+201C/D/18/19) with ASCII `'` (U+0027) as JS string delimiters; Edit tool replaced delimiters with curly variants causing SyntaxError; fixed via Python byte-level replacement
  - Step 2: Removed `import fetch from 'node-fetch'` from all four `_data/*.js` files; Node ≥18 global `fetch` takes over; `package.json` untouched
  - Step 3: Removed `checkAndInit` polling loop from `headingAnimations-v2.js`; DOMContentLoaded now calls `init()` directly; `typeof gsap === 'undefined'` guard retained
  - Step 4: Extracted `buildColorStops(sections, colorStops)` in `bgColorTransitionSmooth.js` — mutates array in-place so GSAP ticker keeps live reference; resize handler reduced to single call
  - Step 5: Removed `maximum-scale=1.0` from viewport meta in `head-seo.njk` (WCAG 1.4.4)
  - Step 6: `.DS_Store` already in `.gitignore` — no-op
  - Step 7: `@media (max-width: 1024px)` in `_variables.scss` trimmed from 10 tokens to 2 (only `--s-xxxl` and `--s-xxl` actually differ)
  - Step 8: New file `_includes/scss/_breakpoints.scss` — `@mixin bp($name)` with sm/tablet/mid/desktop/wide breakpoints; `@use 'breakpoints' as *` added to `styles.scss`; no CSS output change (mixin unused)
  - Step 9: `.visually-hidden:focus, .visually-hidden:focus-visible` added to `_reset.scss` — skip link at `base.njk:9` and `<main id="skip">` at line 14 already exist
  - Step 10: Input `:focus-visible` split from `:active, :focus` in `_globals.scss`; `box-shadow: 0 0 0 2px var(--sky-300)` added to `:focus-visible` only
  - Phase B SCSS: accordion-header button reset (`_accordion.scss`), toggle-nav button reset (`_header.scss`), `a`→`.accordion-header` selectors in `_events.scss`, `prefers-reduced-motion` guard on `h1::before` animation (`_typography.scss`) — all built and verified
- **2026-06-28 (continued)**: Phase B template/JS edits (B1–B7) completed, build verified:
  - `events.njk`: accordion `<a>` → `<button>` with `aria-expanded`/`aria-controls`; panel `id` added; lightbox `aria-label` added; expand/collapse icons got `alt` + dimensions
  - `header.njk`: hamburger `<a>` → `<button>` with `aria-expanded`/`aria-controls`/`aria-label`; `<nav id="primary-nav">`; script updated (selector, removed `e.preventDefault()`, added `aria-expanded` toggle); logo + icon `width`/`height` added
  - `search.njk`: visually-hidden label added; clear icon `alt` + dimensions added
  - `footer.njk`: logo + back-to-top icon `width`/`height` added
  - `accordion.js`: removed `e.preventDefault()` (no-op on `<button>`)
- **2026-06-28 (continued)**: Phase C build & structure cleanups completed:
  - C1: `--color-grey-light: var(--grey-50)` and `--border-major: 1px solid var(--grey-200)` added to `_variables.scss` — resolves undefined token refs in `_modal.scss`
  - C2: `body:after` → `body.debug:after` in `_debug.scss` — grid overlay now opt-in only
  - C3: `_heading-animations.scss` — extracted `@mixin heading-animate-words` for `.word`/`.animated .word` rules; three duplicate selector pairs collapsed to two nested blocks; CSS output identical
  - C4: `search-index.njk` pages loop — trailing comma now conditional: `{%- if not loop.last or timelines | length > 0 -%},{%- endif -%}`; output JSON always valid
  - C5: `metadata.language` and `metadata.url` merged into `meta.js` (added to both CMS success path and fallback); `base.njk` and `sitemap.xml.njk` updated to use `meta.*`; `_data/metadata.js` deleted
  - C6: Vercel confirmed as canonical host; deprecation comment added to `netlify.toml`
  - C7: `test-markup.njk` and `subscribe-netlify.njk` marked with `{# INACTIVE: ... #}` header comments
  - C8: Parvus wired from `node_modules/parvus/dist/js/parvus.esm.min.js` (passthrough copy to `js/parvus.esm.min.js`); `events.njk` now uses `{% js %}` bundle with `import Parvus from '/js/parvus.esm.min.js'` + init — no separate `<script>` tag; `public/js/parvus.min.js` retained on disk
- **2026-06-28 (continued)**: Phase D performance: third-party & asset pipeline:
  - D1: Lenis `<script>` moved to `<body>` footer with `defer`, placed before `smoothScroll.js`; Lenis CSS converted to non-blocking `<link rel="preload" as="style" onload="this.rel='stylesheet'">` with `<noscript>` fallback
  - D2: GSAP + Lenis + animation scripts wrapped in `{% if usesAnimations != false %}` in `base.njk`; `content/search.njk` opts out with `usesAnimations: false` in front matter — saves ~300KB of scripts on the search page
  - D3: `fuse.js@6.6.2` installed; `node_modules/fuse.js/dist/fuse.min.js` added to passthrough copy as `js/fuse.min.js`; CDN reference in `search.njk` replaced with `/js/fuse.min.js`
  - D4: Typekit `<link rel="stylesheet">` → `<link rel="preload" as="style" onload="...">` with `<noscript>` fallback in `head-seo.njk` — no longer render-blocking
  - D5: GTM `<script async>` + inline `gtag` config moved from `<head>` to end of `<body>` in `base.njk`; external script now uses `defer` instead of `async`
  - D6: `vidMask_lo.webm` encoded via ffmpeg VP9 (198KB vs 603KB MP4 — 67% smaller); `hero.njk` serves WebM first, MP4 as fallback
  - D7: Already done — Eleventy Image Transform plugin converts all `<img>` tags to `<picture>` with AVIF/WebP; hero preserves `loading="eager"`, `decoding="sync"`, `fetchpriority="high"`
  - D8: `lossless: true` removed from `eleventyImageTransformPlugin` `sharpOptions`
  - D9: `widths` updated to `[400, 600, 800, 1200, 1600, "auto"]`; all images now generate 400w/600w variants for mobile
  - D10: Already done — Eleventy Image Transform plugin already processes event thumbnail `<img>` tags into `<picture>` elements
- **2026-06-28 (continued)**: Phase E per-page script bundling (E1):
  - Migrated all per-page `<script>` tags into `{% js %}{% endjs %}` paired shortcodes across `events.njk`, `eventsList.njk`, `subscribe.njk`, `banner.njk`, `header.njk`, `footer.njk`, `search.njk`. Eleventy now emits one hashed module per page to `_site/dist/` (loaded by the existing `{% getBundleFileUrl "js" %}` in `base.njk`).
  - Moved the `<script type="module">` bundle tag in `base.njk` to **after** the deferred GSAP/animation scripts — guarantees GSAP is loaded before the bundle module runs (module scripts are deferred and execute in document order). This fixes the timing hazard for IIFEs that call `init()` immediately when `readyState !== 'loading'` and bail if `gsap` is undefined (e.g. poster hover).
  - Wrapped previously-top-level scripts (accordion/youtube classes in `events.njk`, `header.njk` consts/class, `footer.njk`, `subscribe.njk`) in IIFEs so declarations don't collide when all `{% js %}` blocks on a page concatenate into one module. Added null guards to `subscribe`/`footer`. Already-IIFE scripts (marquee, imgFadeIn, eventStatus, eventPosterHover) moved as-is.
  - Inlined and deleted the now-redundant first-party files: `public/js/{accordion,youtube-embed,imgFadeIn,eventStatus,eventPosterHover}.js`.
  - `search.njk` now uses `import Fuse from '/js/fuse.esm.min.js'` (the ESM build) instead of the UMD `<script src>` — a UMD bundled into a module breaks (`this` is `undefined` at module top level). Passthrough switched from `fuse.min.js` → `fuse.esm.min.js` in `eleventy.config.js`.
  - Extended the production `eleventy.after` terser hook to also minify `_site/dist/` in **module mode** (preserves `import` statements); `_site/js/` still minified in script mode.
  - Verified: clean production build passes; 13/13 pages get exactly one `/dist/*.js` module; bundles minified with imports intact; zero dangling references to removed files; accordion/search/eventStatus/posterHover/subscribe/marquee/header-scroll/back-to-top all wired through the bundle. The "Per-page scripts must NOT use defer" rule is obsolete and was replaced in the Script Loading Rules section above.
- **2026-06-29**: Phase F — CMS data layer (F1–F4):
  - F1: new `_data/_lib/hygraph.js` exports `fetchHygraph(query, label)` (env-var loading via dotenv, POST, error handling, debug logging) plus `debug`, `rootURL`, and shared GraphQL snippets `dest` (LinkButton destination union) and `seoImage` (SEO block, jmd only). Each `_data/*.js` is now query string + helper call + post-processing: meta 55, events 59, pages 36, timelines 36 lines (were 175/179/153/133).
  - F2: requests wrapped in `@11ty/eleventy-fetch` (`type:'json'`, `fetchOptions` POST). Cache key includes the POST `body` (RemoteAssetCache.js:52) so the four same-URL queries cache separately under `.cache/`. Duration: `1h` dev / `0s` prod, overridable via `GRAPH_CACHE_DURATION`. Warm dev rebuild drops CMS fetch from 60–240ms to 0–1ms (build 8.4s → 0.6s).
  - F3: removed the dev-only `isDevelopment ? mutate+_timestamp : passthrough` wrapper (and per-file dotenv/isDevelopment/debug boilerplate). `_timestamp` was set but never read by any template.
  - F4: trimmed only fields with no current or anticipated use. Dropped `jlg`/`url`/`caption` from `seo.image` (head-seo reads only `.jmd`); removed duplicate `mimeType`s; reduced oversized `first:` counts (events/pages 100→50, timelines 100→25, gallery/content 100→50). Image `mimeType`/`height`/`width` are **retained on all images** (incl. `seo.image`), and `googleMapsUrl`, `gallery.notes`, `dates.dateTimeDisplay` are **retained** — kept by request for likely future use even though no template references them yet.
  - Gotcha: timeline hero `destination` intentionally omits `__typename` (original did too) — it can't reuse the shared `dest` snippet, kept inline. Adding `__typename` could activate a dormant linkButton branch and change output.
  - Verified byte-identical: production build's `search-index.json` and `sitemap.xml` are exact-hash matches; all 13 HTML pages differ only in the per-build `currentBuildDate` comment. `.cache` and `.env` already gitignored.
- **2026-06-29**: Phase H — scroll system consolidation (H1–H4):
  - H1: image-reveal DOM mutation moved to build time. New `_includes/components/imageReveal.njk` partial emits `.image > .image-reveal-wrapper > img` with pre-computed `data-orientation`, `data-reveal-mode` ("aspect" vs "cover"=75vh) and inline `padding-bottom` (from CMS `i.width`/`i.height`, retained in Phase F). `pages.njk`/`timelines.njk` now `{% include %}` it (Nunjucks include shares context — set `isFullWidth` in scope first; there is no Liquid-style `with`). `imgReveal.js` reduced to IntersectionObserver + GSAP clip-path reveal only. Sizing that JS used to inline now lives in `_img-reveal.scss` keyed on `[data-reveal-mode]`/`[data-orientation]`. Reserving image boxes at first paint makes CLS ~0 (was a post-load reflow). Verified: all 19 timeline images byte-match the pre-phase layout (wrapper W/H, display mode, object-fit). Dropped the dead `data-aspect` attribute.
  - H2: `bgColorTransitionSmooth.js` rewritten — one scrubbed `ScrollTrigger` tween per `[data-bg-color]` section animating `body.backgroundColor` from the previous color (`scrub: 0.5`, `start: 'top bottom'`, `end: 'center center'`). Deleted the hex interpolation, the `gsap.ticker.add` per-frame writer, and the manual resize handler (ScrollTrigger auto-refreshes).
  - H3: `ScrollHeaderController` scroll listener replaced with an IntersectionObserver on a `.header-sentinel` div (absolutely positioned, `height: var(--nav-height)`, anchored to the top — out of the body grid). Off-screen → `hidden`, on-screen → `visible`. Note: there is **no CSS** for `header.hidden`/`header.visible`, so this is currently a no-op visually (header is `position: sticky`); the refactor's value is removing the per-event scroll listener while keeping the class hooks for future styling.
  - H4: only scroll source is Lenis — `grep "addEventListener('scroll'|onscroll|gsap.ticker.add"` over `public/js` is clean except smoothScroll's Lenis RAF/`lenis.on('scroll', …)` bridge.
  - **Gotcha (dev only)**: editing a SCSS *partial* under `_includes/scss/` during `npm start` does **not** recompile `styles.css` (Eleventy incremental doesn't track `@use` deps). Touch `content/css/styles.scss` (or restart) to force it. Full production builds compile correctly.
  - **Verification limit**: IntersectionObserver-driven behaviors (reveal trigger, header hide) couldn't be live-tested via browser automation — the automated tab is backgrounded (`visibilityState: 'hidden'`), which throttles IO/paint. Layout, CLS-reservation, bg-color scrub, and JS init were all verified; a quick manual scroll on a foreground tab is recommended to confirm reveal/header feel.
- **2026-06-29**: Pagefind search migration (replaces Fuse + monolithic `search-index.json`):
  - Build step: `eleventy.config.js` `eleventy.after` runs the Pagefind Node API (`createIndex` → `addDirectory({path:'_site'})` → `writeFiles`), in **both dev and prod** so `/pagefind/` is served on `npm start` too. It `fs.rmSync`'s `_site/pagefind` first — `writeFiles()` doesn't prune, so content-hashed fragments would otherwise accumulate across rebuilds.
  - Indexing scope: `base.njk` `<main{% if not excludeFromSearch %} data-pagefind-body{% endif %}>` — only `<main>` content is indexed (header/banner/footer excluded automatically), and the search page (`excludeFromSearch: true`) is skipped. Each `<article>` carries `data-pagefind-meta="title:{{ <type>.title }}"` so results get the CMS title — needed because the **homepage has no `<h1>`** in main (its result title would otherwise be empty).
  - `search.njk` rewritten: dynamic `import('/pagefind/pagefind.js')` + `pf.search()`; custom UI preserved (`.search-result` cards, `r.meta.title`, `r.excerpt` is Pagefind-generated HTML with `<mark>` highlights). Stale-response guard drops results if the input changed during the async search.
  - Removed: `content/search-index.njk`, the dead `searchIndex` collection, the redundant `searchIndexPromise` prefetch in `base.njk`, the `fuse.js` dependency + its passthrough.
  - **Events are now searchable** (the old `search-index.json` only indexed pages + timelines). This is intentional "better" coverage — to restore the old exclusion, add `excludeFromSearch: true` to `content/events.njk` front matter (drops `data-pagefind-body`).
  - **Payload tradeoff (honest):** for a site this small Pagefind is *heavier* upfront, not smaller — first search loads `pagefind.js` (~45KB) + `wasm.en` (~73KB) + index shard (~20KB) ≈ 137KB vs the old Fuse (~24KB) + `search-index.json` (~20KB) ≈ 44KB. Pagefind's fixed WASM engine dominates at this scale; its incremental advantage only wins once the monolithic index would be large (hundreds of KB). What *is* better: full-content BM25 ranking, highlighted excerpts, no upfront-blocking JSON load, and per-query fragments (~666b) loaded on demand.
  - Verified: index built (12 pages, correct CMS titles, search page excluded, events included); all `/pagefind/` assets serve 200; production minified search bundle preserves the dynamic import. Live in-browser search couldn't be automation-tested (Pagefind's WASM stalls in a backgrounded tab — `visibilityState: 'hidden'`); a foreground manual check is recommended. Index *content* was verified offline by decompressing fragments.
