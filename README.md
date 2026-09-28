# La Voile Blanche — menu digital et back office

Menu à consulter sur téléphone (QR code sur les tables) en **français, arabe et anglais**, et un
**back office** pour modifier les plats, les prix et les photos sans toucher au code.

Le menu sert uniquement à **consulter** la carte : il n’y a ni commande ni paiement en ligne.
Le client scanne le QR code, lit le menu, puis passe sa commande au serveur.

> Première partie : guide pour le restaurant (en français).
> Deuxième partie : *technical notes for developers* (in English).

---

## Guide pour le restaurant

### 1. Démarrer le menu sur cet ordinateur

À faire **une seule fois** (il faut [Node.js](https://nodejs.org) version 22 ou plus récente) :

1. Ouvrez un terminal dans le dossier `menu-voile-blanche`.
2. Copiez le fichier de réglages : `copy .env.example .env` (Windows) ou `cp .env.example .env` (Mac).
3. Ouvrez `.env` et choisissez votre mot de passe sur la ligne `ADMIN_PASSWORD=` (10 caractères minimum).
4. Tapez `npm install`, puis `npm run setup`.

Ensuite, **à chaque fois** :

```
npm run dev
```

- Le menu : <http://localhost:4321> (s’ouvre en français ; `/ar` en arabe, `/en` en anglais).
- Le back office : <http://localhost:4321/admin>.

Pour arrêter : `Ctrl + C` dans le terminal.

### 2. Se connecter au back office

Allez sur `/admin`, entrez l’identifiant (`ADMIN_USERNAME` dans `.env`, par défaut `patron`) et le
mot de passe choisi. Changez-le quand vous voulez dans **Mot de passe**.
Après 5 erreurs, la connexion est bloquée 15 minutes.

### 3. Marquer un plat « Épuisé » (pendant le service)

**Plats** → touchez le bouton **Disponible** à côté du plat : il devient **Épuisé** (rouge).
Sur le menu, le plat reste visible avec la mention « Épuisé / نفذ / Sold out ». Touchez à nouveau
pour le remettre disponible.

### 4. Changer un prix

**Plats** → cliquez sur le nom du plat → champ **Prix en dinars** → **Enregistrer**.

Vous pouvez écrire `42`, `42,500`, `42.500` ou `42,000` (comme sur la carte imprimée :
`42,000` = 42 dinars). Sous le champ, « Affiché : 42 DT » montre ce que verront les clients.
Un prix inférieur à 1 DT ou supérieur à 500 DT demande une confirmation (faute de frappe probable).
Le changement est visible **immédiatement** sur le menu, dans les trois langues.

### 5. Ajouter un plat

**Plats** → **Ajouter un plat**. Seul le **nom en français** et le **prix** sont obligatoires.
Si l’arabe ou l’anglais est vide, le menu affiche le français (le badge « traduction manquante »
vous le rappelle). Pour un plat vendu au poids, choisissez « aux 100 g ».

### 6. Ajouter une photo

Dans la fiche du plat → **Photo** → choisissez l’image. Faites glisser l’image dans le cadre pour
choisir le cadrage, le curseur **Zoom** permet d’agrandir. **Enregistrer**.
Les tailles et formats pour téléphone sont créés automatiquement ; l’ancienne photo est supprimée.
Conseils de prise de vue : voir [PHOTO-SHOT-LIST.md](PHOTO-SHOT-LIST.md).

Les photos marquées « photo temporaire » sont des illustrations libres de droits en attendant
vos propres photos ([PHOTO-CREDITS.md](PHOTO-CREDITS.md)).

### 7. Ajouter ou réordonner une catégorie

**Catégories** → **Ajouter une catégorie**. L’ordre de la liste est l’ordre du menu : utilisez
↑ ↓ (ou glissez-déposez sur ordinateur). Une catégorie qui contient des plats ne peut être
supprimée qu’après avoir choisi où déplacer ses plats.

### 8. Supprimer, dupliquer, restaurer

- **Supprimer** met le plat dans la **Corbeille** : il disparaît du menu mais peut être restauré.
- **Supprimer définitivement** (depuis la Corbeille) est irréversible.
- **Dupliquer** crée une copie **masquée** : modifiez-la puis cochez « Visible sur le menu ».
- **Historique** : qui a changé quoi, et quand (ancien prix → nouveau prix).

### 9. Réglages, QR code et carte de table

**Réglages** : nom, téléphone, adresse, horaires, liens Instagram/Facebook et **adresse du menu**.
Les champs « à confirmer » ont été préremplis : vérifiez-les puis cochez « confirmé ».

Depuis la même page : téléchargez le **QR code** (SVG pour l’imprimeur, PNG) et ouvrez la
**carte de table A6** (Fichier → Imprimer → format A6, sans marges, ou « Enregistrer en PDF »).
⚠ Tant que l’adresse du menu est `localhost`, le QR code ne fonctionne que sur cet ordinateur :
renseignez la vraie adresse avant d’imprimer.

### 10. Sauvegarder les données

- **Sauvegarde** → **Sauvegarde complète (.json)** : textes, prix, catégories et réglages.
  À faire régulièrement et à garder sur une clé USB ou un drive.
- **Liste des plats pour Excel (.csv)** : pour relire ou imprimer les prix.
- **Restaurer** : choisissez un fichier .json, un aperçu montre les changements (plats ajoutés,
  retirés, prix modifiés) ; rien n’est remplacé avant votre confirmation.

Sauvegarde complète « à la main » (menu **et** photos) : arrêtez le menu (`Ctrl + C`) puis copiez
le dossier **`data/`** (il contient `menu.db`, la base de données, et `uploads/`, les photos).

---

## Technical notes (developers)

### Stack

- **Astro 7** (`output: 'server'`, `@astrojs/node` standalone): every page is rendered on demand
  from the database, so back-office changes are visible on the next request. No UI framework:
  the public menu ships ~2.5 KB of vanilla TypeScript; the back office is server-rendered forms
  plus a small script (`src/scripts/admin.ts`) that is never loaded on public pages.
- **SQLite via libSQL + Drizzle ORM**, migrations in `drizzle/`. Strict TypeScript, pinned versions.
- **sharp** image pipeline (AVIF/WebP/JPEG, 160–1280 px, LQIP), **qrcode**, **@node-rs/argon2**, **zod**.
- Self-hosted subset fonts in `public/fonts/` (see `public/fonts/LICENSES.txt`); Arabic fonts are
  only requested on `/ar`.

### Layout

```
data/menu.verified.ts      menu transcribed from the photos (source of the seed)
data/photos/temporary/     temporary Unsplash photos + credits.json
docs/menu-photos/          the four printed-menu photos (reference)
drizzle/                   SQL migrations
scripts/                   seed, verify, reset, photos, qr, lighthouse, assets
src/lib/                   db, price, search, i18n, images, storage, auth, seo, qr…
src/lib/admin/             back-office data layer, forms (zod), backup
src/components/            public menu (menu/, brand/) and back office (admin/)
src/pages/[lang].astro     /fr /ar /en ; index.astro ("/" = French or remembered language)
src/pages/admin/           back office (protected in src/middleware.ts)
tests/e2e/                 Playwright: public, quality (axe, SEO, perf guards), admin
```

### Commands

| Command | What it does |
|---|---|
| `npm run setup` | migrate, seed (idempotent; creates the admin from `.env`), import temporary photos |
| `npm run dev` | dev server on :4321 (applies pending migrations first) |
| `npm run build` / `npm start` | production build / run it (`PORT`, `HOST` env vars) |
| `npm run check` | lint + typecheck + unit tests + `db:verify` |
| `npm run test:e2e` | Playwright on a separate `data/test.db` (Chrome, Pixel 7, iPhone WebKit) |
| `npm run db:verify` | compares the database with the 44 verified dishes and prices |
| `npm run db:reset` | dev only: recreate the database from scratch |
| `npm run db:seed -- --force` | rewrite seeded rows from `data/menu.verified.ts` (overwrites edits!) |
| `npm run db:generate` | new migration after editing `src/lib/db/schema.ts` |
| `npm run qr` | QR code + A6 table card into `print/` |
| `npm run lighthouse` | Lighthouse on a running production server (default :4323) |
| `npm run docs:content` / `db:photos` | regenerate CONTENT-CHANGES.md / PHOTO-CREDITS.md + PHOTO-SHOT-LIST.md |
| `npm run assets:icons` | favicons, app icons, manifest, OG images |

First time for Playwright's iPhone project: `npx playwright install webkit` (Chrome projects use
the installed Google Chrome).

### Environment (`.env`, see `.env.example`)

`DATABASE_URL`, `DATABASE_AUTH_TOKEN`, `PUBLIC_BASE_URL`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`
(seed only), `UPLOAD_DIR`. `.env`, `data/*.db` and `data/uploads/`
are git-ignored.

### Security model

argon2id hashes; sessions stored as SHA-256 of a random token (httpOnly, SameSite=Lax, Secure on
HTTPS, 7-day sliding expiry); `src/middleware.ts` guards every `/admin` route server-side and
checks a per-session CSRF token on every non-GET (plus Astro's origin check); login rate limit in
the `login_attempts` table; zod validation on every form; uploads sniffed and re-encoded by sharp
(EXIF stripped); JSON-LD escaped; CSV cells protected against formula injection. Roles
(`owner`/`manager`/`staff`) map to permissions in `src/lib/auth.ts`.

### Going online later (not done)

1. **Host**: any Node 22+ host (VPS, Render, Fly.io, Railway…) running `npm run build && npm start`
   behind **HTTPS** (a domain such as `menu.lavoileblanche.tn`).
2. **Database**: hosted libSQL (Turso) is only an env change (`DATABASE_URL=libsql://…` +
   `DATABASE_AUTH_TOKEN`). PostgreSQL requires switching the Drizzle dialect in
   `src/lib/db/schema.ts`/`client.ts` and regenerating migrations.
3. **Photos**: `data/uploads/` must be on persistent disk, or implement the three functions of
   `src/lib/storage.ts` for S3/R2 and serve them from a CDN.
4. Set `PUBLIC_BASE_URL` and **Réglages → Adresse du menu** to the real domain, then reprint the
   QR codes (`/admin/reglages`).
5. Use a strong `ADMIN_PASSWORD`, back up the database daily, keep compression on (the app
   compresses HTML itself; a CDN/proxy may do it instead).
