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
`.env` is gitignored — copy it from the main repo manually.

Sharp requires **version-matched** platform binaries:
```bash
npm install
npm install @img/sharp-libvips-darwin-arm64@1.0.4
```
The `@img/sharp-libvips-darwin-arm64` version **must match** what `@img/sharp-darwin-arm64` expects (check its `optionalDependencies` in `package.json`). Using `npm install --os=darwin --cpu=arm64 sharp` alone may install a mismatched libvips version.

## Session-End Update Instructions
At the end of each Claude Code session, update this file with:
- New patterns or conventions discovered
- Bugs found and fixed (briefly)
- Architectural decisions made
- Files added, removed, or significantly restructured
- Any gotchas or pitfalls encountered

This ensures mistakes are not repeated and learning is iterative across sessions.

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
