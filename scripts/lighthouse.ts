/**
 * Lighthouse (mobile, simulated 4G) on the running production server.
 * Needs the `lighthouse` CLI (npx downloads it) and Google Chrome.
 * Usage: npm run lighthouse -- [--base http://localhost:4323] [--paths fr,ar,en] [--out dir]
 */
import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync } from 'node:fs'

const arg = (name: string, fallback: string) => {
  const index = process.argv.indexOf(`--${name}`)
  return index > -1 ? (process.argv[index + 1] ?? fallback) : fallback
}
const base = arg('base', 'http://localhost:4323')
const paths = arg('paths', 'fr,ar,en')
  .split(',')
  .map((path) => `/${path.replace(/^\/+/, '')}`)
const out = arg('out', 'screenshots/tmp/lighthouse')
const preset = arg('preset', 'mobile')
const chrome = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe'
mkdirSync(out, { recursive: true })

interface Report {
  categories: Record<string, { score: number }>
  audits: Record<string, { displayValue?: string; score: number | null; scoreDisplayMode: string }>
}

for (const path of paths) {
  const file = `${out}/${preset}${path.replace(/\//g, '-')}.json`
  try {
    execFileSync(
      'npx',
      [
        '--yes',
        'lighthouse@13',
        `${base}${path}`,
        `--chrome-path=${chrome}`,
        '--chrome-flags=--headless=new',
        '--only-categories=performance,accessibility,best-practices,seo',
        ...(preset === 'desktop' ? ['--preset=desktop'] : []),
        '--output=json',
        `--output-path=${file}`,
        '--quiet',
      ],
      { stdio: 'ignore', shell: true },
    )
  } catch {
    // Lighthouse sometimes fails to delete its temp folder on Windows after writing the report.
  }
  const report = JSON.parse(readFileSync(file, 'utf8')) as Report
  const scores = Object.entries(report.categories)
    .map(([name, category]) => `${name} ${Math.round(category.score * 100)}`)
    .join(' · ')
  const metric = (id: string) => report.audits[id]?.displayValue ?? '?'
  console.log(
    `${preset} ${path}: ${scores} | LCP ${metric('largest-contentful-paint')} · CLS ${metric('cumulative-layout-shift')} · TBT ${metric('total-blocking-time')}`,
  )
  for (const [id, audit] of Object.entries(report.audits)) {
    if (
      audit.score !== null &&
      audit.score < 0.9 &&
      !['informative', 'notApplicable', 'manual'].includes(audit.scoreDisplayMode)
    ) {
      console.log(`   ↳ ${id} ${audit.displayValue ?? ''}`)
    }
  }
}
