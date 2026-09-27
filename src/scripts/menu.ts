/**
 * Public menu behaviour, kept small and framework-free:
 * scroll-spy on the category navigation, search with quick filters, and the dish detail sheet.
 */
import { normalizeForSearch } from '../lib/search'

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
const nav = document.querySelector<HTMLElement>('[data-menu-nav]')
const sections = [...document.querySelectorAll<HTMLElement>('[data-section]')]
const dishes = [...document.querySelectorAll<HTMLElement>('[data-dish]')]

/* ─── Scroll-spy ──────────────────────────────────────────────────────────── */

const scroller = document.querySelector<HTMLElement>('[data-category-scroller]')
const links = new Map(
  [...document.querySelectorAll<HTMLAnchorElement>('[data-category-link]')].map((link) => [
    link.dataset.categoryLink ?? '',
    link,
  ]),
)
let activeSlug = ''

function setActive(slug: string): void {
  if (slug === activeSlug) return
  links.get(activeSlug)?.removeAttribute('aria-current')
  activeSlug = slug
  const link = links.get(slug)
  if (!link) return
  link.setAttribute('aria-current', 'location')
  // Keep the active chip in view in the horizontal bar (works in both directions).
  if (scroller && scroller.scrollWidth > scroller.clientWidth) {
    const chip = link.getBoundingClientRect()
    const bar = scroller.getBoundingClientRect()
    const delta = chip.left + chip.width / 2 - (bar.left + bar.width / 2)
    scroller.scrollBy({ left: delta, behavior: reducedMotion.matches ? 'auto' : 'smooth' })
  }
}

const visible = new Set<Element>()
const spy = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) visible.add(entry.target)
      else visible.delete(entry.target)
    }
    const current = sections.find((section) => visible.has(section) && !section.hidden)
    if (current) setActive(current.id)
  },
  { rootMargin: '-25% 0px -60% 0px' },
)
for (const section of sections) spy.observe(section)

/* ─── Search and filters ──────────────────────────────────────────────────── */

const input = document.querySelector<HTMLInputElement>('[data-search-input]')
const openButton = document.querySelector<HTMLButtonElement>('[data-search-open]')
const closeButton = document.querySelector<HTMLButtonElement>('[data-search-close]')
const filterButtons = [...document.querySelectorAll<HTMLButtonElement>('[data-filter]')]
const results = document.querySelector<HTMLElement>('[data-results]')
const empty = document.querySelector<HTMLElement>('[data-no-results]')
const signatures = document.querySelector<HTMLElement>('[data-signatures]')
const main = document.querySelector<HTMLElement>('[data-menu-main]')
let filter = ''

function matchesFilter(dish: HTMLElement): boolean {
  if (!filter) return true
  if (filter === 'forTwo') return Number(dish.dataset.serves) >= 2
  return dish.dataset.kind === filter
}

function applySearch(): void {
  const words = normalizeForSearch(input?.value ?? '')
    .split(' ')
    .filter(Boolean)
  const active = words.length > 0 || filter !== ''
  let count = 0
  for (const dish of dishes) {
    const haystack = ` ${dish.dataset.search ?? ''}`
    const match = matchesFilter(dish) && words.every((word) => haystack.includes(` ${word}`))
    dish.hidden = active && !match
    if (!dish.hidden) count += 1
  }
  for (const section of sections) {
    section.hidden = active && !section.querySelector('[data-dish]:not([hidden])')
  }
  main?.classList.toggle('is-searching', active)
  if (signatures) signatures.hidden = active
  if (results) results.textContent = active ? formatCount(count) : ''
  if (empty) empty.hidden = !active || count > 0
}

function formatCount(count: number): string {
  const key = count === 0 ? 'zero' : count === 1 ? 'one' : 'many'
  return (results?.dataset[key] ?? '').replace('{n}', String(count))
}

/** Brings the top of the results into view when it is off screen. */
function scrollToMenuStart(smooth = true): void {
  const top = main?.getBoundingClientRect().top ?? 0
  if (top < 0 || top > window.innerHeight / 2) {
    const behavior = smooth && !reducedMotion.matches ? 'smooth' : 'auto'
    main?.scrollIntoView({ behavior, block: 'start' })
  }
}

function openSearch(): void {
  nav?.classList.add('is-searching')
  openButton?.setAttribute('aria-expanded', 'true')
  input?.focus()
  scrollToMenuStart()
}

function closeSearch(): void {
  if (input) input.value = ''
  setFilter('')
  nav?.classList.remove('is-searching')
  openButton?.setAttribute('aria-expanded', 'false')
  applySearch()
  openButton?.focus()
}

function setFilter(key: string): void {
  filter = key
  for (const button of filterButtons) {
    button.setAttribute('aria-pressed', String(button.dataset.filter === key))
  }
}

openButton?.addEventListener('click', openSearch)
closeButton?.addEventListener('click', closeSearch)
input?.addEventListener('input', () => {
  applySearch()
  scrollToMenuStart(false)
})
input?.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeSearch()
  if (event.key === 'Enter') input.blur()
})
for (const button of filterButtons) {
  button.addEventListener('click', () => {
    setFilter(filter === button.dataset.filter ? '' : (button.dataset.filter ?? ''))
    applySearch()
    scrollToMenuStart()
  })
}
document.querySelector('[data-show-all]')?.addEventListener('click', closeSearch)

/* ─── Dish detail sheet ───────────────────────────────────────────────────── */

const sheet = document.querySelector<HTMLDialogElement>('[data-sheet]')
const panel = document.querySelector<HTMLElement>('[data-sheet-panel]')
const content = document.querySelector<HTMLElement>('[data-sheet-content]')
const toast = document.querySelector<HTMLElement>('[data-sheet-toast]')
let openSlug = ''
let pushed = false
let opener: HTMLElement | null = null

const template = (slug: string) =>
  document.querySelector<HTMLTemplateElement>(`template[data-dish-template="${CSS.escape(slug)}"]`)

function openSheet(slug: string, push: boolean): void {
  const source = template(slug)
  if (!sheet || !content || !source) return
  content.replaceChildren(source.content.cloneNode(true))
  content.scrollTop = 0
  if (!sheet.open) {
    opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
    sheet.showModal()
    document.documentElement.classList.add('sheet-open')
  }
  openSlug = slug
  if (push) {
    history.pushState({ sheet: slug }, '', `#${slug}`)
    pushed = true
  }
  content.querySelector<HTMLElement>('#sheet-title')?.focus()
}

function finishClose(): void {
  if (!sheet) return
  sheet.classList.remove('is-closing')
  sheet.close()
  document.documentElement.classList.remove('sheet-open')
  if (panel) panel.style.transform = ''
  opener?.focus({ preventScroll: true })
  opener = null
}

function closeSheet(fromHistory = false): void {
  if (!sheet?.open) return
  openSlug = ''
  if (!fromHistory) {
    if (pushed) history.back()
    else history.replaceState(null, '', location.pathname + location.search)
  }
  pushed = false
  if (reducedMotion.matches) {
    finishClose()
  } else {
    sheet.classList.add('is-closing')
    window.setTimeout(finishClose, 180)
  }
}

document.addEventListener('click', (event) => {
  const trigger = (event.target as Element).closest<HTMLElement>('[data-open-dish]')
  if (!trigger || event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey) return
  event.preventDefault()
  openSheet(trigger.dataset.openDish ?? '', true)
})

sheet?.addEventListener('cancel', (event) => {
  event.preventDefault()
  closeSheet()
})
sheet?.addEventListener('click', (event) => {
  if (event.target === sheet) closeSheet()
})
document.querySelector('[data-sheet-close]')?.addEventListener('click', () => closeSheet())

document.querySelector('[data-sheet-share]')?.addEventListener('click', async () => {
  const url = `${location.origin}${location.pathname}#${openSlug}`
  const title = template(openSlug)?.dataset.title ?? document.title
  try {
    if (navigator.share) {
      await navigator.share({ title, url })
      return
    }
    await navigator.clipboard.writeText(url)
    if (toast) {
      toast.textContent = toast.dataset.copied ?? ''
      window.setTimeout(() => (toast.textContent = ''), 2000)
    }
  } catch {
    // The guest cancelled the share sheet: nothing to do.
  }
})

// Back and forward buttons open and close the sheet.
window.addEventListener('popstate', () => {
  const slug = decodeURIComponent(location.hash.slice(1))
  if (sheet?.open && slug !== openSlug) closeSheet(true)
  else if (!sheet?.open && template(slug)) openSheet(slug, false)
})

// Swipe down on the sheet to close it.
let startY = 0
let dragging = false
panel?.addEventListener(
  'touchstart',
  (event) => {
    const touch = event.touches[0]
    dragging = (content?.scrollTop ?? 0) <= 0 && touch !== undefined
    startY = touch?.clientY ?? 0
  },
  { passive: true },
)
panel?.addEventListener(
  'touchmove',
  (event) => {
    if (!dragging || !panel) return
    const dy = (event.touches[0]?.clientY ?? startY) - startY
    panel.style.transform = dy > 0 ? `translateY(${dy}px)` : ''
  },
  { passive: true },
)
panel?.addEventListener('touchend', (event) => {
  if (!dragging || !panel) return
  dragging = false
  const dy = (event.changedTouches[0]?.clientY ?? startY) - startY
  if (dy > 90) closeSheet()
  else panel.style.transform = ''
})

// Deep link: /fr#brik-au-thon opens that dish.
const initial = decodeURIComponent(location.hash.slice(1))
if (initial && template(initial)) openSheet(initial, false)
