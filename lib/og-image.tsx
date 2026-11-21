import { ImageResponse } from 'next/og'
import { FRAUNCES_700_ITALIC_B64, FRAUNCES_800_B64, JETBRAINS_MONO_700_B64, WORK_SANS_400_B64, decodeFont } from '@/lib/og-fonts'
import { splitHeadline } from '@/lib/headline'

export const OG_SIZE = { width: 1200, height: 630 } as const

const ORANGE = '#e5632f'
const INK = '#1a1714'
const RUST = '#b2391a'
const CHARCOAL = '#5b4a3d'
const PAPER = '#fdeee1'
const DISPLAY = 'Fraunces'
const BODY = 'Work Sans'
const MONO = 'JetBrains Mono'

// Must stay in sync with the home hero in components/home/home-page.tsx.
export const HOME_OG = {
  title: 'We build groovy software for the public mission.',
  before: 'We build groovy software',
  slab: 'for the public mission.',
  after: '',
  description: 'A small-business studio for custom software and AI agents. We build inside your boundary and carry it through the ATO.',
  label: 'GovCon studio · NAICS 541511',
} as const

export type OgImageInput = {
  title: string
  /** Optional explicit headline split; `slab` is set in orange italic. Otherwise the title's last word(s) are. */
  before?: string
  slab?: string
  after?: string
  description?: string
  label?: string
  date?: string
}

// Decoded lazily per request: Workers forbid I/O at global scope, and these are embedded (no network).
let fontCache: { display: ArrayBuffer; italic: ArrayBuffer; body: ArrayBuffer; mono: ArrayBuffer } | null = null
function getFonts() {
  fontCache ??= {
    display: decodeFont(FRAUNCES_800_B64),
    italic: decodeFont(FRAUNCES_700_ITALIC_B64),
    body: decodeFont(WORK_SANS_400_B64),
    mono: decodeFont(JETBRAINS_MONO_700_B64),
  }
  return fontCache
}

function truncate(value: string, max: number) {
  if (value.length <= max) return value
  const cut = value.slice(0, max - 1)
  const space = cut.lastIndexOf(' ')
  return `${(space > max * 0.6 ? cut.slice(0, space) : cut).replace(/[\s,;:.–—-]+$/, '')}…`
}

/** Headline size from its total length: it wraps freely now, so length sets the line count. */
function headlineSize(text: string) {
  const length = text.length
  const longestWord = Math.max(...text.split(/\s+/).map(word => word.length), 1)
  const byLength = length <= 24 ? 92 : length <= 40 ? 78 : length <= 56 ? 66 : length <= 80 ? 56 : 46
  // A long single word ("superintelligence") takes a line of its own at large sizes; cap so the card stays clear of the ribbon.
  return longestWord > 14 ? Math.min(byLength, 64) : byLength
}

function formatDate(raw?: string) {
  if (!raw) return ''
  const parsed = new Date(raw)
  if (Number.isNaN(parsed.getTime())) return ''
  return parsed.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit', timeZone: 'UTC' })
}

// The home hero's foot: the B_ ribbon (rust, tangerine, coral, marigold, blush with ink keylines) sweeping along the
// bottom, and a persimmon sun with its construction lines on the right.
const LANES = [RUST, '#ff6a13', '#ff6f61', '#ffb81c', '#fbbba0']
const RIBBON = 'M -80 556 C 160 556 300 492 500 502 C 690 512 760 572 930 568 C 1080 564 1160 512 1290 500'
const SUN = { x: 1052, y: 250, r: 92 }

function Scenery() {
  const { x, y, r } = SUN
  return (
    <svg width="1200" height="630" viewBox="0 0 1200 630" style={{ position: 'absolute', top: 0, left: 0 }}>
      <path d={`M ${x - 230} ${y} H 1200 M ${x} 40 V 630`} stroke={RUST} strokeWidth="1.5" strokeDasharray="3 6" opacity="0.7" />
      <circle cx={x} cy={y} r={r + 48} fill="none" stroke={RUST} strokeWidth="1.5" opacity="0.7" />
      <circle cx={x} cy={y} r={r + 26} fill="none" stroke={RUST} strokeWidth="2" strokeDasharray="2 7" opacity="0.8" />
      <path d={`M ${x - 150} 92 h 20 M ${x - 140} 82 v 20 M 1160 420 h 20 M 1170 410 v 20`} stroke={RUST} strokeWidth="2.5" />
      <circle cx={x} cy={y} r={r} fill="#ff6a13" stroke={INK} strokeWidth="5" />
      {LANES.map((color, i) => (
        <g key={color} transform={`translate(${-14 * i} ${17 * i})`}>
          <path d={RIBBON} fill="none" stroke={INK} strokeWidth="24" />
          <path d={RIBBON} fill="none" stroke={color} strokeWidth="19" />
        </g>
      ))}
    </svg>
  )
}

/** One word per box so a roman run and an italic run wrap together like inline text. */
function words(text: string, style: Record<string, string | number>) {
  return text.split(/\s+/).filter(Boolean).map((word, index) => <span key={`${word}${index}`} style={{ marginRight: '0.24em', ...style }}>{word}</span>)
}

/** The social card, in the home page's style: drafting paper, mono tag, Fraunces headline with an orange italic run. */
export async function renderOgImage(input: OgImageInput) {
  const title = truncate(input.title || 'Beag Labs', 110)
  const [autoBefore, autoSlab, autoAfter] = splitHeadline(title)
  const before = input.slab ? input.before ?? '' : autoBefore
  const slab = input.slab ?? autoSlab
  const after = input.slab ? input.after ?? '' : autoAfter
  const description = truncate(input.description || '', 160)
  const label = truncate(input.label || HOME_OG.label, 44)
  const date = formatDate(input.date)
  const size = headlineSize([before, slab, after].join(' ').trim())
  const fonts = getFonts()

  return new ImageResponse(
    <div style={{ width: 1200, height: 630, display: 'flex', position: 'relative', overflow: 'hidden', fontFamily: BODY, color: INK, backgroundColor: PAPER,
      backgroundImage: 'linear-gradient(rgba(226, 84, 29, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(226, 84, 29, 0.2) 1px, transparent 1px), linear-gradient(rgba(226, 84, 29, 0.09) 1px, transparent 1px), linear-gradient(90deg, rgba(226, 84, 29, 0.09) 1px, transparent 1px)',
      backgroundSize: '80px 80px, 80px 80px, 16px 16px, 16px 16px' }}>
      <Scenery />

      <div style={{ position: 'absolute', top: 44, right: 64, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', fontFamily: MONO, fontSize: 15, letterSpacing: 2.4, color: INK }}>
        <div style={{ display: 'flex' }}>BEAGLABS.COM</div>
        {date ? <div style={{ display: 'flex', marginTop: 6, color: RUST }}>{date.toUpperCase()}</div> : null}
      </div>

      <div style={{ position: 'absolute', top: 44, left: 72, width: 830, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignSelf: 'flex-start', alignItems: 'center', backgroundColor: ORANGE, border: `2px solid ${INK}`, borderRadius: 3, boxShadow: `4px 4px 0 ${INK}`, padding: '7px 14px', fontFamily: MONO, fontSize: 15, letterSpacing: 2.6, textTransform: 'uppercase' }}>
          <div style={{ display: 'flex', width: 9, height: 9, backgroundColor: INK, marginRight: 11 }} />{label}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', marginTop: 30, fontFamily: DISPLAY, fontWeight: 800, fontSize: size, lineHeight: 1.02, letterSpacing: -1.6 }}>
          {words(before, {})}
          {words(slab, { fontStyle: 'italic', fontWeight: 700, color: ORANGE })}
          {words(after, {})}
        </div>
        {description ? <div style={{ display: 'flex', maxWidth: 760, marginTop: 22, fontSize: 24, lineHeight: 1.4, color: CHARCOAL }}>{description}</div> : null}
      </div>
    </div>,
    {
      ...OG_SIZE,
      fonts: [
        { name: DISPLAY, data: fonts.display, weight: 800 as const, style: 'normal' as const },
        { name: DISPLAY, data: fonts.italic, weight: 700 as const, style: 'italic' as const },
        { name: BODY, data: fonts.body, weight: 400 as const, style: 'normal' as const },
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
