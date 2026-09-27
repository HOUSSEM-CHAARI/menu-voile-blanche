import QRCode from 'qrcode'

const ABYSS = '#0d2436'

/** The QR code opens "/", which shows French or the language the guest chose before. */
export function menuUrl(base: string): string {
  return `${base.replace(/\/+$/, '')}/`
}

const options = {
  // "Q" survives a scratched or partly covered table card.
  errorCorrectionLevel: 'Q' as const,
  margin: 4,
  color: { dark: ABYSS, light: '#ffffff' },
}

export async function qrSvg(url: string): Promise<string> {
  return QRCode.toString(url, { ...options, type: 'svg' })
}

/** High-resolution PNG (2048 px) for print shops and flyers. */
export async function qrPng(url: string, width = 2048): Promise<Buffer> {
  return QRCode.toBuffer(url, { ...options, type: 'png', width })
}
