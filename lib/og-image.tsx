import { ImageResponse } from 'next/og'
import { JETBRAINS_MONO_700_B64, ROBOTO_CONDENSED_900_B64, decodeFont } from '@/lib/og-fonts'

export const OG_SIZE = { width: 1200, height: 630 } as const

const ORANGE = '#ff5f1f'
const INK = '#111111'
const WHITE = '#ffffff'
const DISPLAY = 'Roboto Condensed'
const MONO = 'JetBrains Mono'


// Must stay in sync with the homepage <h1> in components/hero-section.tsx.
export const HOME_OG = {
  title: 'Building the Superintelligent ERP',
  description:
    'Your existing ERP stays the system of record. Papyrus orchestrates complex operations across entities, teams, and legacy systems.',
  label: 'Papyrus · Customer-hosted software',
} as const

export type OgImageInput = {
  title: string
  description?: string
  label?: string
  date?: string
}

// Decoded lazily per request: Workers forbid I/O at global scope, and these are embedded (no network).
let fontCache: { display: ArrayBuffer; mono: ArrayBuffer } | null = null
function getFonts() {
  fontCache ??= {
    display: decodeFont(ROBOTO_CONDENSED_900_B64),
    mono: decodeFont(JETBRAINS_MONO_700_B64),
  }
  return fontCache
}

function truncate(value: string, max: number) {
  if (value.length <= max) return value
  return `${value.slice(0, max - 1).trimEnd()}…`
}

function titleSize(title: string) {
  if (title.length <= 19) return 88
  if (title.length <= 33) return 73
  if (title.length <= 52) return 60
  if (title.length <= 75) return 49
  return 40
}

function formatDate(raw?: string) {
  if (!raw) return ''
  const parsed = new Date(raw)
  if (Number.isNaN(parsed.getTime())) return ''
  return parsed.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit', timeZone: 'UTC' })
}

export async function renderOgImage(input: OgImageInput) {
  const title = truncate(input.title || 'Beag Labs', 118)
  const description = truncate(input.description || '', 150)
  const label = truncate(input.label || HOME_OG.label, 44)
  const date = formatDate(input.date)
  const size = titleSize(title)
  const fonts = getFonts()
  // Deterministic, repeating dot field shared by all pages and blog previews.
  const palette = ['#ff5f1f', '#ff8a5c', '#ffb894', '#ffffff', '#ffc9b0']
  const dots = Array.from({ length: 36 }, (_, row) =>
    Array.from({ length: 68 }, (_, col) => {
      const n = (col * 17 + row * 31 + (col * row) % 11) % palette.length
      return { x: 7 + col * 18, y: 7 + row * 18, color: palette[n] }
    })
  ).flat()

  return new ImageResponse(
    <div style={{ width: 1200, height: 630, display: 'flex', position: 'relative', overflow: 'hidden', backgroundColor: '#111', fontFamily: DISPLAY, color: INK }}>
      <svg width="1200" height="630" viewBox="0 0 1200 630" style={{ position: 'absolute', top: 0, left: 0 }}>
        {dots.map((dot, i) => <circle key={i} cx={dot.x} cy={dot.y} r="7.7" fill={dot.color} />)}
      </svg>
      <div style={{ position: 'absolute', top: 56, left: 112, width: 984, height: 520, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', padding: '32px 66px 28px', backgroundColor: WHITE, border: '4px solid #111', boxShadow: '9px 9px 0 #111' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
          <div style={{ display: 'flex', maxWidth: '100%', backgroundColor: ORANGE, color: INK, border: '2px solid #111', boxShadow: '3px 3px 0 #111', padding: '8px 14px', fontFamily: MONO, fontSize: 14, letterSpacing: 1.7, textTransform: 'uppercase' }}>{label}</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', width: '100%', marginTop: 22, fontSize: size, lineHeight: 0.98, fontWeight: 900, textTransform: 'uppercase', letterSpacing: -1.4, maxHeight: 220, overflow: 'hidden' }}>{title}</div>
          <div style={{ display: 'flex', width: 440, height: 3, backgroundColor: INK, marginTop: 23 }} />
          {description ? <div style={{ display: 'flex', width: '100%', maxHeight: 102, overflow: 'hidden', justifyContent: 'center', textAlign: 'center', marginTop: 21, fontFamily: DISPLAY, fontWeight: 900, fontSize: 23, lineHeight: 1.28, color: '#333' }}>{description}</div> : null}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 28, fontFamily: MONO, fontSize: 15, letterSpacing: 2, color: INK }}>
          <div style={{ display: 'flex', borderBottom: '2px solid #111', paddingBottom: 3 }}>BEAGLABS.COM →</div>
          {date ? <div style={{ display: 'flex', fontSize: 11, letterSpacing: 0 }}>{date}</div> : null}
        </div>
      </div>
    </div>,
    {
      ...OG_SIZE,
      fonts: [
        { name: DISPLAY, data: fonts.display, weight: 900 as const, style: 'normal' as const },
        { name: MONO, data: fonts.mono, weight: 700 as const, style: 'normal' as const },
      ],
      headers: { 'Cache-Control': 'public, max-age=3600' },
    }
  )
}

export function renderOgRequest(request: Request) {
  const { searchParams } = new URL(request.url)
  if (searchParams.get('variant') === 'home') return renderOgImage(HOME_OG)
  return renderOgImage({
    title: searchParams.get('title') || 'Beag Labs',
    description: searchParams.get('description') || undefined,
    label: searchParams.get('label') || undefined,
    date: searchParams.get('date') || undefined,
  })
}
