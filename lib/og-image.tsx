import { ImageResponse } from 'next/og'
import { JETBRAINS_MONO_700_B64, ROBOTO_CONDENSED_900_B64, decodeFont } from '@/lib/og-fonts'

export const OG_SIZE = { width: 1200, height: 630 } as const

const ORANGE = '#ff5f1f'
const INK = '#111111'
const WHITE = '#ffffff'
const BLACK = '#000000'
const DISPLAY = 'Roboto Condensed'
const MONO = 'JetBrains Mono'

// Words rendered as orange "marker" highlights in the title.
const HIGHLIGHT = new Set(['ERP', 'SUPERINTELLIGENT'])

// Must stay in sync with the homepage <h1> in components/hero-section.tsx.
export const HOME_OG = {
  title: 'Building the Superintelligent ERP',
  description:
    'Experience what it feels like to have the data model ascendance of a superintelligent ERP. Try Papyrus now.',
  label: 'Papyrus · Agentic ERP',
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
  if (title.length <= 24) return 92
  if (title.length <= 42) return 74
  if (title.length <= 64) return 60
  if (title.length <= 88) return 50
  return 42
}

function formatDate(raw?: string) {
  if (!raw) return ''
  const parsed = new Date(raw)
  if (Number.isNaN(parsed.getTime())) return ''
  return parsed.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit', timeZone: 'UTC' })
}

// The homepage hero's dot field (components/hero-backdrop.tsx): same palette and spacing, colours fixed per position.
const DOT_COLORS = ['#ff5f1f', '#ff8a5c', '#ffb894', '#ffffff', '#ffc9b0']
const DOT_SPACING = 26
const DOT_RADIUS = 9
function dotField() {
  const dots: { x: number; y: number; color: string }[] = []
  let seed = 7
  for (let y = DOT_SPACING / 2; y < 630; y += DOT_SPACING) {
    for (let x = DOT_SPACING / 2; x < 1200; x += DOT_SPACING) {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff
      dots.push({ x, y, color: DOT_COLORS[seed % DOT_COLORS.length]! })
    }
  }
  return dots
}

export async function renderOgImage(input: OgImageInput) {
  const title = truncate(input.title || 'Beag Labs', 96)
  const description = truncate(input.description || '', 140)
  const label = truncate(input.label || HOME_OG.label, 44)
  const date = formatDate(input.date)
  const size = titleSize(title)
  const fonts = getFonts()
  const words = title.toUpperCase().split(/\s+/)

  return new ImageResponse(
    <div style={{ width: 1200, height: 630, display: 'flex', position: 'relative', overflow: 'hidden', backgroundColor: BLACK, color: INK, fontFamily: DISPLAY }}>
      <svg width="1200" height="630" viewBox="0 0 1200 630" style={{ position: 'absolute', top: 0, left: 0 }}>
        {dotField().map((dot) => <circle key={`${dot.x}-${dot.y}`} cx={dot.x} cy={dot.y} r={DOT_RADIUS} fill={dot.color} />)}
      </svg>

      {/* The copy in a white card, as on every page hero */}
      <div style={{ display: 'flex', position: 'absolute', left: 90, top: 64, width: 1020, height: 488, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: WHITE, border: `4px solid ${INK}`, boxShadow: `14px 14px 0 ${INK}`, padding: '0 56px' }}>
        <div style={{ display: 'flex', border: `3px solid ${INK}`, backgroundColor: ORANGE, boxShadow: `4px 4px 0 ${INK}`, padding: '6px 16px', marginBottom: 26, fontFamily: MONO, fontSize: 16, letterSpacing: 2, textTransform: 'uppercase' }}>{label}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', fontSize: size, lineHeight: 0.98, letterSpacing: -1.5, textAlign: 'center' }}>
          {words.map((word, i) => {
            const hot = HIGHLIGHT.has(word.replace(/[^A-Z]/g, ''))
            return (
              <div key={`${word}-${i}`} style={{ display: 'flex', margin: `0 ${Math.round(size * 0.11)}px 8px`, padding: hot ? '0 10px' : 0, backgroundColor: hot ? ORANGE : 'transparent', border: hot ? `3px solid ${INK}` : '3px solid transparent', ...(hot ? { boxShadow: `5px 5px 0 ${INK}` } : {}) }}>{word}</div>
            )
          })}
        </div>
        <div style={{ display: 'flex', width: 420, height: 4, backgroundColor: INK, marginTop: 18 }} />
        {description ? <div style={{ display: 'flex', marginTop: 20, maxWidth: 820, textAlign: 'center', justifyContent: 'center', fontFamily: MONO, fontSize: 19, lineHeight: 1.5, color: '#333' }}>{description}</div> : null}
      </div>

      {/* Brand and destination under the card */}
      <div style={{ display: 'flex', position: 'absolute', left: 90, right: 90, bottom: 22, alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 44, height: 36, marginRight: 12, border: `3px solid ${INK}`, backgroundColor: ORANGE, fontSize: 21 }}>B_</div>
          <div style={{ display: 'flex', fontFamily: MONO, fontSize: 15, letterSpacing: 3, color: WHITE, backgroundColor: BLACK, padding: '4px 8px' }}>BEAG LABS{date ? ` · ${date.toUpperCase()}` : ''}</div>
        </div>
        <div style={{ display: 'flex', fontFamily: MONO, fontSize: 17, letterSpacing: 2, color: INK, backgroundColor: ORANGE, border: `3px solid ${INK}`, padding: '4px 12px' }}>PAPYRUS.BEAGLABS.COM</div>
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
