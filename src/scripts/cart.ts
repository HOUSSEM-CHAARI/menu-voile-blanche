/**
 * The guest's order, kept on the phone only (localStorage): nothing is sent online.
 * The guest adds dishes, then shows the waiter screen; the waiter reads each dish in French.
 * Prices and availability always come from the page, so a stale order never shows old prices.
 */
import { formatPrice } from '../lib/price'
import type { Locale } from '../lib/types'

interface DishInfo {
  name: string
  lang: Locale
  nameFr: string
  price: number
  per100g: boolean
  soldOut: boolean
  thumb: string | null
}

interface Choice {
  /** Option label and choice in French (waiter) and in the guest's language. */
  labelFr: string
  fr: string
  text: string
}

interface Line {
  slug: string
  qty: number
  choices: Choice[]
}

interface Order {
  lines: Line[]
  table: string
  note: string
  updated: number
}

const STORAGE_KEY = 'vb-order'
/** An order left over from a previous meal is not restored. */
const MAX_AGE_MS = 6 * 60 * 60 * 1000
const MAX_QTY = 20

const locale = (document.documentElement.lang || 'fr') as Locale
const source = document.getElementById('cart-data')
const data = JSON.parse(source?.textContent ?? '{}') as {
  t: {
    cartItems: Partial<Record<Intl.LDMLPluralRule, string>> & { other: string }
    added: string
    inCart: string
    addToCart: string
    chooseOptions: string
    increase: string
    decrease: string
    weighed: string
    clearConfirm: string
    tableNumber: string
  }
  dishes: Record<string, DishInfo>
}
const t = data.t
const dishes = data.dishes ?? {}
const plural = new Intl.PluralRules(locale)

const $ = <T extends Element = HTMLElement>(selector: string) => document.querySelector<T>(selector)
const bar = $<HTMLButtonElement>('[data-cart-open]')
const barCount = $('[data-cart-count]')
const barTotal = $('[data-cart-bar-total]')
const toastBox = $('[data-cart-toast]')
const cart = $<HTMLDialogElement>('[data-cart]')
const sub = $('[data-cart-sub]')
const empty = $('[data-cart-empty]')
const list = $('[data-cart-lines]')
const extra = $('[data-cart-extra]')
const foot = $('[data-cart-foot]')
const total = $('[data-cart-total]')
const weighed = $('[data-cart-weighed]')
const tableInput = $<HTMLInputElement>('[data-cart-table]')
const noteInput = $<HTMLTextAreaElement>('[data-cart-note]')
const waiter = $<HTMLDialogElement>('[data-waiter]')

/* ─── State ───────────────────────────────────────────────────────────────── */

function load(): Order {
  const fresh: Order = { lines: [], table: '', note: '', updated: Date.now() }
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') as Order | null
    if (!saved || !Array.isArray(saved.lines) || Date.now() - saved.updated > MAX_AGE_MS) {
      return fresh
    }
    // Dishes removed from the menu, or now sold out, drop out of the order.
    saved.lines = saved.lines.filter((line) => {
      const dish = dishes[line.slug]
      return dish && !dish.soldOut && line.qty > 0
    })
    return { ...fresh, ...saved }
  } catch {
    return fresh
  }
}

let order = load()

// A QR code printed for one table can carry it: /fr?table=12.
const tableParam = new URLSearchParams(location.search).get('table')
if (tableParam && /^[\w-]{1,6}$/.test(tableParam)) order.table = tableParam

function save(): void {
  order.updated = Date.now()
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(order))
  } catch {
    // Private browsing: the order still works for this visit.
  }
}

const keyOf = (line: Pick<Line, 'slug' | 'choices'>) =>
  [line.slug, ...line.choices.map((choice) => choice.fr)].join('|')

const count = () => order.lines.reduce((sum, line) => sum + line.qty, 0)
const qtyOf = (slug: string) =>
  order.lines.filter((line) => line.slug === slug).reduce((sum, line) => sum + line.qty, 0)

function totals(): { amount: number; weighed: boolean } {
  let amount = 0
  let byWeight = false
  for (const line of order.lines) {
    const dish = dishes[line.slug]
    if (!dish) continue
    if (dish.per100g) byWeight = true
    else amount += dish.price * line.qty
  }
  return { amount, weighed: byWeight }
}

const price = (millimes: number) => formatPrice(millimes, locale)
const unitPrice = (dish: DishInfo) =>
  formatPrice(dish.price, locale, dish.per100g ? 'per100g' : 'item')
const itemsLabel = (n: number) =>
  (t.cartItems[plural.select(n)] ?? t.cartItems.other).replace('{n}', String(n))

function add(slug: string, qty = 1, choices: Choice[] = []): void {
  const dish = dishes[slug]
  if (!dish || dish.soldOut) return
  const key = keyOf({ slug, choices })
  const existing = order.lines.find((line) => keyOf(line) === key)
  if (existing) existing.qty = Math.min(MAX_QTY, existing.qty + qty)
  else order.lines.push({ slug, qty: Math.min(MAX_QTY, qty), choices })
  save()
  render()
  toast(t.added)
  bump(bar)
  navigator.vibrate?.(12)
}

function setQty(key: string, qty: number): void {
  order.lines = order.lines
    .map((line) => (keyOf(line) === key ? { ...line, qty: Math.min(MAX_QTY, qty) } : line))
    .filter((line) => line.qty > 0)
  save()
  render()
}

function clearOrder(): void {
  order = { lines: [], table: order.table, note: '', updated: Date.now() }
  save()
  render()
}

/* ─── Rendering ───────────────────────────────────────────────────────────── */

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag)
  if (className) element.className = className
  if (text !== undefined) element.textContent = text
  return element
}

function iconButton(step: number, label: string, onClick: () => void): HTMLButtonElement {
  const button = el('button')
  button.type = 'button'
  button.setAttribute('aria-label', label)
  // Same strokes as the Icon component: minus, or minus + vertical bar.
  button.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" aria-hidden="true"><path d="${step > 0 ? 'M12 5v14M5 12h14' : 'M5 12h14'}"/></svg>`
  button.addEventListener('click', onClick)
  return button
}

function choiceText(line: Line, inFrench: boolean): string {
  return line.choices.map((choice) => (inFrench ? choice.fr : choice.text)).join(' · ')
}

function renderLines(): void {
  if (!list) return
  list.replaceChildren(
    ...order.lines.map((line) => {
      const dish = dishes[line.slug] as DishInfo
      const key = keyOf(line)
      const item = el('li')
      if (dish.thumb) {
        const image = el('img', 'line-thumb')
        image.src = dish.thumb
        image.alt = ''
        image.width = 52
        image.height = 52
        item.append(image)
      } else {
        item.append(el('span', 'line-thumb'))
      }
      const text = el('div')
      const name = el('p', 'line-name', dish.name)
      name.lang = dish.lang
      text.append(name)
      if (line.choices.length) text.append(el('p', 'line-meta', choiceText(line, false)))
      text.append(el('p', 'line-price price', unitPrice(dish)))
      const stepper = el('div', 'stepper')
      stepper.setAttribute('role', 'group')
      stepper.setAttribute('aria-label', dish.name)
      const value = el('output', '', String(line.qty))
      stepper.append(
        iconButton(-1, t.decrease, () => setQty(key, line.qty - 1)),
        value,
        iconButton(1, t.increase, () => setQty(key, line.qty + 1)),
      )
      item.append(text, stepper)
      return item
    }),
  )
}

function render(): void {
  const n = count()
  const sum = totals()
  const totalText = sum.amount > 0 || !sum.weighed ? price(sum.amount) : '—'

  document.documentElement.classList.toggle('has-cart', n > 0)
  if (bar) bar.hidden = n === 0
  if (barCount) barCount.textContent = String(n)
  if (barTotal) barTotal.textContent = totalText
  if (sub) sub.textContent = n > 0 ? itemsLabel(n) : ''
  if (empty) empty.hidden = n > 0
  if (extra) extra.hidden = n === 0
  if (foot) foot.hidden = n === 0
  if (total) total.textContent = totalText
  if (weighed) weighed.hidden = !sum.weighed
  if (tableInput && document.activeElement !== tableInput) tableInput.value = order.table
  if (noteInput && document.activeElement !== noteInput) noteInput.value = order.note
  renderLines()

  // The quantity badge on each dish's + button.
  for (const button of document.querySelectorAll<HTMLElement>('[data-add-slug]')) {
    const slug = button.dataset.addSlug ?? ''
    const qty = qtyOf(slug)
    const badge = button.querySelector('[data-add-qty]')
    if (badge) badge.textContent = qty > 0 ? String(qty) : ''
    const name = dishes[slug]?.name ?? ''
    const base = (button.dataset.add ? t.addToCart : t.chooseOptions).replace('{name}', name)
    button.setAttribute(
      'aria-label',
      qty > 0 ? `${base} (${t.inCart.replace('{n}', String(qty))})` : base,
    )
  }
}

let toastTimer = 0
function toast(text: string): void {
  if (!toastBox) return
  toastBox.textContent = text
  window.clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => (toastBox.textContent = ''), 1600)
}

function bump(element: Element | null): void {
  if (!element) return
  element.classList.remove('is-bumped')
  // Restart the animation.
  void (element as HTMLElement).offsetWidth
  element.classList.add('is-bumped')
}

/* ─── Waiter screen ───────────────────────────────────────────────────────── */

let wakeLock: { release: () => Promise<void> } | null = null

function renderWaiter(): void {
  const title = $('[data-waiter-title]')
  const time = $('[data-waiter-time]')
  const lines = $('[data-waiter-lines]')
  const note = $('[data-waiter-note]')
  const sum = totals()
  if (title && order.table) title.textContent = t.tableNumber.replace('{n}', order.table)
  if (time) {
    time.textContent = new Intl.DateTimeFormat(locale, {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date())
  }
  lines?.replaceChildren(
    ...order.lines.map((line) => {
      const dish = dishes[line.slug] as DishInfo
      const item = el('li')
      item.append(el('span', 'qty', String(line.qty)))
      const text = el('div')
      const french = el('p', 'waiter-fr', dish.nameFr)
      french.lang = 'fr'
      text.append(french)
      if (dish.name !== dish.nameFr) {
        const local = el('p', 'waiter-local', dish.name)
        local.lang = dish.lang
        text.append(local)
      }
      for (const choice of line.choices) {
        const chosen = el('p', 'waiter-choice', `${choice.labelFr} : ${choice.fr}`)
        chosen.lang = 'fr'
        text.append(chosen)
      }
      text.append(el('p', 'waiter-local price', unitPrice(dish)))
      item.append(text)
      return item
    }),
  )
  if (note) {
    note.textContent = order.note
    note.hidden = !order.note.trim()
  }
  const waiterTotal = $('[data-waiter-total]')
  if (waiterTotal) waiterTotal.textContent = price(sum.amount)
  const waiterWeighed = $('[data-waiter-weighed]')
  if (waiterWeighed) waiterWeighed.hidden = !sum.weighed
}

async function keepAwake(on: boolean): Promise<void> {
  try {
    if (on) {
      const lock = (
        navigator as Navigator & {
          wakeLock?: { request: (type: 'screen') => Promise<{ release: () => Promise<void> }> }
        }
      ).wakeLock
      wakeLock = (await lock?.request('screen')) ?? null
    } else {
      await wakeLock?.release()
      wakeLock = null
    }
  } catch {
    // Not supported or refused: the screen may dim, nothing else changes.
  }
}

/* ─── Opening and closing (the back button closes the order, not the page) ── */

type View = 'cart' | 'waiter'
const viewState = () => (history.state as { vbOrder?: View } | null)?.vbOrder

function show(view: View, push: boolean): void {
  if (view === 'cart') {
    if (waiter?.open) waiter.close()
    if (!cart?.open) cart?.showModal()
    void keepAwake(false)
  } else {
    renderWaiter()
    if (cart?.open) cart.close()
    if (!waiter?.open) waiter?.showModal()
    void keepAwake(true)
  }
  document.documentElement.classList.add('sheet-open')
  if (push) history.pushState({ vbOrder: view }, '')
  else history.replaceState({ vbOrder: view }, '')
}

function hideAll(): void {
  if (cart?.open) cart.close()
  if (waiter?.open) waiter.close()
  document.documentElement.classList.remove('sheet-open')
  void keepAwake(false)
  bar?.focus({ preventScroll: true })
}

function close(): void {
  if (viewState()) history.back()
  else hideAll()
}

window.addEventListener('popstate', () => {
  const view = viewState()
  if (!view) hideAll()
  else if (view === 'cart' && !cart?.open) show('cart', false)
})

bar?.addEventListener('click', () => show('cart', true))
$('[data-cart-close]')?.addEventListener('click', close)
$('[data-waiter-open]')?.addEventListener('click', () => {
  if (count() > 0) show('waiter', false)
})
$('[data-waiter-back]')?.addEventListener('click', () => show('cart', false))
$('[data-waiter-done]')?.addEventListener('click', () => {
  clearOrder()
  close()
})
$('[data-cart-clear]')?.addEventListener('click', () => {
  if (window.confirm(t.clearConfirm)) clearOrder()
})
for (const dialog of [cart, waiter]) {
  dialog?.addEventListener('cancel', (event) => {
    event.preventDefault()
    close()
  })
  dialog?.addEventListener('click', (event) => {
    if (event.target === dialog) close()
  })
}
tableInput?.addEventListener('input', () => {
  order.table = tableInput.value.trim().slice(0, 6)
  save()
})
noteInput?.addEventListener('input', () => {
  order.note = noteInput.value.slice(0, 300)
  save()
})

/* ─── Adding dishes ───────────────────────────────────────────────────────── */

// "+" on a dish without choices: straight into the order.
document.addEventListener('click', (event) => {
  const button = (event.target as Element).closest<HTMLElement>('[data-add]')
  if (!button) return
  event.preventDefault()
  add(button.dataset.add ?? '')
  bump(button)
})

// In the dish sheet: quantity stepper and "Add" with the chosen options.
document.addEventListener('click', (event) => {
  const target = event.target as Element
  const step = target.closest<HTMLElement>('[data-step]')
  const bar = target.closest<HTMLElement>('[data-detail-add]')
  if (step && bar) {
    const output = bar.querySelector('[data-step-value]')
    const next = Math.min(
      MAX_QTY,
      Math.max(1, Number(output?.textContent) + Number(step.dataset.step)),
    )
    if (output) output.textContent = String(next)
    updateSheetTotal(bar)
    return
  }
  const addButton = target.closest<HTMLElement>('[data-sheet-add]')
  if (!addButton) return
  const slug = addButton.dataset.sheetAdd ?? ''
  const container = addButton.closest('[data-sheet-content]') ?? document
  const choices: Choice[] = [...container.querySelectorAll<HTMLElement>('[data-option]')].flatMap(
    (fieldset) => {
      const checked = fieldset.querySelector<HTMLInputElement>('input:checked')
      return checked
        ? [
            {
              labelFr: fieldset.dataset.labelFr ?? '',
              fr: checked.dataset.fr ?? '',
              text: checked.value,
            },
          ]
        : []
    },
  )
  const qty = Number(container.querySelector('[data-step-value]')?.textContent) || 1
  add(slug, qty, choices)
  document.dispatchEvent(new CustomEvent('vb:close-sheet'))
})

function updateSheetTotal(bar: Element): void {
  const slug = (bar as HTMLElement).dataset.detailAdd ?? ''
  const dish = dishes[slug]
  const output = bar.querySelector('[data-add-total]')
  const qty = Number(bar.querySelector('[data-step-value]')?.textContent) || 1
  const minus = bar.querySelector<HTMLButtonElement>('[data-step="-1"]')
  if (minus) minus.disabled = qty <= 1
  if (dish && output) output.textContent = dish.per100g ? unitPrice(dish) : price(dish.price * qty)
}

// The sheet content is cloned from a template each time it opens: fill in its total.
const sheetContent = $('[data-sheet-content]')
if (sheetContent) {
  new MutationObserver(() => {
    const addBar = sheetContent.querySelector('[data-detail-add]')
    if (addBar) updateSheetTotal(addBar)
  }).observe(sheetContent, { childList: true })
}

render()
