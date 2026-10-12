import { ImageResponse } from 'next/og'

export const OG_SIZE = { width: 1200, height: 630 } as const

const ORANGE = '#ff5f1f'
const INK = '#111111'
const WHITE = '#ffffff'

const DISPLAY_FONT_URL =
  'https://raw.githubusercontent.com/biswas08433/soulmate/9173666f41eb7b29a903cc719f0b75e642efeb69/assets/fonts/Roboto_Condensed/static/RobotoCondensed-Black.ttf'

async function fetchDisplayFont(): Promise<ArrayBuffer | null> {
  try {
    const response = await fetch(DISPLAY_FONT_URL, { cache: 'force-cache' })
    if (!response.ok) return null
    const data = await response.arrayBuffer()
    if (data.byteLength < 12) return null
    const sfntVersion = new DataView(data).getUint32(0, false)
    return sfntVersion === 0x00010000 ? data : null
  } catch {
    return null
  }
}

const displayFontPromise = fetchDisplayFont()

export type OgImageInput = {
  title: string
  description?: string
  label?: string
  date?: string
}

function truncate(value: string, max: number) {
  if (value.length <= max) return value
  return `${value.slice(0, max - 1).trimEnd()}…`
}

function titleSize(title: string) {
  if (title.length > 92) return 56
  if (title.length > 70) return 64
  if (title.length > 48) return 82
  return 94
}

function formatDate(raw?: string) {
  if (!raw) return ''
  const parsed = new Date(raw)
  if (Number.isNaN(parsed.getTime())) return ''
  return parsed.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    timeZone: 'UTC',
  })
}

async function renderHomeOgImage() {
  return renderOgImage({
    title: 'Solving the boring problems.',
    description: 'Document automation. Internal apps. Legacy modernization.',
    label: 'Papyrus / Back office',
  })
}

export async function renderOgImage(input: OgImageInput) {
  const title = truncate(input.title || 'Beag Labs', 118)
  const description = truncate(input.description || '', 170)
  const label = truncate(input.label || 'Papyrus / Back office', 40)
  const date = formatDate(input.date)
  const font = await displayFontPromise
  const family = font ? 'Roboto Condensed' : 'sans-serif'

  return new ImageResponse(
    <div style={{ width: 1200, height: 630, display: 'flex', position: 'relative', overflow: 'hidden', backgroundColor: WHITE, color: INK, fontFamily: 'sans-serif', padding: '38px 48px' }}>
      <svg width="1200" height="630" viewBox="0 0 1200 630" style={{ position: 'absolute', top: 0, left: 0 }}>
        <path d={Array.from({ length: 29 }, (_, i) => `M${i * 42} 0V630`).join(' ') + ' ' + Array.from({ length: 16 }, (_, i) => `M0 ${i * 42}H1200`).join(' ')} fill="none" stroke="#111111" strokeOpacity="0.11" strokeWidth="1" />
      </svg>
      <div style={{ display: 'flex', position: 'relative', flexDirection: 'column', width: '100%', height: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 48, height: 44, border: '2px solid '+INK, backgroundColor: ORANGE, boxShadow: '4px 4px 0 #111', fontFamily: family, fontSize: 25, fontWeight: 900 }}>B_</div>
            <div style={{ display: 'flex', fontSize: 14, fontWeight: 700, letterSpacing: 2 }}>BEAG LABS</div>
          </div>
          <div style={{ display: 'flex', fontSize: 13, fontWeight: 700, letterSpacing: 1, color: '#555' }}>{date || 'YOUR INFRASTRUCTURE · YOUR CONTROL'}</div>
        </div>
        <div style={{ display: 'flex', flex: 1, minHeight: 0, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '18px 0', gap: 24 }}>
          <div style={{ display: 'flex', border: '2px solid '+INK, backgroundColor: ORANGE, padding: '9px 18px', boxShadow: '4px 4px 0 #111', fontSize: 13, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' }}>{label}</div>
          <div style={{ display: 'flex', maxWidth: 1080, textAlign: 'center', justifyContent: 'center', fontFamily: family, fontWeight: 900, fontSize: titleSize(title), lineHeight: 0.96, letterSpacing: -2, textTransform: 'uppercase' }}>{title}</div>
          {description && <div style={{ display: 'flex', maxWidth: 950, justifyContent: 'center', textAlign: 'center', fontSize: 22, lineHeight: 1.45, color: '#444' }}>{description}</div>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '2px solid '+INK, paddingTop: 18, fontSize: 12, fontWeight: 700, letterSpacing: 1.5 }}>
          <div style={{ display: 'flex' }}>DOCUMENTS → WORKFLOWS → MODERN APPS</div>
          <div style={{ display: 'flex' }}>BEAGLABS.COM ↗</div>
        </div>
      </div>
    </div>,
    {
      ...OG_SIZE,
      ...(font ? { fonts: [{ name: 'Roboto Condensed', data: font, weight: 900 as const, style: 'normal' as const }] } : {}),
      headers: { 'Cache-Control': 'public, max-age=3600' },
    }
  )
}

export function renderOgRequest(request: Request) {
  if (new URL(request.url).searchParams.get('variant') === 'home') return renderHomeOgImage()
  const { searchParams } = new URL(request.url)
  return renderOgImage({
    title: searchParams.get('title') || 'Beag Labs',
    description: searchParams.get('description') || undefined,
    label: searchParams.get('label') || undefined,
    date: searchParams.get('date') || undefined,
  })
}
