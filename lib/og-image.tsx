import { ImageResponse } from 'next/og'
import { JETBRAINS_MONO_700_B64, ROBOTO_CONDENSED_900_B64, decodeFont } from '@/lib/og-fonts'
import { splitHeadline } from '@/lib/headline'

export const OG_SIZE = { width: 1200, height: 630 } as const

const ORANGE = '#ff5f1f'
const INK = '#111111'
const PEACH = '#fff1e9'
const DISPLAY = 'Roboto Condensed'
const MONO = 'JetBrains Mono'

// Must stay in sync with the homepage hero in components/hero-section.tsx.
export const HOME_OG = {
  title: 'We build superintelligent solutions.',
  before: 'We build',
  slab: 'superintelligent',
  after: 'solutions.',
  description: 'Deep expertise and solutioneering paired with superintelligent agents, deploying advanced solutions for federal and SLED.',
  label: 'Beag Labs · Federal + SLED',
} as const

export type OgImageInput = {
  title: string
  /** Optional explicit headline split; otherwise the title's last word(s) go on the slab. */
  before?: string
  slab?: string
  after?: string
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

/** Font size from the longest headline line, so the slab never runs off the card. */
function headlineSize(lines: string[]) {
  const longest = Math.max(...lines.map((line) => line.length), 1)
  if (longest <= 12) return 112
  if (longest <= 17) return 96
  if (longest <= 24) return 76
  if (longest <= 32) return 60
  if (longest <= 42) return 48
  return 40
}

function formatDate(raw?: string) {
  if (!raw) return ''
  const parsed = new Date(raw)
  if (Number.isNaN(parsed.getTime())) return ''
  return parsed.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit', timeZone: 'UTC' })
}

const crop = (style: Record<string, number | string>) => <div style={{ position: 'absolute', width: 30, height: 30, borderColor: INK, borderStyle: 'solid', borderWidth: 0, ...style }} />

/** The social card, in the edgy hero's style: grainy peach-to-black gradient, crop marks, slab headline. */
export async function renderOgImage(input: OgImageInput) {
  const title = truncate(input.title || 'Beag Labs', 110)
  const [autoBefore, autoSlab, autoAfter] = splitHeadline(title)
  const before = input.slab ? input.before ?? '' : autoBefore
  const slab = input.slab ?? autoSlab
  const after = input.slab ? input.after ?? '' : autoAfter
  const description = truncate(input.description || '', 140)
  const label = truncate(input.label || HOME_OG.label, 44)
  const date = formatDate(input.date)
  const size = headlineSize([before, slab, after].filter(Boolean))
  const fonts = getFonts()
  // A fixed speckle pattern stands in for the hero's film grain.
  const grain = Array.from({ length: 900 }, (_, i) => ({ x: (i * 97) % 1200, y: (i * 53 + Math.floor(i / 12) * 7) % 630, o: ((i * 31) % 10) / 60 }))

  return new ImageResponse(
    <div style={{ width: 1200, height: 630, display: 'flex', position: 'relative', overflow: 'hidden', fontFamily: DISPLAY, color: INK, backgroundImage: 'linear-gradient(145deg, #ffb894 0%, #ff5f1f 38%, #c2410c 72%, #000000 100%)' }}>
      <svg width="1200" height="630" viewBox="0 0 1200 630" style={{ position: 'absolute', top: 0, left: 0 }}>
        {grain.map((g, i) => <rect key={i} x={g.x} y={g.y} width="2" height="2" fill={i % 3 ? '#000' : '#fff'} fillOpacity={g.o} />)}
      </svg>
      {crop({ top: 22, left: 22, borderLeftWidth: 4, borderTopWidth: 4 })}
      {crop({ top: 22, right: 22, borderRightWidth: 4, borderTopWidth: 4 })}
      {crop({ bottom: 22, left: 22, borderLeftWidth: 4, borderBottomWidth: 4, borderColor: '#fff' })}
      {crop({ bottom: 22, right: 22, borderRightWidth: 4, borderBottomWidth: 4, borderColor: '#fff' })}
      <div style={{ position: 'absolute', top: 28, right: 70, display: 'flex', fontFamily: MONO, fontSize: 13, letterSpacing: 2.4, color: INK }}>38.8977° N · 77.0365° W</div>

      <div style={{ position: 'absolute', top: 70, left: 72, right: 72, bottom: 70, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignSelf: 'flex-start', alignItems: 'center', backgroundColor: INK, color: '#fff', border: `3px solid ${INK}`, padding: '8px 14px', fontFamily: MONO, fontSize: 16, letterSpacing: 2.6, textTransform: 'uppercase' }}>
          <div style={{ display: 'flex', width: 11, height: 11, backgroundColor: ORANGE, marginRight: 12 }} />{label}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', marginTop: 26, fontSize: size, lineHeight: 0.9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: -1.5 }}>
          {before ? <div style={{ display: 'flex' }}>{before}</div> : null}
          {slab ? <div style={{ display: 'flex', alignSelf: 'flex-start', backgroundColor: INK, color: ORANGE, padding: `2px ${Math.round(size * 0.16)}px ${Math.round(size * 0.06)}px`, margin: `${Math.round(size * 0.08)}px 0`, transform: 'rotate(-1deg)', boxShadow: `8px 8px 0 ${PEACH}` }}>{slab}</div> : null}
          {after ? <div style={{ display: 'flex' }}>{after}</div> : null}
        </div>
        {description ? <div style={{ display: 'flex', alignSelf: 'flex-start', maxWidth: 820, marginTop: 30, backgroundColor: INK, color: '#fff', borderLeft: `8px solid ${ORANGE}`, padding: '14px 20px', fontFamily: DISPLAY, fontWeight: 900, fontSize: 24, lineHeight: 1.3 }}>{description}</div> : null}
      </div>

      <div style={{ position: 'absolute', bottom: 28, left: 70, display: 'flex', alignItems: 'center', fontFamily: MONO, fontSize: 14, letterSpacing: 2.4, color: '#fff' }}>
        <div style={{ display: 'flex', width: 10, height: 10, backgroundColor: ORANGE, marginRight: 12 }} />BEAGLABS.COM
      </div>
      {date ? <div style={{ position: 'absolute', bottom: 28, right: 70, display: 'flex', fontFamily: MONO, fontSize: 14, letterSpacing: 2.4, color: '#fff' }}>{date.toUpperCase()}</div> : null}
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
