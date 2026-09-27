/**
 * Printable A6 table card (105 × 148 mm) in the brand design: logo, the QR code, one line per
 * language and the address to type by hand. Used by `npm run qr` (PDF) and, later, the back office.
 */
import { SAIL_MARKUP } from './brand-sail'
import { WORDMARK } from './brand-wordmark'

const escape = (text: string) =>
  text.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c,
  )

export function tableCardHtml(options: {
  qrSvg: string
  url: string
  /** Base URL of the /fonts folder (a file:// URL when printing from a script). */
  fontBase: string
}): string {
  const { qrSvg, url, fontBase } = options
  const waves = `M1 5q6 -3.2 12 0${' t12 0'.repeat(13)}`
  const display = url.replace(/^https?:\/\//, '').replace(/\/$/, '')
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>Carte de table — La Voile Blanche</title>
<style>
@font-face{font-family:Newsreader;font-weight:400;src:url(${fontBase}/newsreader-400.woff2)}
@font-face{font-family:'Voile Sans';font-weight:400;src:url(${fontBase}/voile-sans-400.woff2)}
@font-face{font-family:'Voile Sans';font-weight:600;src:url(${fontBase}/voile-sans-600.woff2)}
@font-face{font-family:'Voile Sans Arabic';font-weight:400;src:url(${fontBase}/voile-sans-arabic-400.woff2)}
@page{size:105mm 148mm;margin:0}
*{box-sizing:border-box}
html,body{margin:0;background:#fff}
body{font-family:'Voile Sans',system-ui,sans-serif;color:#0d2436;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.card{width:105mm;height:148mm;padding:8mm 9mm;display:grid;grid-template-rows:auto auto 1fr auto;justify-items:center;text-align:center;position:relative}
.card::after{content:'';position:absolute;inset:4mm;border:0.3mm solid #c8a675;border-radius:1.5mm;pointer-events:none}
.sail{width:12mm;height:15mm}
.mark,.wave{display:block;margin-inline:auto}
.mark{width:52mm;height:${((52 * WORDMARK.height) / WORDMARK.width).toFixed(2)}mm;margin-top:1.5mm}
.wave{width:30mm;height:2.4mm;margin:2.5mm auto 3mm}
.lines{display:grid;gap:0.6mm;font-size:9.5pt;line-height:1.3}
.lines .ar{font-family:'Voile Sans Arabic',sans-serif;font-size:10.5pt}
.lines .fr{font-weight:600;font-size:11pt}
.qr{width:60mm;height:60mm;align-self:center}
.qr svg{width:100%;height:100%;display:block}
.foot{display:grid;gap:0.8mm;font-size:8pt;color:#4b6275}
.foot b{font-family:Newsreader,serif;font-weight:400;font-size:10.5pt;color:#0d2436;letter-spacing:.01em}
@media screen{body{display:grid;place-items:center;min-height:100vh;background:#e9eef0}.card{background:#fff;box-shadow:0 10px 40px rgb(13 36 54 / .15)}}
</style>
</head>
<body>
<main class="card">
  <svg class="sail" viewBox="0 0 96 120" aria-hidden="true">${SAIL_MARKUP}</svg>
  <div>
    <svg class="mark" viewBox="${WORDMARK.viewBox}" role="img" aria-label="La Voile Blanche"><path fill="currentColor" d="${WORDMARK.d}"/></svg>
    <svg class="wave" viewBox="0 0 170 10" aria-hidden="true"><path d="${waves}" fill="none" stroke="#0d2436" stroke-width="1.6" stroke-linecap="round"/></svg>
    <div class="lines">
      <span class="fr">Scannez pour voir la carte</span>
      <span class="ar" lang="ar" dir="rtl">امسحوا الرمز لرؤية قائمة الطعام</span>
      <span class="en" lang="en">Scan to see the menu</span>
    </div>
  </div>
  <div class="qr">${qrSvg}</div>
  <div class="foot">
    <b>${escape(display)}</b>
    <span>FR · <span lang="ar">عربي</span> · EN</span>
  </div>
</main>
</body>
</html>`
}
