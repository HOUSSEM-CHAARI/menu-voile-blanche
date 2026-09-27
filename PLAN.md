# PLAN — La Voile Blanche digital menu + back office

Companion to `AUDIT.md`. Nothing here is built until you say "go".

---

## 1. Design direction

### Concept

**"The printed carte, carried by a sail."** The page reads like the physical menu: name, dotted leader, price. It is set in navy ink on a cool sail-white. The one bold gesture is the hero, where the sailboat rises above a fine wave line that draws itself once. That same wave line then returns quietly between every category, like the tide marking each course.

### Colour tokens

WCAG ratios below were computed, not estimated.

| Token | Hex | Role | Key pairs |
|---|---|---|---|
| `--sail` | `#F6F8F9` | Page background: a cool, slightly blue white (not cream) | — |
| `--foam` | `#FFFFFF` | Raised surfaces: bottom sheet, search field, admin cards | — |
| `--abyss` | `#0D2436` | Ink: text, logo, prices, footer background | on sail **14.9:1** · on foam 15.9:1 |
| `--mist` | `#4B6275` | Secondary text: descriptions, meta | on sail **5.97:1** · on foam 6.4:1 · on seaglass 4.9:1 |
| `--shutter` | `#1A5E93` | The single accent, a Sidi-Bou-Saïd shutter blue. **Only for things you can tap**: links, the active chip, focus rings, the "Signature" mark | on sail **6.4:1** · foam text on shutter 6.9:1 |
| `--seaglass` | `#D5E6E8` | Quiet fills: badges, photo placeholders, the selected chip background | abyss on seaglass 12.3:1 |
| `--sand` | `#C8A675` | **Hairline detail only**: the wave divider and the leader dots on the footer. Never used for text on light backgrounds (2.15:1). On abyss it passes (6.9:1). | — |

- Sold-out uses no extra colour. The name drops to `--mist` and an "Épuisé" outline badge appears in `--abyss`, so it stays legible in sunlight and does not rely on colour.
- Focus ring: `2px solid var(--shutter)` with a 2 px offset, on every interactive element.

### Type

| Role | Latin | Arabic | Why |
|---|---|---|---|
| Headings and dish names | **Newsreader** (variable: opsz 6–72, wght 400–700) | **Noto Naskh Arabic** (400–700) | Newsreader's optical-size axis gives calligraphic contrast at display sizes, echoing the logo's script, while keeping sturdy hairlines at 18–20 px dish-name size. Thin display serifs (Playfair, Cormorant) wash out in direct sun. It is also not the default serif everyone reaches for. Naskh is the natural Arabic counterpart of a book serif, with generous vertical metrics so tashkeel never clips. |
| Descriptions, prices, UI | **Source Sans 3** (variable, wght 400–700) | **IBM Plex Sans Arabic** (400, 600) | A humanist sans with a large x-height and open apertures, built for small-size legibility. It has true tabular lining figures (`tnum lnum`) for aligned prices. Plex Sans Arabic has calm, even strokes and clear counters, and sits at the same colour and weight as Source Sans. |

- **Loading:** self-hosted WOFF2, subset with `fonttools`:
  - Latin: Basic Latin, Latin-1, œ Œ ’ “ ” – — … €.
  - Arabic: U+0600–06FF, U+FE70–FEFF, Western digits.
  - Split with `unicode-range` and `font-display: swap`.
- **Preload:** only the two Latin files on `/fr` and `/en`, and the two Arabic files on `/ar`. The "عربي" label in the switcher uses the system Arabic font, so the French page never downloads an Arabic webfont.
- **Scale (mobile → desktop):**
  - Body: 17 px / 1.55. Never below 16 px, and 14 px only for badges.
  - Dish name: 19 → 21 px. Category title: 30 → 40 px. Hero wordmark: 44 → 64 px.
  - Arabic line-height: 1.8 for body, 1.5 for headings.
- **Prices:** Source Sans 3, weight 600, `font-variant-numeric: tabular-nums lining-nums`.

### Layout

**Mobile, 360–767 px:**

```
┌──────────────────────────────────┐
│ FR · عربي · EN            ☎  ⌖  ◷│  switcher + quick actions (44px)
│                                  │
│               ⛵                 │  sail logo (SVG)
│         La Voile Blanche         │  script wordmark
│      [tagline from Settings]     │  one line, draft for owner
│  ∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼  │  wave line: draws once on load
├──────────────────────────────────┤
│ Nos signatures                   │
│ ┌──────────┐ ┌──────────┐ ┌───   │  scroll-snap, 4:3 photos
│ │  photo   │ │  photo   │ │      │
│ │ Trésor…  │ │ Royale…  │ │      │
│ │ 88 DT    │ │ 60 DT    │ │      │
│ └──────────┘ └──────────┘ └───   │
├══════════════════════════════════┤  ← sticky from here
│ ⌕ Rechercher un plat             │
│ Entrées chaudes  Entrées froides →│  chips, active = shutter underline
╞══════════════════════════════════╡
│ Entrées chaudes                  │  Newsreader 30px
│ ┌────┐ Tchich au poulpe     9 DT │  96×72 thumb (4:3) | name | price
│ └────┘ Soupe d'orge au poulpe    │  mist description
│ ┌────┐ Brik au thon         6 DT │
│ └────┘ Épuisé                    │
│  ∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼  │  wave divider (sand hairline)
│ Poissons                         │
│ ┌──────────────────────────────┐ │  signature/special = feature row
│ │ photo 4:3                    │ │
│ │ Poisson du jour grillé       │ │
│ │ 14 DT / 100 g · pesé à table │ │
│ └──────────────────────────────┘ │
│  ∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼  │
│ Boissons         (compact list)  │
│ Eau minérale Safia 1 L ····· 4 DT│  no photos
│ Boisson gazeuse ············ 4 DT│
├──────────────────────────────────┤
│ footer (abyss): address · ☎ ·    │
│ hours · map · Instagram · FB     │
└──────────────────────────────────┘
```

**Desktop, ≥ 1024 px.** The chip bar becomes a vertical sticky index in the inline-start rail. In Arabic it mirrors to the right automatically.

```
┌───────────────────────────────────────────────────────────────┐
│ FR · عربي · EN                         ☎ Appeler ⌖ Itinéraire │
│                           ⛵                                   │
│                    La Voile Blanche                           │
│        ∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼            │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐              │  4 signatures in a row
├───────────────────────────────────────────────────────────────┤
│ ⌕ Rechercher     │  Entrées chaudes                            │
│                  │  ┌────┐ Tchich au poulpe ··········· 9 DT   │  dotted leader lines
│ Entrées chaudes ◀│  └────┘ Soupe d'orge au poulpe              │  ≥ 768 px
│ Entrées froides  │  ┌────┐ Brik aux fruits de mer ····· 9 DT   │
│ Mollusques…      │  ...                                        │
│ Poissons         │  ∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼∼       │
│ …   (sticky)     │  menu column max 720 px                     │
└───────────────────────────────────────────────────────────────┘
```

### Principles

1. **Name, leader, price.** Nothing sits between a guest and a price. The row structure is the printed menu's.
2. **One wave.** The logo's wave line is the only ornament: drawn once in the hero, then a hairline between courses, then the placeholder motif.
3. **Ink on sail, blue means tap.** Navy is for reading; shutter blue appears only on interactive elements.
4. **An honest plate.** A branded sail placeholder beats a photo of someone else's dish. Temporary photos are used only when they genuinely match, and are flagged as temporary.
5. **Three languages, one layout.** French first everywhere; Arabic is a true mirror, not a translated afterthought.

### Motion

- **One orchestrated moment:** on first load the sail rises 8 px and fades in, and the wave line draws with `stroke-dashoffset` over 700 ms.
- **Tap responses:**
  - The bottom sheet slides up (220 ms, ease-out).
  - The active chip underline slides.
  - A language switch cross-fades the menu (150 ms).
- With `prefers-reduced-motion`, all of the above are instant.

### Self-review: where the first draft was generic, and what changed

| First instinct | Why it was generic | Revised to |
|---|---|---|
| Keep Playfair Display + DM Sans | The most common "elegant restaurant" pairing, and Playfair's hairlines vanish in sunlight | Newsreader (optical sizes) + Source Sans 3 (tabular figures) |
| A teal/aqua accent | The default "seafood" colour of every template | Sidi-Bou-Saïd **shutter blue**, a place-specific colour, restricted to interactive elements |
| Photo cards for every dish in a 2-column grid | The "identical rounded cards" look | Printed-carte rows with small 4:3 thumbnails. Larger feature rows only for signatures and special dishes; drinks as a compact photo-less list |
| Full-bleed ambient photo hero | Stock mood photo, not this restaurant, and a heavy LCP | Typographic hero: sail logo + wordmark + wave line. The LCP becomes text, with a target under 1.5 s |
| Section eyebrows ("LA CARTE") | Explicitly banned | Removed. Category titles stand alone, separated by the wave |
| Card shadows | Grey-shadow template look | No shadows on the menu. Only the bottom sheet casts one, because it truly floats |

## 2. Information architecture

| URL | What |
|---|---|
| `/` | `302` to `/{lang}`: the cookie `vb_lang` if set, else `/fr` |
| `/fr` · `/ar` · `/en` | Public menu, server-rendered. `<html lang dir>` is set per language. |
| `/fr#brik-au-thon` | Opens the dish sheet (deep link). Closing it restores the previous URL. |
| `/sitemap.xml` · `/robots.txt` | 3 URLs with hreflang. `Disallow: /admin` |
| `/og/fr.png` etc. | Open Graph images in the brand design |
| `/media/…` | Processed images (immutable, hashed names) |
| `/admin/login` | Login |
| `/admin` | Dashboard |
| `/admin/categories` | List, reorder, create and edit (drawer) |
| `/admin/plats` · `/admin/plats/nouveau` · `/admin/plats/[id]` | Dish list, create, edit (+ history tab) |
| `/admin/corbeille` | Trash |
| `/admin/historique` | Audit log |
| `/admin/reglages` | Settings, QR downloads, table card |
| `/admin/sauvegarde` | JSON/CSV export, JSON import |
| `/admin/mot-de-passe` | Change password |
| `/api/admin/*` | Write endpoints: session + CSRF + zod |

**Old anchors keep working.** Category slugs stay identical to today's IDs (`#entrees-chaudes`, …). `#menu` and `#accueil` stay as IDs on the menu and hero, so a `/#poissons` link redirects to `/fr#poissons` (the browser keeps the fragment through a 302).

**Public page order:** hero → signatures → sticky search + categories → sections → footer. Search results replace the sections in place and show a count, e.g. "3 plats". Filters: Fruits de mer · Poisson · Viande · Volaille · Pour 2.

## 3. Data and back-office architecture

### Stack (versions checked today)

| Package | Version | Role |
|---|---|---|
| Astro | 7.x + `@astrojs/node` 11 (standalone) | SSR pages, API endpoints, middleware |
| `@astrojs/react` | 7 | React islands, **admin only** |
| Drizzle ORM | 0.45 + `@libsql/client` 0.18 | Typed schema, migrations (`drizzle-kit`) |
| zod | 4 | Validation of every input, shared by client and server |
| `@node-rs/argon2` | 2 | Password hashing (prebuilt Windows binary, no compiler needed) |
| sharp | 0.35 | Image pipeline, OG images, favicons |
| `qrcode` | 1.5 | QR codes as SVG and PNG, generated server-side |
| `@dnd-kit/*`, `react-easy-crop` | — | Admin reorder and crop |
| Playwright, Vitest | — | End-to-end and unit tests |
| ESLint + `astro check` + `tsc` | — | lint and type-check scripts |

**Database portability, stated honestly:**
- `DATABASE_URL=file:./data/menu.db` locally.
- Moving to hosted libSQL (Turso) is **only an env-var change**.
- Moving to PostgreSQL means switching the Drizzle dialect file (`sqliteTable` → `pgTable`) and regenerating migrations. Queries stay the same.
- Neither Prisma nor Drizzle make SQLite→Postgres a pure env-var change, because Prisma's `provider` can't come from env either.

### Schema, adapted from the brief

- **Localized text:** `name` and `description` are stored as `*_fr` / `*_ar` / `*_en` **columns**, so the dashboard queries "missing translation" in plain SQL and search indexes them.
- **List-shaped fields:** `includes`, `options` and `tags` are stored as JSON text.

```ts
categories   id, slug (unique), name_fr NOT NULL, name_ar, name_en, image (json ImageMeta),
             sort_order, is_visible, created_at, updated_at

menu_items   id, slug (unique), category_id → categories,
             name_fr NOT NULL, name_ar, name_en,
             description_fr, description_ar, description_en,
             note_fr, note_ar, note_en,        // + "pesé à table, demandez au serveur"
             price INTEGER NOT NULL,           // millimes
             price_unit 'item' | 'per100g',
             serves INTEGER,
             includes json { fr: string[], ar?: string[], en?: string[] },
             options  json { label: Localized, choices: Localized[] }[],
             tags     json ('signature'|'royale'|'forTwo'|'grilled'|'catchOfTheDay')[],
             kind 'seafood'|'fish'|'meat'|'poultry'|'other',   // drives quick filters
             image json ImageMeta, image_alt_fr/ar/en,
             image_source 'owner'|'temporary', image_credit,   // ← for temporary stock photos
             is_available, is_visible, sort_order,
             needs_owner_review TEXT,          // reason, back office only
             deleted_at, created_at, updated_at

settings     id = 1, restaurant_name, tagline_fr/ar/en, phone, whatsapp,
             address_fr/ar/en, map_url, opening_hours_fr/ar/en,
             instagram, facebook, base_url, updated_at

users        id, username (unique), password_hash, role 'owner'|'manager'|'staff', created_at
sessions     id (sha-256 of token), user_id, expires_at, csrf_token
login_attempts  key (ip|username), count, window_start
audit_log    id, user_id, action, entity, entity_id, before json, after json, created_at

ImageMeta = { key, width, height, lqip (base64 16px webp),
              formats: { avif: srcset, webp: srcset, jpg: srcset } }
```

**How the special dishes map onto this model:**
- **Poisson du jour:**
  - `price_unit: per100g`, `tags: [catchOfTheDay, grilled, signature]`.
  - `includes: ["Tchich au poulpe"]`.
  - `options: [{ label: "Selon l'arrivage", choices: [Loup, Dorade, Rouget, Mulet, Sargue, Serre] }]`.
  - `note: "Pesé et annoncé à table — demandez au serveur"`.
- **Trésor:** `serves: 2`, `options: [{ label: "Au choix", choices: [Fruits de mer en sauce, Spaghetti fruits de mer] }]`, `includes: [4 items]`.
- **Œufs de seiche:** `options: [{ label: "Préparation", choices: [Sautés, Panés] }]`.

### Seed, verification, reset

- `data/menu.verified.ts` holds the 44 items transcribed from the photos, with the differences in `AUDIT.md` §3 applied.
- `npm run db:seed` upserts by slug and is idempotent. It also creates the admin from `ADMIN_USERNAME` / `ADMIN_PASSWORD` if absent, and the Settings row with `[TÉLÉPHONE]`-style placeholders.
- `npm run db:verify` compares the DB against the verified file: count per category and each price. It prints mismatches and exits non-zero.
- `npm run db:reset` deletes the file, migrates, then seeds. It is dev only and refuses to run when `NODE_ENV=production`.

### Security

- **Sessions:**
  - 32-byte random token; only its SHA-256 is stored.
  - Cookie `vb_session`: `HttpOnly`, `SameSite=Lax`, `Secure` when served over HTTPS, `Path=/`.
  - 7-day expiry, renewed on use after half-life. Logout deletes the row.
- **Middleware:** guards `/admin/**` (except login) and `/api/admin/**` **on the server**, and redirects or returns 401.
- **CSRF:** Astro `security.checkOrigin` (rejects cross-origin form posts), plus a per-session CSRF token required in the `x-csrf-token` header for every write.
- **Login rate limit:** 5 failures per 15 min per IP + username, stored in the DB. Generic error message.
- **Validation:** zod on every endpoint. Text is rendered via Astro/React escaping only, never `set:html` or `dangerouslySetInnerHTML` on user content.
- **Uploads:**
  - MIME sniffed with sharp (not trusted from the client); ≤ 10 MB; JPEG, PNG, WebP or HEIC only.
  - Re-encoded, which strips EXIF and GPS data.
- **Roles:** `can(user, 'dish:write')` permission map in `lib/auth/permissions.ts`, so manager and staff roles only extend the map.
- **Caching:** public HTML sends `Cache-Control: no-cache` (always fresh after an admin save). Media is `immutable`.

### Environment (`.env.example`)

```
DATABASE_URL=file:./data/menu.db
DATABASE_AUTH_TOKEN=            # only for hosted libSQL
SESSION_SECRET=                 # 32+ random bytes
ADMIN_USERNAME=patron
ADMIN_PASSWORD=                 # used by the seed only, then changeable in /admin
UPLOAD_DIR=./data/uploads
PUBLIC_BASE_URL=http://localhost:4321
```

`.gitignore` covers `node_modules/`, `dist/`, `.env`, `data/*.db*` and `data/uploads/`. Phase 1 also **untracks** the committed `node_modules/` and `dist/` with `git rm --cached`; history is left as is. **Nothing is pushed to the GitHub remote unless you ask.**

## 4. Components

**Public** (Astro components; no framework runtime):
- `BaseLayout` (head, SEO, hreflang, JSON-LD), `Hero`, `SailLogo`, `WaveLine`, `LangSwitch`, `QuickActions`
- `SignatureStrip`, `CategoryNav` (chips on mobile, rail on desktop), `CategorySection`
- `DishRow`, `DishFeature`, `DishCompact`, `Price`, `Badge`, `DishImage` (`<picture>` + LQIP), `SailPlaceholder`
- `DishSheet`, `SearchBox`, `FilterChips`, `EmptyResults`, `Footer`

Scripts (vanilla TS, target ≈ 8 KB gzip total): `sheet.ts`, `scrollspy.ts`, `search.ts`, `lang.ts`.

**Admin** (Astro shell + React islands):
- Shell and auth: `AdminLayout` (bottom nav on phones, sidebar on desktop), `LoginForm`, `Toaster`, `ConfirmDialog`, `useUnsavedGuard`
- Dashboard and categories: `DashboardStats`, `RecentChanges`, `CategoryList` (dnd + ↑/↓ buttons), `CategoryForm`, `MoveDishesDialog`
- Dishes: `DishTable` (+ `AvailabilityToggle`), `DishForm` → `LocalizedField` (FR / AR `dir=rtl` / EN, with a "traduction manquante" badge), `PriceInput` (live "Affiché : 42 DT"), `TagPicker`, `IncludesEditor`, `OptionsEditor`, `ImageUploader` (+ `Cropper`)
- Other pages: `TrashList`, `AuditTimeline`, `SettingsForm`, `QrPanel`, `BackupPanel` (import preview)

**Shared lib** (`src/lib`):
- `price.ts`: `formatPrice(millimes, locale, unit)` and `parsePriceInput("42,000") → 42000`. Parsing rules: 3 digits after the separator = millimes; 1–2 digits = a decimal fraction; plain integer = dinars.
- `i18n/` (UI dictionaries + `pick(field, locale)` with French fallback), `search.ts` (French accent folding; Arabic أإآ→ا, ة→ه, ى→ي, tashkeel removal), `slug.ts`
- `db/`: `schema.ts`, `client.ts`, `queries/`
- `auth/`, `images/`, `storage/` (a local driver now, an S3/R2 driver later behind the same interface), `audit.ts`, `validation/`, `qr.ts`, `seo/jsonld.ts`

## 5. Images, including temporary photos

As you asked, dishes get **temporary representative photos** now and you replace them with the real ones later.

- Sources: **Unsplash / Pexels only (free licence)**, downloaded into the repo, never hotlinked.
- A photo is used only when it genuinely shows that dish. Plausible matches include brik, ojja, salade méchouia, grilled dorade, spaghetti aux fruits de mer, côtelettes d'agneau, escalope panée, salade de fruits and sorbet citron. Where no honest match exists (e.g. Trésor, Duo de crevettes, Tchich), the dish gets the branded sail placeholder.
- Each temporary photo is stored with `image_source = 'temporary'` and its credit. The back office shows a "Photo temporaire" badge and a dashboard count. Credits appear in `PHOTO-CREDITS.md` and a footer "Crédits photos" link.
- Replacing one in the admin sets the source to `owner` and deletes the old files.
- **Pipeline:** sharp auto-orients, crops to 4:3 (dishes) or 16:9 (category covers), then outputs AVIF + WebP + JPEG at 320/640/960/1280 w with hashed names. A 16 px LQIP is stored in the DB. `width`/`height` are always set; images below the fold use `loading="lazy"`. Back-office uploads go through the same function.

## 6. Performance and SEO budget

| Budget | Target |
|---|---|
| Public JS | ≤ 10 KB gzip, no framework |
| CSS | ≤ 15 KB gzip, inlined critical CSS for the hero |
| Fonts on the first view | ≤ 90 KB (2 subset variable files) |
| LCP | Hero wordmark as text/SVG, < 1.5 s on simulated 4G |
| Lighthouse mobile | Perf ≥ 95, A11y / BP / SEO 100 |

SEO per language:
- `<title>` and meta description; `hreflang` fr/ar/en + `x-default` → `/fr`.
- An OG image rendered from SVG by sharp.
- JSON-LD `Restaurant → hasMenu → Menu → MenuSection → MenuItem → offers { price, priceCurrency: "TND" }`. The price is in dinars as a decimal string, e.g. `"42.000"`.
- Sitemap, robots.txt, and a favicon/app-icon set from the logo SVG (`favicon.svg`, `.ico`, 180 px Apple icon, 192/512 maskable, manifest).

## 7. Roadmap and files per phase

| Phase | Work | Main files |
|---|---|---|
| **1. Foundation** | Astro + TS scaffold in place of Vite/React; `.gitignore` + untrack `node_modules/` and `dist/`; ESLint, `check` and `typecheck` scripts; Drizzle schema, migrations, client; `menu.verified.ts`, seed, verify, reset; price and search helpers + unit tests; i18n dictionaries, `/fr` `/ar` `/en` routing, `lang`/`dir`, cookie; `CONTENT-CHANGES.md` | `package.json`, `astro.config.ts`, `tsconfig.json`, `eslint.config.js`, `drizzle.config.ts`, `.env.example`, `.gitignore`, `src/lib/{db,price,search,slug,i18n}/**`, `data/menu.verified.ts`, `scripts/{seed,verify,reset}.ts`, `src/middleware.ts`, `src/pages/{index,[lang]/index}.astro`. Removed: `src/App.jsx`, `src/main.jsx`, `src/menuData.js`, `index.html`; `VERIFICATION_MENU.md` superseded |
| **2. Design system** | Tokens, subset fonts, base layout, logo SVG, wave, hero, quick actions, footer | `src/styles/{tokens,base,typography}.css`, `public/fonts/*`, `scripts/fonts.py`, `src/components/{BaseLayout,Hero,SailLogo,WaveLine,LangSwitch,QuickActions,Footer}.astro` |
| **3. Menu experience** | Signatures, category navigation + scroll-spy, sections, rows / feature / compact, bottom sheet + deep links, search + filters, special dishes, sold-out and hidden states | `src/components/menu/*`, `src/scripts/{sheet,scrollspy,search,lang}.ts` |
| **4. Images** | sharp pipeline, `<picture>` + LQIP, placeholders, temporary photos + credits, `PHOTO-SHOT-LIST.md`, `PHOTO-CREDITS.md` | `src/lib/images/*`, `src/lib/storage/*`, `scripts/import-photos.ts`, `data/photos/*`, `src/components/{DishImage,SailPlaceholder}.astro` |
| **5. Quality** | Lighthouse loop, axe checks, JSON-LD, OG images, favicons, sitemap, robots | `src/lib/seo/*`, `src/pages/{sitemap.xml,robots.txt}.ts`, `src/pages/og/[lang].png.ts`, `public/icons/*` |
| **6. QR + table card + QA** | QR SVG/PNG, printable A6 card, full QA at 5 widths × FR/AR | `src/lib/qr.ts`, `src/pages/admin/qr.[ext].ts`, `src/pages/admin/carte-table.astro`, `tests/e2e/public.spec.ts` |
| ⏸ **Checkpoint** | **Show you the public menu and wait for approval** | — |
| **7. Back office** | Auth, dashboard, categories, dishes, trash, audit, settings, backup | `src/pages/admin/**`, `src/pages/api/admin/**`, `src/components/admin/**`, `src/lib/{auth,audit,validation}/**` |
| **8. Final** | `README.md` (owner + developer), e2e tests, final QA, `REPORT.md` | `README.md`, `REPORT.md`, `tests/e2e/admin.spec.ts`, `playwright.config.ts` |

Each phase ends with build + lint + type-check, Playwright screenshots (360/390/768/1024/1440 × FR/AR) with a critique, and a local commit.

**One command:** `npm run dev` serves both the public menu and `/admin` on `http://localhost:4321`.

## 8. Proposed extras (built only after your approval)

1. **Offline (PWA):** service worker caches the last-seen menu + fonts, so a guest on weak Wi-Fi still sees it. Cost: about 2 KB, plus care about stale prices (network-first HTML, cache fallback).
2. **Evening mode:** an automatic `prefers-color-scheme: dark` palette (abyss background, sail ink, sand hairlines) for the terrace at night.
3. **Privacy-friendly analytics:** self-hosted Umami or a tiny first-party counter (dish opens, language share). No cookies, no third parties.
