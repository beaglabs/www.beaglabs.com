import { ImageResponse } from 'next/og'
import { JETBRAINS_MONO_700_B64, ROBOTO_CONDENSED_900_B64, decodeFont } from '@/lib/og-fonts'

export const OG_SIZE = { width: 1200, height: 630 } as const

const ORANGE = '#ff5f1f'
const INK = '#111111'
const WHITE = '#ffffff'
const DISPLAY = 'Roboto Condensed'
const MONO = 'JetBrains Mono'

// Words rendered as orange "marker" highlights in the title.
const HIGHLIGHT = new Set(['SLED', 'FEDERAL'])

// Must stay in sync with the homepage <h1> in components/hero-section.tsx.
export const HOME_OG = {
  title: 'Agentic Solutions for SLED and Federal',
  description:
    'Turn repetitive work into governed, reviewable actions on your own infrastructure.',
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
  if (title.length <= 24) return 104
  if (title.length <= 42) return 76
  if (title.length <= 64) return 66
  if (title.length <= 88) return 54
  return 44
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
  const words = title.toUpperCase().split(/\s+/)

  // Static approximation of the homepage's 18px interactive dot field for social crawlers.
  // Satori/OG images cannot run canvas effects, so use a deterministic SVG pattern.
  const palette = ['#ff5f1f', '#ff8a5c', '#ffb894', '#ffffff', '#ffc9b0']
  const dots = Array.from({ length: 35 }, (_, row) =>
    Array.from({ length: 67 }, (_, col) => {
      const n = (col * 17 + row * 31) % palette.length
      return { x: 9 + col * 18, y: 9 + row * 18, color: palette[n] }
    })
  ).flat()

  return new ImageResponse(
    <div style={{ width: 1200, height: 630, display: 'flex', position: 'relative', overflow: 'hidden', backgroundColor: '#111111', color: WHITE, fontFamily: DISPLAY }}>
      <svg width="1200" height="630" viewBox="0 0 1200 630" style={{ position: 'absolute', top: 0, left: 0 }}>
        {dots.map((dot, i) => <circle key={i} cx={dot.x} cy={dot.y} r="7" fill={dot.color} />)}
      </svg>
      {/* A solid black reading area echoes the homepage hero's typography over dots. */}
      <div style={{ display: 'flex', position: 'absolute', left: 0, top: 0, width: 815, height: 630, backgroundColor: '#111111' }} />
      <div style={{ display: 'flex', position: 'relative', flexDirection: 'column', width: 815, height: 630, padding: '38px 52px 34px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', fontFamily: MONO, fontWeight: 700, fontSize: 20, letterSpacing: 3, color: ORANGE }}>BEAG LABS<span style={{ color: WHITE }}>_</span></div>
          {date ? <div style={{ display: 'flex', color: '#ffb894', fontFamily: MONO, fontSize: 15 }}>{date}</div> : null}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1 }}>
          <div style={{ display: 'flex', alignSelf: 'flex-start', fontFamily: MONO, fontSize: 15, letterSpacing: 2, textTransform: 'uppercase', color: ORANGE, marginBottom: 24 }}>{label}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', fontSize: Math.min(size, 78), lineHeight: 0.99, letterSpacing: -1.1 }}>
            {words.map((word, i) => {
              const hot = HIGHLIGHT.has(word.replace(/[^A-Z]/g, ''))
              return <div key={i} style={{ display: 'flex', marginRight: 14, color: hot ? ORANGE : WHITE }}>{word}</div>
            })}
          </div>
          {description ? <div style={{ display: 'flex', marginTop: 26, maxWidth: 680, fontFamily: MONO, fontSize: 18, lineHeight: 1.4, color: '#f5c1a9' }}>{description}</div> : null}
        </div>
        <div style={{ display: 'flex', fontFamily: MONO, fontSize: 17, letterSpacing: 2, color: ORANGE }}>BEAGLABS.COM</div>
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
