/**
 * Back-office enhancements. Every form also works without JavaScript; this script adds:
 * toasts, the unsaved-changes warning, the live price preview, confirmations, one-tap
 * availability, drag-and-drop ordering and the photo crop frame.
 */
import { formatPrice, isImplausiblePrice, parsePriceInput } from '../lib/price'

const csrf = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? ''

/* ─── Toasts ──────────────────────────────────────────────────────────────── */

function toast(text: string, type: 'success' | 'error' = 'success'): void {
  document.querySelector('[data-toast]')?.remove()
  const element = document.createElement('p')
  element.className = `toast toast--${type}`
  element.setAttribute('role', 'status')
  element.dataset.toast = ''
  element.textContent = text
  document.body.append(element)
  hideLater(element)
}

function hideLater(element: Element): void {
  window.setTimeout(() => element.classList.add('is-hidden'), 3500)
}
document.querySelectorAll('[data-toast]').forEach(hideLater)

/* ─── Unsaved changes ─────────────────────────────────────────────────────── */

let dirty = false
for (const form of document.querySelectorAll<HTMLFormElement>('form[data-dirty-guard]')) {
  form.addEventListener('input', () => (dirty = true))
  form.addEventListener('change', () => (dirty = true))
  form.addEventListener('submit', () => (dirty = false))
}
window.addEventListener('beforeunload', (event) => {
  if (!dirty) return
  event.preventDefault()
})

/* ─── Confirmations ───────────────────────────────────────────────────────── */

document.addEventListener('submit', (event) => {
  const form = event.target as HTMLFormElement
  const submitter = (event as SubmitEvent).submitter as HTMLElement | null
  const message = submitter?.dataset.confirm ?? form.dataset.confirm
  if (message && !window.confirm(message)) {
    event.preventDefault()
    return
  }
  const price = form.querySelector<HTMLInputElement>('[data-price-input]')
  if (price && !submitter?.dataset.skipPriceCheck) {
    const value = parsePriceInput(price.value)
    if (
      value !== null &&
      isImplausiblePrice(value) &&
      !window.confirm(
        `Le prix affiché sera ${formatPrice(value, 'fr')}. Ce montant est inhabituel : confirmer ?`,
      )
    ) {
      event.preventDefault()
      dirty = true
    }
  }
})

/* ─── Live price preview ──────────────────────────────────────────────────── */

for (const input of document.querySelectorAll<HTMLInputElement>('[data-price-input]')) {
  const output = document.getElementById(input.dataset.priceInput ?? '')
  const unit = input.form?.querySelector<HTMLSelectElement>('[name="priceUnit"]')
  const update = () => {
    if (!output) return
    const value = parsePriceInput(input.value)
    const perGram = unit?.value === 'per100g' ? 'per100g' : 'item'
    output.textContent =
      value === null
        ? 'Prix invalide : écrivez par exemple 42 ou 42,500.'
        : `Affiché : ${formatPrice(value, 'fr', perGram)}${isImplausiblePrice(value) ? ' — montant inhabituel, vérifiez.' : ''}`
  }
  input.addEventListener('input', update)
  unit?.addEventListener('change', update)
  update()
}

/* ─── One-tap availability (and other inline toggles) ─────────────────────── */

for (const form of document.querySelectorAll<HTMLFormElement>('form[data-inline-toggle]')) {
  form.addEventListener('submit', async (event) => {
    event.preventDefault()
    const button = form.querySelector<HTMLButtonElement>('button')
    if (!button) return
    button.disabled = true
    try {
      // Not form.action: an input named "action" shadows that property.
      const response = await fetch(form.getAttribute('action') ?? location.href, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json', 'X-CSRF-Token': csrf },
      })
      const result = (await response.json()) as { ok: boolean; value: boolean; message: string }
      if (!response.ok || !result.ok) throw new Error(result.message)
      const value = form.querySelector<HTMLInputElement>('input[name="value"]')
      if (value) value.value = String(!result.value)
      button.setAttribute('aria-pressed', String(result.value))
      button.textContent = result.value
        ? (button.dataset.labelOn ?? '')
        : (button.dataset.labelOff ?? '')
      toast(result.message)
    } catch (error) {
      toast(error instanceof Error && error.message ? error.message : 'Échec, réessayez.', 'error')
    } finally {
      button.disabled = false
    }
  })
}

/* ─── Drag-and-drop ordering (up/down buttons remain for keyboard and phones) ─ */

for (const list of document.querySelectorAll<HTMLElement>('[data-sortable]')) {
  let dragged: HTMLElement | null = null
  list.addEventListener('dragstart', (event) => {
    dragged = (event.target as HTMLElement).closest('[data-id]')
    dragged?.classList.add('is-dragging')
  })
  list.addEventListener('dragover', (event) => {
    event.preventDefault()
    const over = (event.target as HTMLElement).closest<HTMLElement>('[data-id]')
    if (!dragged || !over || over === dragged || over.parentElement !== dragged.parentElement)
      return
    const box = over.getBoundingClientRect()
    over.parentElement?.insertBefore(
      dragged,
      event.clientY > box.top + box.height / 2 ? over.nextSibling : over,
    )
  })
  list.addEventListener('dragend', async () => {
    if (!dragged) return
    dragged.classList.remove('is-dragging')
    const group = dragged.parentElement
    dragged = null
    const ids = [...(group?.querySelectorAll<HTMLElement>(':scope > [data-id]') ?? [])].map((row) =>
      Number(row.dataset.id),
    )
    try {
      const response = await fetch(list.dataset.sortable ?? '', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrf,
          Accept: 'application/json',
        },
        body: JSON.stringify({ ids, groupId: Number(group?.dataset.groupId ?? 0) }),
      })
      const result = (await response.json()) as { ok: boolean; message: string }
      if (!result.ok) throw new Error(result.message)
      toast(result.message)
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Échec, rechargez la page.', 'error')
    }
  })
}

/* ─── Photo crop frame (4:3 for dishes, 16:9 for covers) ──────────────────── */

for (const root of document.querySelectorAll<HTMLElement>('[data-cropper-root]')) {
  const file = root.querySelector<HTMLInputElement>('input[type="file"]')
  const frame = root.querySelector<HTMLElement>('[data-cropper]')
  const zoom = root.querySelector<HTMLInputElement>('[data-zoom]')
  const fields = ['cropLeft', 'cropTop', 'cropWidth', 'cropHeight'].map((name) =>
    root.querySelector<HTMLInputElement>(`input[name="${name}"]`),
  )
  if (!file || !frame || !zoom) continue
  const image = new Image()
  let x = 0
  let y = 0
  let base = 1

  const clampAndWrite = () => {
    const scale = base * Number(zoom.value)
    const width = frame.clientWidth
    const height = frame.clientHeight
    const shownWidth = image.naturalWidth * scale
    const shownHeight = image.naturalHeight * scale
    x = Math.min(0, Math.max(width - shownWidth, x))
    y = Math.min(0, Math.max(height - shownHeight, y))
    image.style.width = `${shownWidth}px`
    image.style.height = `${shownHeight}px`
    image.style.left = `${x}px`
    image.style.top = `${y}px`
    const values = [-x / scale, -y / scale, width / scale, height / scale]
    fields.forEach((field, index) => {
      if (field) field.value = String(Math.round(values[index] ?? 0))
    })
  }

  file.addEventListener('change', () => {
    const chosen = file.files?.[0]
    if (!chosen) return
    if (chosen.size > 10 * 1024 * 1024) {
      toast('La photo dépasse 10 Mo.', 'error')
      file.value = ''
      return
    }
    image.onload = () => {
      frame.hidden = false
      zoom.hidden = false
      frame.replaceChildren(image)
      base = Math.max(
        frame.clientWidth / image.naturalWidth,
        frame.clientHeight / image.naturalHeight,
      )
      zoom.value = '1'
      x = (frame.clientWidth - image.naturalWidth * base) / 2
      y = (frame.clientHeight - image.naturalHeight * base) / 2
      clampAndWrite()
    }
    image.src = URL.createObjectURL(chosen)
  })

  zoom.addEventListener('input', () => {
    const before = base * Number(zoom.dataset.previous ?? 1)
    const after = base * Number(zoom.value)
    // Zoom around the centre of the frame.
    const cx = frame.clientWidth / 2
    const cy = frame.clientHeight / 2
    x = cx - ((cx - x) * after) / before
    y = cy - ((cy - y) * after) / before
    zoom.dataset.previous = zoom.value
    clampAndWrite()
  })

  let start: { px: number; py: number; x: number; y: number } | null = null
  frame.addEventListener('pointerdown', (event) => {
    start = { px: event.clientX, py: event.clientY, x, y }
    frame.setPointerCapture(event.pointerId)
  })
  frame.addEventListener('pointermove', (event) => {
    if (!start) return
    x = start.x + event.clientX - start.px
    y = start.y + event.clientY - start.py
    clampAndWrite()
  })
  frame.addEventListener('pointerup', () => (start = null))
}
