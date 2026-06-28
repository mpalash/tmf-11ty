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
Hygraph CMS (GraphQL API) → `_data/*.js` fetch at build time → Nunjucks templates render HTML → Eleventy outputs to `_site/`

## Key Conventions
- **SCSS**: Partials prefixed with `_`, imported via `@use` in `styles.scss`. Design tokens are CSS custom properties defined in `_variables.scss`.
- **Breakpoints**: 480px (small), 600px (tablet), 720px (mid), 1024px (desktop), 1280px (wide). Not centralized as SCSS variables — used inline in media queries.
- **Grid**: CSS Grid with `subgrid`. 4-col mobile → 8-col tablet → 12-col desktop.
- **Animations**: GSAP v3.14 (ScrollTrigger, SplitText) loaded via CDN with `defer`. Custom JS in `public/js/`.
- **Images**: Eleventy Image Transform plugin auto-generates avif/webp/original at 800/1200/1600px widths. Default lazy loading.
- **Fonts**: Adobe Typekit (peridot-pe-variable) loaded via `<link>` in head-seo.njk with `preconnect`.

## Active JavaScript Files
| File | Loaded In | Purpose |
|------|-----------|---------|
| `heroReveal.js` | base.njk (global) | Hero video mask reveal + reduced-motion |
| `smoothScroll.js` | base.njk (global) | Lenis smooth scrolling init |
| `bgColorTransitionSmooth.js` | base.njk (global) | GSAP-based section bg color transitions |
| `headingAnimations-v2.js` | base.njk (global) | Blur-focus heading reveal animations |
| `imgReveal.js` | base.njk (global) | Image clip-path reveal on scroll |
| `columnScrollAnimation.js` | base.njk (global) | Column stagger animations |
| `accordion.js` | events.njk | Accordion toggle for event details |
| `youtube-embed.js` | events.njk | Lazy YouTube embed |
| `imgFadeIn.js` | events.njk | Image fade-in on load |
| `eventStatus.js` | eventsList.njk | Past/upcoming badge logic |
| `eventPosterHover.js` | eventsList.njk | Poster thumbnail hover reveal |
| `gallery.js` | (loaded per-page) | Image gallery lightbox |

### Script Loading Rules
- **Global scripts** (base.njk): Use `defer`. They appear after GSAP CDN scripts in the HTML, so execution order is correct.
- **Per-page scripts** (events.njk, eventsList.njk): Do **NOT** use `defer`. These appear inside `{{ content | safe }}` which renders before the GSAP CDN scripts. Without `defer`, they execute during HTML parsing when `document.readyState === 'loading'`, so their `DOMContentLoaded` listeners fire after all `defer` scripts (including GSAP) have completed.

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
GRAPH_TOKEN=   # Hygraph API bearer token
GRAPH_PATH=    # Hygraph GraphQL endpoint URL
ROOT_URL=      # Site URL override (optional)
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
