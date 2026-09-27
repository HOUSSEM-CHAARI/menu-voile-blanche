# AUDIT — La Voile Blanche digital menu

Phase 0 · 2026-09-27 · No application code was changed during this audit.

---

## 1. Current stack and architecture

A single-page **Vite 8 + React 19** app, written in plain JavaScript (no TypeScript). It is purely static: there is no backend, database or admin.

| Area | Current state |
|---|---|
| Entry | `index.html` → `src/main.jsx` → `src/App.jsx` (one ~100-line component file) |
| Data | `src/menuData.js`: 9 hard-coded categories with Arabic labels. **`menuItems = []` holds zero dishes.** |
| Styles | `src/styles.css`: one minified line of ~10 KB, physical `left/right` properties, 3 media queries |
| Fonts | Google Fonts CDN, render-blocking: Playfair Display (+ italic), DM Sans, DM Mono, Noto Naskh Arabic |
| Images | `public/images/voile-blanche-hero.jpg` (1672×941, 145 KB), used as a CSS background with the credit "Visuel d'ambiance · non représentatif". No EXIF camera data. The scene is a generic lit seafront town and looks AI-generated. |
| QR | `qrcode.react` renders `window.location.href` inside the public page |
| Routing | None. Anchors only: `#accueil`, `#menu`, `#<category-id>` |
| Git | Branch `main`, 1 commit (`first_commit`), remote `origin` → `github.com/HOUSSEM-CHAARI/menu-voile-blanche`. **No `.gitignore`: `node_modules/` (384 files) and `dist/` are committed.** |
| Deploy config | None |
| Docs | `VERIFICATION_MENU.md` explains that the previous pass never received the photos, so no dish was entered |

The social links in the code (Instagram `restaurant.la.voile.blanche`, Facebook profile `100064853971860`) and the city "Sfax" come from the previous pass. The brief does not give them, so they must be confirmed (see §6).

## 2. Toolchain run

| Command | Result |
|---|---|
| `npm install` | OK, 0 vulnerabilities. Node 24.11.1, npm 11.12.1 |
| `npm run build` | OK: JS 244.8 KB (77.4 KB gzip) for a page with no dishes; CSS 10 KB |
| lint | **No script, no ESLint config** |
| type-check | **Not applicable: no TypeScript** |
| tests | **None** |
| Browser console | 1 error: `404 /favicon.ico` (no favicon at all) |
| Horizontal scroll 360–1440 px | None |

**Lighthouse (mobile, `vite preview`), baseline:**

| Performance | Accessibility | Best practices | SEO | LCP | FCP | CLS |
|---|---|---|---|---|---|---|
| **73** | 96 | 96 | 91 | **4.6 s** | 4.0 s | 0 |

Failures: render-blocking Google Fonts (≈2.8 s), a late-discovered LCP background image, 43 KB unused JS, `robots.txt` invalid (the SPA fallback serves HTML), a colour-contrast failure (`#62777c` on `#f7f3eb` = 4.26:1; 10 px eyebrow = 4.49:1), a QR SVG without a title, and a console 404.

Before screenshots at 360 / 390 / 768 / 1024 / 1440 px are saved outside the repo and will go in `REPORT.md`. The page shows nine categories that each say "articles will be displayed after verification", a "Menu en cours de vérification" banner, and a QR code.

## 3. Photos vs. brief transcription (section 9)

I read all four photos and zoomed into every ⚠ area and every glare area. Copies now sit in `docs/menu-photos/` (they were missing from the repo): `page-1-entrees-pates.jpg`, `page-2-mollusques-poissons.jpg`, `page-3-viandes-volailles.jpg`, `page-4-desserts-boissons.jpg`.

**Result: 44 items, 9 sections. Every French name, Arabic name and price in the transcription matches the photos, except the points below.**

| # | Item | Transcription | Photo shows | Action |
|---|---|---|---|---|
| D1 | Côtelettes d'agneau, *Printed* column | `Côtelettes d'Agneau` | **`Côtlettes d'Agneau`** (missing "e") | Record the real printed form in `CONTENT-CHANGES.md` |
| D2 | Trésor fruits de mer, composition | normalised plural forms | printed as `Fruit de Mer en Sauce` / `Spaghetti Fruit de Mer` / `Salade Fruit de Mer + Beignet de Crevette + Crevette Farcies + 2 Brochettes F.Mer Grillés` | Keep the corrected forms and list the printed ones in `CONTENT-CHANGES.md` |
| D3 | Poulpe en sauce, Arabic | `مثاومة قرنيط` ⚠ | The dots on the 2nd letter can't be resolved at this resolution: **`مثاومة` or `متاومة`**. The intended word is most likely Tunisian *mtewma* (garlic), usually written `مثومة`. | Keep the printed reading, `needsOwnerReview` |
| D4 | Filets de veau, Arabic | `لحم الضل` ⚠ | Confirmed printed exactly `الضل`. Veal is normally `لحم العجل`, so this is probably a misprint. | Keep the printed form, `needsOwnerReview` |
| D5 | Fruits de saison, price | 12000 ⚠ | Glare covers the first digit. The width fits two digits, so the best reading is **12,000**. | 12000, `needsOwnerReview` |
| D6 | Sorbet citron, price | 8000 ⚠ | Partly glared but readable as **8,000** | 8000, `needsOwnerReview` (low risk) |
| D7 | Poisson du jour, gap | "blank or covered area" | A **white scraped patch**, like a removed sticker or label, sits in the empty band between the two species groups. Something printed there (possibly a second price) was removed. | Supports owner question 2 |
| D8 | Section titles | "Pâtes & riz", "Mollusques & crustacés" | Printed `LES PÂTES` (it contains Riz) and `LES MOLLUSQUES ET CRUSTACÉS` | The rename is an editorial choice: list it in `CONTENT-CHANGES.md` |

Also confirmed:
- The Arabic `بالصالصة` / `(صالصة بيضاء)` in the stylised font and `(شخص واحد)` on both Royale items.
- `+ تشيش بالقرنيط` next to `(+Tchich au Poulpe)`, and `100غ`.
- No Arabic text for *Petillante*.
- The sundae photos on the dessert page match no listed dessert.

## 4. Current content vs. photos

| Check | Result |
|---|---|
| Dishes present | **0 of 44: all 44 missing** |
| Extra dishes | 0 |
| Wrong prices / names | None, because there is no data. Prices were planned as strings (`'45,000'`), which is the ambiguous format the brief forbids. |
| Categories | 9, same set. The order differs: the repo puts *Pâtes et riz* 3rd, the brief puts it 5th. |
| Arabic category names in the repo | `المعجنات والأرز` (*al-mu'ajjanat* means pastries or dough, which is wrong for pasta) → propose `المعكرونة والأرز`. `الرخويات والقشريات` (clinical) → propose `غلال البحر`, the printed menu's own word. `الحلويات` → `التحلية`. The others match the brief's proposals. All remain drafts. |

Nothing will be overwritten silently. The seed replaces the empty array, and the Arabic category changes are listed in `CONTENT-CHANGES.md`.

## 5. What works and should be kept

- The honesty rule of the previous pass (nothing invented) matches this brief.
- The skip link, `type="search"` with `enterKeyHint`, and a 16 px search input (no iOS zoom).
- 44 px tap targets on chips and social buttons, and a `prefers-reduced-motion` block.
- The sticky search-and-category bar idea.
- Category slugs (`entrees-chaudes`, `mollusques-crustaces`, …): **kept exactly, so existing `#anchor` links keep working.**
- The sail SVG idea, navy `theme-color`, the social links (once confirmed) and `qrcode` as a dependency family.

## 6. Problems, ranked

### Critical
1. **The menu is empty.** Guests scanning a QR code today see nine "coming soon" boxes and a warning banner. *(content)*
2. **`node_modules/` and `dist/` are committed and there is no `.gitignore`.** This bloats the repo and will leak `.env` and the DB file once they exist. *(code quality, security)*
3. **No backend, database or auth**, while the brief needs a back office. *(architecture)*

### High
4. No i18n: the UI is French only. Arabic appears only as decorative subtitles, English is absent, and there is no switcher, `lang`/`dir` switch or language URLs. *(i18n, RTL)*
5. Physical CSS (`left`, `right`, `text-align:right`, `border-left`) would break RTL mirroring. *(RTL)*
6. Prices are modelled as strings and rendered as `{price} DT`, which would show "45,000 DT". *(content accuracy)*
7. Client-side rendering leaves an empty `<div id="root">` for crawlers. There are no hreflang tags, Open Graph data, JSON-LD, sitemap, valid robots.txt or favicon. SEO scores 91. *(SEO)*
8. LCP is 4.6 s: render-blocking CDN fonts (4 families, not subset) and a 145 KB CSS-background hero. *(performance)*
9. The hero photo shows a place that is not the restaurant, and is probably AI-generated. The page apologises for it in 9 px text. *(visual design, trust)*
10. Dependencies are pinned to `"latest"`, so builds are not reproducible. *(code quality)*

### Medium
11. The visual language matches the patterns the brief rules out:
    - a cream background (`#f7f3eb`) with sand/tan accents;
    - all-caps tracked mono eyebrows above every heading (`LA CARTE`, `TRANSPARENCE`, `À TABLE`);
    - an italic coloured phrase in the headline ("*à votre table.*");
    - identical rounded cards with the same shadow;
    - a gradient on the empty states.
    *(visual design)*
12. Text is 8–10 px in places (eyebrows, badges, the "DT" suffix, the hero credit, fine print), which is illegible in sunlight. Prices use a monospace font rather than tabular figures in a text face. *(a11y, design)*
13. `role="tablist"` has no tab panels and no arrow-key handling, which is ARIA misuse. `aria-live` on the whole menu list re-announces everything on each keystroke. *(a11y)*
14. Contrast: the muted text reaches only 4.26:1 and the eyebrow 4.49:1. *(a11y)*
15. Category chips *filter* (hide other sections) instead of scrolling with scroll-spy. *(mobile UX)*
16. Search only lower-cases: no accent folding and no Arabic normalisation. *(UX, i18n)*
17. The public page shows a QR code of `window.location.href`, which is useless to a guest already on the menu (and includes any `#hash`). *(UX)*
18. The minified single-line CSS is hard to maintain. *(code quality)*

### Low
19. 77 KB gzip of React to render a static list. *(performance)*
20. There is no README and no tests.
21. "Sfax" is asserted in the meta description and the hero but is not in the brief, so it must be confirmed. *(content)*
22. No privacy concern today, but Google Fonts requests leak visitor IPs to a third party. Self-hosting fixes this. *(privacy)*

## 7. Recommendation: migrate to Astro (same Vite toolchain), not a rewrite for its own sake

The existing app contains no data and about 100 lines of UI, so a migration costs almost nothing. What the brief needs cannot be met by the current static SPA:

| Need | Static Vite SPA | **Astro 7 (SSR, Node adapter)** | Next.js |
|---|---|---|---|
| DB + auth + uploads + write API | would need a second server (Express) | ✅ endpoints, middleware, sessions in one app and one command | ✅ |
| Server-rendered HTML per language (SEO 100, LCP < 2 s) | needs a hand-built SSR setup | ✅ by default | ✅ |
| Minimal JS on the public menu | ❌ React runtime (~77 KB gz) | ✅ ~0 KB framework; vanilla TS for the sheet, search and scroll-spy (≈8 KB) | ❌ React runtime on every page |
| Admin code never loaded on the public menu | code-splitting by hand | ✅ React islands only on `/admin` pages | ✅ |
| Changes visible immediately | n/a | ✅ SSR reads SQLite on each request (44 rows, < 1 ms) | ✅ |
| Reuse of existing work | — | ✅ Vite-based: reuses React (admin islands), the sail SVG, icons and slugs | partial |

**Decision:** Astro + `@astrojs/node` (standalone), TypeScript (strict), Drizzle ORM + libSQL (SQLite file locally), zod, sharp, `@node-rs/argon2`, and React for admin islands only. Details are in `PLAN.md`.

What I remove, and why (none of it without your "go"):
- **The on-page QR section** moves to Settings plus the printable table card.
- **The "Menu en cours de vérification" banner** goes once the data is seeded. Review flags become visible only in the back office.
- **The hero photo** is replaced by a typographic hero with the logo and wave line, which is the brief's signature. The file moves to `docs/legacy/`.
- **`qrcode.react`** is replaced by `qrcode`, which generates the SVG and PNG on the server.

## 8. Questions for the owner (to date)

**Content:**
- The Arabic spelling of *Poulpe en sauce* (D3).
- `الضل` vs `العجل` (D4).
- The prices of *Fruits de saison* and *Sorbet* (D5, D6).
- Poisson du jour:
  - does "Biologique" mean wild-caught?
  - what was under the scraped patch, and do Mulet, Sargue and Serre cost a different price per 100 g?
  - which Arabic name matches which species?
- Are ice-cream sundaes on offer (dessert-page photos)?

**Restaurant info:**
- Phone, WhatsApp, address, opening hours, map link, domain.
- Confirm the city (**Sfax?**) and the Instagram and Facebook links already in the repo.

**Assets:**
- The official logo file (vector if possible).
- Real dish photos. Temporary free-licence photos are used until then, as you asked.
