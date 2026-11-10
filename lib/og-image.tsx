import { ImageResponse } from 'next/og'
import { JETBRAINS_MONO_700_B64, ROBOTO_CONDENSED_900_B64, decodeFont } from '@/lib/og-fonts'

export const OG_SIZE = { width: 1200, height: 630 } as const

const ORANGE = '#e5632f'
const INK = '#1a1714'
const WHITE = '#fffaf3'
const PAPER = '#fdeee1'
const GRID = 'rgba(226, 84, 29, 0.16)'
const DISPLAY = 'Roboto Condensed'
const MONO = 'JetBrains Mono'


// Must stay in sync with the homepage <h1> in components/hero-section.tsx.
export const HOME_OG = {
  title: 'Building groovy superintelligence',
  description:
    'Our firm uses deep expertise and solutioneering paired with agentic support to deploy advanced solutions for federal and SLED. Our main product is Papyrus, the STIG-hardened superintelligent harness runtime built for the ATO from commit #001.',
  label: 'Papyrus · Customer-hosted software',
} as const

export type OgImageInput = {
  title: string
  description?: string
  label?: string
  date?: string
  /** The site origin, so the image can load the B_ mark from /brand. */
  origin?: string
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
  const cut = value.slice(0, max - 1)
  // Prefer ending on a whole sentence, then a whole word; never mid-word.
  const sentence = cut.lastIndexOf('. ')
  if (sentence > max * 0.5) return cut.slice(0, sentence + 1)
  const word = cut.lastIndexOf(' ')
  return `${(word > 0 ? cut.slice(0, word) : cut).replace(/[,;:—-]+$/, '').trimEnd()}…`
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
  // The B_ mark's ribbon: tangerine, coral, marigold and blush lanes with ink keylines, sweeping in from the top left.
  const lanes = ['#fbbba0', '#ffb81c', '#ff6f61', '#ff6a13']
  const ribbon = (y: number) => `M -60 ${y} C 220 ${y - 40}, 420 ${y + 170}, 700 ${y + 150} S 1050 ${y + 300}, 1290 ${y + 330}`
  const mark = input.origin ? new URL('/brand/beag-mark.png', input.origin).toString() : null

  return new ImageResponse(
    <div style={{ width: 1200, height: 630, display: 'flex', position: 'relative', overflow: 'hidden', backgroundColor: PAPER, backgroundImage: `linear-gradient(${GRID} 1px, transparent 1px), linear-gradient(90deg, ${GRID} 1px, transparent 1px)`, backgroundSize: '40px 40px', fontFamily: DISPLAY, color: INK }}>
      <svg width="1200" height="630" viewBox="0 0 1200 630" style={{ position: 'absolute', top: 0, left: 0 }}>
        {lanes.map((color, i) => <path key={`k${i}`} d={ribbon(40 + i * 34)} fill="none" stroke={INK} strokeWidth="40" />)}
        {lanes.map((color, i) => <path key={`c${i}`} d={ribbon(40 + i * 34)} fill="none" stroke={color} strokeWidth="29" />)}
      </svg>
      <div style={{ position: 'absolute', top: 56, left: 112, width: 984, height: 520, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', padding: '32px 66px 28px', backgroundColor: WHITE, border: `4px solid ${INK}`, borderRadius: 32, boxShadow: `12px 12px 0 ${INK}` }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
          <div style={{ display: 'flex', maxWidth: '100%', backgroundColor: ORANGE, color: INK, border: `2px solid ${INK}`, borderRadius: 999, boxShadow: `3px 3px 0 ${INK}`, padding: '8px 18px', fontFamily: MONO, fontSize: 14, letterSpacing: 1.7, textTransform: 'uppercase' }}>{label}</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', width: '100%', marginTop: 22, fontSize: size, lineHeight: 0.98, fontWeight: 900, textTransform: 'uppercase', letterSpacing: -1.4, maxHeight: 220, overflow: 'hidden' }}>{title}</div>
          <div style={{ display: 'flex', width: 440, height: 3, backgroundColor: INK, marginTop: 23 }} />
          {description ? <div style={{ display: 'flex', width: '100%', maxHeight: 102, overflow: 'hidden', justifyContent: 'center', textAlign: 'center', marginTop: 21, fontFamily: DISPLAY, fontWeight: 900, fontSize: 23, lineHeight: 1.28, color: '#3d2f26' }}>{description}</div> : null}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, fontFamily: MONO, fontSize: 15, letterSpacing: 2, color: INK }}>
          {mark ? <img src={mark} width={46} height={46} alt="" /> : null}
          <div style={{ display: 'flex', borderBottom: `2px solid ${INK}`, paddingBottom: 3 }}>BEAGLABS.COM →</div>
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
  const origin = new URL(request.url).origin
  if (searchParams.get('variant') === 'home') return renderOgImage({ ...HOME_OG, origin })
  return renderOgImage({
    title: searchParams.get('title') || 'Beag Labs',
    description: searchParams.get('description') || undefined,
    label: searchParams.get('label') || undefined,
    date: searchParams.get('date') || undefined,
    origin,
  })
}
