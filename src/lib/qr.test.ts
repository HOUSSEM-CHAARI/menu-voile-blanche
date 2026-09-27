import { describe, expect, it } from 'vitest'
import { menuUrl, qrPng, qrSvg } from './qr'
import { tableCardHtml } from './table-card'

describe('QR code', () => {
  it('points to the menu root so the remembered language applies', () => {
    expect(menuUrl('https://example.tn')).toBe('https://example.tn/')
    expect(menuUrl('https://example.tn///')).toBe('https://example.tn/')
  })
  it('renders SVG and a high-resolution PNG', async () => {
    const svg = await qrSvg('https://example.tn/')
    expect(svg).toContain('<svg')
    const png = await qrPng('https://example.tn/')
    expect(png.subarray(1, 4).toString()).toBe('PNG')
    expect(png.readUInt32BE(16)).toBeGreaterThanOrEqual(2048)
  })
  it('table card escapes the address it prints', () => {
    const html = tableCardHtml({ qrSvg: '<svg/>', url: 'https://a.tn/<b>', fontBase: '/fonts' })
    expect(html).toContain('a.tn/&lt;b&gt;')
    expect(html).toContain('size:105mm 148mm')
  })
})
