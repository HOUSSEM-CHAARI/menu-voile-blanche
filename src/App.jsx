import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { categories, menuItems } from './menuData'

const instagram = 'https://www.instagram.com/restaurant.la.voile.blanche/?hl=fr'
const facebook = 'https://www.facebook.com/profile.php?id=100064853971860'

function SailMark() {
  return <svg className="sail-mark" viewBox="0 0 70 62" aria-hidden="true"><path d="M35 4v42H8C15 28 23 14 35 4Z" /><path d="M39 11c12 9 19 21 23 35H39V11Z" /><path className="wave" d="M5 53c7 5 14 5 21 0 7-5 14-5 21 0 6 5 13 5 19 0" /></svg>
}

function SearchIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="5.8" /><path d="m16 16 4 4" /></svg>
}

function SocialIcon({ type }) {
  if (type === 'instagram') return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" /></svg>
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.3 21v-8h2.7l.4-3.1h-3.1V7.92c0-.9.25-1.51 1.57-1.51H17V3.64c-.22-.03-.98-.1-1.86-.1-1.84 0-3.1 1.12-3.1 3.18v1.77H9.3V11.6h2.74V21h2.26Z" /></svg>
}

function MenuCard({ item }) {
  return <article className="dish-card">
    {item.image && <img src={item.image} alt={item.imageAlt || `Illustration d’ambiance pour ${item.name}`} loading="lazy" decoding="async" />}
    <div className="dish-copy">
      <div className="dish-heading"><h3>{item.name}</h3><span className="price">{item.price}<small> DT</small></span></div>
      {item.arabic && <p className="arabic dish-arabic" lang="ar" dir="rtl">{item.arabic}</p>}
      {item.description && <p className="description">{item.description}</p>}
      {item.note && <p className="portion">{item.note}</p>}
    </div>
  </article>
}

function EmptyCategory() {
  return <div className="empty-category" role="status"><span className="empty-wave" aria-hidden="true">⌁</span><p>Les articles de cette rubrique seront affichés après vérification sur le menu original.</p></div>
}

export default function App() {
  const [query, setQuery] = useState('')
  const [active, setActive] = useState('all')
  const normalizedQuery = query.trim().toLocaleLowerCase('fr')
  const shareUrl = typeof window === 'undefined' ? 'https://example.com' : window.location.href
  const visibleCategories = categories.filter((category) => active === 'all' || category.id === active)
  const matchesQuery = (item) => !normalizedQuery || [item.name, item.arabic, item.description, item.note].filter(Boolean).join(' ').toLocaleLowerCase('fr').includes(normalizedQuery)

  function selectCategory(id) {
    setActive(id)
    requestAnimationFrame(() => document.getElementById(id === 'all' ? 'menu' : id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  function searchMenu(value) {
    setQuery(value)
    if (value) setActive('all')
  }

  return <div className="site-shell">
    <a className="skip-link" href="#menu">Aller directement au menu</a>
    <header id="accueil" className="hero">
      <nav className="topbar" aria-label="Navigation principale">
        <a href="#accueil" className="brand" aria-label="La Voile Blanche, accueil"><SailMark /><span>LA VOILE<br /><em>BLANCHE</em></span></a>
        <div className="social-links" aria-label="Réseaux sociaux">
          <a href={instagram} target="_blank" rel="noreferrer" aria-label="La Voile Blanche sur Instagram"><SocialIcon type="instagram" /></a>
          <a href={facebook} target="_blank" rel="noreferrer" aria-label="La Voile Blanche sur Facebook"><SocialIcon type="facebook" /></a>
        </div>
      </nav>
      <div className="hero-copy">
        <p className="eyebrow">Sfax · Tunisie</p>
        <h1>La mer,<br /><i>à votre table.</i></h1>
        <p className="hero-intro">Une carte inspirée par les saveurs méditerranéennes.</p>
        <a className="scroll-cta" href="#menu">Voir le menu <span aria-hidden="true">↓</span></a>
      </div>
      <p className="hero-credit">Visuel d’ambiance · non représentatif d’un plat précis</p>
    </header>

    <main id="menu">
      <section className="menu-intro" aria-labelledby="menu-title">
        <p className="eyebrow eyebrow-navy">La carte</p>
        <h2 id="menu-title">Choisissez votre escale</h2>
        <p>Prix indiqués en dinars tunisiens (DT).</p>
      </section>

      <section className="menu-tools" aria-label="Rechercher et parcourir le menu">
        <div className="tools-inner">
          <label className="search"><SearchIcon /><span className="sr-only">Rechercher un plat</span><input value={query} onChange={(event) => searchMenu(event.target.value)} placeholder="Rechercher un plat" type="search" enterKeyHint="search" autoComplete="off" /></label>
          <div className="category-tabs" role="tablist" aria-label="Catégories du menu">
            <button type="button" role="tab" aria-selected={active === 'all'} className={active === 'all' ? 'active' : ''} onClick={() => selectCategory('all')}>Tout</button>
            {categories.map((category) => <button type="button" key={category.id} role="tab" aria-selected={active === category.id} className={active === category.id ? 'active' : ''} onClick={() => selectCategory(category.id)}>{category.label}</button>)}
          </div>
        </div>
      </section>

      <section className="menu-list" aria-live="polite">
        {visibleCategories.map((category) => {
          const items = menuItems.filter((item) => item.category === category.id && matchesQuery(item))
          return <section key={category.id} id={category.id} className={`category ${category.tone}`} aria-labelledby={`${category.id}-title`}>
            <div className="category-header">
              <div><p className="arabic category-ar" lang="ar" dir="rtl">{category.ar}</p><h2 id={`${category.id}-title`}>{category.label}</h2></div>
              {category.featured && <span className="sea-badge">Sélection de la mer</span>}
            </div>
            <div className="dishes">{items.length ? items.map((item) => <MenuCard key={item.id} item={item} />) : <EmptyCategory />}</div>
          </section>
        })}
      </section>

      {normalizedQuery && !menuItems.some(matchesQuery) && <p className="no-results">Aucun plat correspondant n’est encore répertorié.</p>}
      <section className="verification" aria-labelledby="verification-title">
        <div className="verification-mark" aria-hidden="true">!</div>
        <div><p className="eyebrow eyebrow-navy">Transparence</p><h2 id="verification-title">Menu en cours de vérification</h2><p>Les quatre photos papier nécessaires à la retranscription ne sont pas présentes dans le dossier du projet. Aucun article, tarif, traduction, portion ou numéro de téléphone n’a été inventé.</p></div>
      </section>
      <section className="qr-section" aria-labelledby="qr-title">
        <div><p className="eyebrow eyebrow-navy">À table</p><h2 id="qr-title">Le menu dans votre poche</h2><p>Scannez ce code avec l’appareil photo de votre téléphone. Après mise en ligne, il cible automatiquement l’adresse publique du menu.</p></div>
        <div className="qr-code"><QRCodeSVG value={shareUrl} size={130} bgColor="#fffdf8" fgColor="#082b42" level="M" includeMargin /><span>La Voile Blanche</span></div>
      </section>
    </main>

    <footer>
      <a href="#accueil" className="footer-brand"><SailMark /><span>La Voile Blanche</span></a>
      <p>Restaurant · Sfax, Tunisie</p>
      <div className="footer-social"><a href={instagram} target="_blank" rel="noreferrer">Instagram</a><a href={facebook} target="_blank" rel="noreferrer">Facebook</a></div>
      <p className="fine-print">Menu digital · Prix en DT · Aucun service de commande en ligne</p>
    </footer>
  </div>
}
