# REPORT — La Voile Blanche digital menu + back office

Branch `redesign` (not pushed). Everything runs locally; nothing is deployed.
Screenshots were dropped at the client's request.

## 1. Result in one paragraph

The empty static page is now a server-rendered, trilingual menu (FR · عربي · EN) with all
**44 dishes in 9 categories** checked against the four photos, plus a French back office at
`/admin`. Prices are stored in millimes and shown as `42 DT` / `42 د.ت` (never `42,000`).
The menu is **consult-only**: guests scan the table QR code, read the menu and order from a waiter.
There is no cart, ordering or payment.

## 2. How to run and log in (local)

```
cd menu-voile-blanche
copy .env.example .env      # then choose ADMIN_PASSWORD (10+ characters)
npm install
npm run setup               # database, 44 dishes, admin account, temporary photos
npm run dev                 # http://localhost:4321  and  http://localhost:4321/admin
```

Login: the `ADMIN_USERNAME` (default `patron`) and `ADMIN_PASSWORD` from `.env`.
The local `.env` created during development contains a random password: open it to read it,
or change it and run `npm run db:reset`. The step-by-step owner guide is in `README.md`.

## 3. Quality

| | Before | After |
|---|---|---|
| Lighthouse mobile — Performance | 73 | **99** (FR, AR, EN) |
| Accessibility | 96 | **100** |
| Best practices | 96 | **100** |
| SEO | 91 | **100** |
| LCP (simulated slow 4G) | 4.6 s | **1.96 s** (FR 1.97 s, AR 1.96 s, EN 1.96 s) |
| CLS | 0 | 0–0.002 |
| Lighthouse desktop | — | **100 / 100 / 100 / 100**, LCP 0.4 s |
| Public JavaScript | 77 KB gzip (React) | **≈ 2.5 KB** gzip, no framework |
| HTML over the wire | — | 30 KB (brotli) |

Measured on the local production build (`npm run build`, `npm run lighthouse`), so real hosting
adds network latency that localhost does not have.

**Tests.** 33 unit tests: price format/parse, search normalisation, slugs, QR.
82 end-to-end runs (Playwright) on desktop Chrome, Pixel 7 and iPhone 14 (WebKit, iOS Safari engine):
- public menu, language routing, sheet, deep links, search, filters;
- axe WCAG 2.1 AA in FR/AR/EN, with the sheet open and with search open;
- JSON-LD, hreflang, sitemap, robots, compression, and no cross-script font downloads;
- back office: login and logout, refusal without a session, CSRF refusal, the category and dish
  lifecycle, a price change seen in 3 languages, and JSON import.

Lint, type-check (`astro check` + `tsc`, strict) and `db:verify` are clean.
One WebKit test (the "Pour 2" filter) failed once during a full run and passed in every rerun,
so treat it as a possible flake.

`npm audit --omit=dev`: 0 vulnerabilities. The only advisory is in `drizzle-kit`'s bundled
esbuild dev server, which is a development tool this project never runs as a server.

## 4. What changed

**Foundation**
- Vite/React SPA → **Astro 7** with on-demand server rendering, strict TypeScript and pinned dependencies.
- ESLint, Prettier, Vitest and Playwright added.
- `node_modules/` and `dist/` were untracked; a `.gitignore` was added.

**Data**
- SQLite (libSQL) + Drizzle migrations.
- `data/menu.verified.ts` holds the photo-verified menu; the seed is idempotent, and there are
  verify/reset scripts.
- A single price formatter, plus a Tunisian price parser (`42,000` = 42 DT).

**Design**
- Colour tokens (sail white, abyss navy, shutter blue for tappable things only, seaglass, sand hairlines).
- Self-hosted subset fonts, 2 weights each: Newsreader, Source Sans 3 renamed "Voile Sans",
  Noto Naskh Arabic, and IBM Plex Sans Arabic renamed "Voile Sans Arabic" (the renames follow OFL
  Reserved Font Name rules). Arabic fonts load only on `/ar`.
- The logo is recreated as SVG, and the logo's wave line is the one ornament.

**Menu**
- Signature strip and a sticky category bar with scroll-spy (a side rail on desktop).
- Printed-menu rows: name, dotted leader, price.
- Deep-linkable detail sheet (`/fr#slug`): focus trap, Esc, swipe down, back button, share.
- Search in 3 languages (accent-insensitive, Arabic normalisation) and the quick filters.
- Special handling for poisson du jour, Trésor and œufs de seiche; sold-out and hidden states;
  French fallback for missing translations.

**Images**
- `sharp` pipeline (AVIF/WebP/JPEG, 160–1280 px, blur-up placeholders, 4:3 or 16:9 crop).
- 24 temporary Unsplash photos, only where they genuinely show the dish, labelled
  « Photo d'illustration »; the other 17 dishes show the sail placeholder.
- `PHOTO-SHOT-LIST.md` and `PHOTO-CREDITS.md`.

**SEO**
- Per-language titles, canonical, hreflang, Open Graph images, JSON-LD
  `Restaurant → Menu → MenuSection → MenuItem → Offer (TND)`.
- Sitemap, a `robots.txt` that blocks `/admin`, and a favicon/app-icon set.

**QR**
- QR code (SVG, 2048 px PNG) for the menu root, and a printable A6 table card.
- Both are available from the back office and via `npm run qr`; both decode correctly.

**Back office**
- Covers everything in brief §12; details in the Phase 7 commit and the README.

### Deviations from PLAN.md, and why
- **No React islands in the back office.** Server-rendered forms plus one small script turned out
  simpler, faster on a phone, and they work without JavaScript. Drag-and-drop, the crop frame,
  the live price preview and the one-tap toggle are vanilla TypeScript.
- **TypeScript 6.0.3, not 7.** typescript-eslint and `@astrojs/check` don't support 7 yet.
- **No font preloads.** Measured on simulated 4G, preloads competed with the first photo (the LCP element).
- **HEIC uploads are not accepted.** The prebuilt `sharp` cannot decode them; iPhones convert to
  JPEG automatically when the page doesn't accept HEIC.

## 5. Photos vs. your transcription

All 44 names and prices matched the photos except:

| # | Point | Photo shows |
|---|---|---|
| D1 | Côtelettes d'agneau, "printed" column | printed **« Côtlettes d'Agneau »** |
| D2 | Trésor composition | printed singular forms (« Fruit de Mer en Sauce », « Beignet de Crevette », …) |
| D3 | Poulpe en sauce (arabe) | unreadable dot: « مثاومة » or « متاومة » |
| D4 | Veal dishes (arabe) | confirmed printed « لحم الضل » |
| D5 | Fruits de saison | first digit under glare, best reading 12,000 |
| D6 | Sorbet citron | partly glared, reads 8,000 |
| D7 | Poisson du jour | a scraped white patch sits between the two species groups |
| D8 | Section titles | printed « LES PÂTES » (includes the rice) and « LES MOLLUSQUES ET CRUSTACÉS » |

The corrections you approved are applied and listed in **`CONTENT-CHANGES.md`**: 44 French spelling
and sentence-case fixes, 8 Arabic differences, and 8 dishes flagged « à vérifier » in the back office.

## 6. Questions and placeholders for the owner

**Menu content** (each is flagged « à vérifier » on the dish in the back office):
1. Poulpe en sauce (arabe): is « مثومة قرنيط » right? The print is unreadable.
2. Veal dishes: « لحم العجل » replaced the printed « لحم الضل »: correct?
3. Fruits de saison, **12 DT**, and sorbet citron, **8 DT**: prices partly hidden by glare.
4. Poisson du jour:
   - does « Biologique / طبيعي » mean wild-caught? The menu says « sauvage » and never « bio ».
   - What was under the scraped patch: do mulet, sargue and serre have their own price per 100 g?
     Today all species show 14 DT / 100 g.
   - Do the Arabic species names match the French ones? The English for « Serre » is left as « Serre ».
5. The dessert page photos show **ice-cream sundaes**: are they on offer, and at what price?
6. Drafts to approve: all **English text**, all **descriptions**, all **Arabic section names**,
   Arabic text that isn't printed (descriptions, options, « مياه غازية »), and the tagline.
7. Name display: « Trésor fruits de mer » drops « (2 personnes) », which is shown as a « Pour 2 personnes » badge instead.

**Restaurant info** (pre-filled, marked « à confirmer » in Réglages):
- Phone: +216 22 287 799.
- Address: Route de Teniour km 1,5, Sfax. The Arabic « طريق تنيور كلم 1,5، صفاقس » is a transliteration to check.
- City: Sfax.
- Opening hours: Tuesday–Sunday, lunch and dinner, closed Monday. **Exact times are placeholders** `[HH:MM–HH:MM]`.
- Map link: a Google Maps search built from the address; replace it with the restaurant's own Maps link.
- Instagram `restaurant.la.voile.blanche`: **unverified**.
- Facebook profile 100064853971860: confirmed by you.
- **WhatsApp**: not provided (hidden while empty).
- **Domain / public address**: not provided. The QR code points to `http://localhost:4321/` until it is set.

**Assets**
- The **official logo file** (vector if possible). The current sail and wordmark are a close
  recreation; the wordmark is set in the Caveat font.
- **Real dish photos** for all 41 dishes (drinks excluded), signatures first: see `PHOTO-SHOT-LIST.md`.

## 7. Recommended next steps

1. Owner review: confirm the Réglages fields, answer §6, clear the « à vérifier » flags.
2. Photo session following `PHOTO-SHOT-LIST.md`, then upload the photos from the back office.
3. Official logo, then `npm run assets:icons` for the favicons and OG images.
4. **Going online** (details in the README):
   - a Node 22+ host with HTTPS and a domain;
   - persistent storage for `data/` (or Turso + S3/R2 through `src/lib/storage.ts`);
   - set the public address, then print the table cards from `/admin/reglages`;
   - daily backups.
5. Optional, as proposed earlier (not built):
   - offline support (PWA) for weak terrace Wi-Fi;
   - an automatic evening/dark mode;
   - cookie-free visit statistics.
