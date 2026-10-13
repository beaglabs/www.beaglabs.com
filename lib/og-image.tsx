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

function gridPath() {
  const v = Array.from({ length: 29 }, (_, i) => `M${i * 42} 0V630`).join(' ')
  const h = Array.from({ length: 16 }, (_, i) => `M0 ${i * 42}H1200`).join(' ')
  return `${v} ${h}`
}

const STEPS = [
  { name: 'Document ingested', state: 'done' },
  { name: 'Policy check passed', state: 'done' },
  { name: 'Human approval', state: 'active' },
  { name: 'Posted to records', state: 'idle' },
] as const

function WorkflowCard() {
  return (
    <div style={{ display: 'flex', position: 'relative', width: 330 }}>
      <div style={{ display: 'flex', flexDirection: 'column', width: 330, border: `3px solid ${INK}`, backgroundColor: WHITE, boxShadow: `10px 10px 0 ${INK}` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: INK, color: WHITE, padding: '10px 16px', fontFamily: MONO, fontSize: 13, letterSpacing: 1.5 }}>
          <div style={{ display: 'flex' }}>PAPYRUS / RUN 2841</div>
          <div style={{ display: 'flex', width: 10, height: 10, backgroundColor: ORANGE }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', padding: '18px 16px 8px' }}>
          {STEPS.map((step, i) => (
            <div key={step.name} style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
              <div
                style={{
                  display: 'flex',
                  width: 26,
                  height: 26,
                  marginRight: 14,
                  border: `3px solid ${INK}`,
                  backgroundColor: step.state === 'done' ? INK : step.state === 'active' ? ORANGE : WHITE,
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: MONO,
                  fontSize: 13,
                  color: step.state === 'done' ? WHITE : INK,
                }}
              >
                {i + 1}
              </div>
              <div style={{ display: 'flex', fontFamily: DISPLAY, fontSize: 21, letterSpacing: 0.5, textTransform: 'uppercase', color: step.state === 'idle' ? '#8a8a8a' : INK }}>
                {step.name}
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: `3px solid ${INK}`, padding: '10px 16px', fontFamily: MONO, fontSize: 12, letterSpacing: 1.2 }}>
          <div style={{ display: 'flex' }}>AWAITING REVIEWER</div>
          <div style={{ display: 'flex', backgroundColor: ORANGE, border: `2px solid ${INK}`, padding: '3px 8px' }}>APPROVE</div>
        </div>
      </div>
    </div>
  )
}

export async function renderOgImage(input: OgImageInput) {
  const title = truncate(input.title || 'Beag Labs', 118)
  const description = truncate(input.description || '', 150)
  const label = truncate(input.label || HOME_OG.label, 44)
  const date = formatDate(input.date)
  const size = titleSize(title)
  const fonts = getFonts()
  const words = title.toUpperCase().split(/\s+/)

  return new ImageResponse(
    <div style={{ width: 1200, height: 630, display: 'flex', position: 'relative', overflow: 'hidden', backgroundColor: WHITE, color: INK, fontFamily: DISPLAY }}>
      <svg width="1200" height="630" viewBox="0 0 1200 630" style={{ position: 'absolute', top: 0, left: 0 }}>
        <path d={gridPath()} fill="none" stroke={INK} strokeOpacity="0.09" strokeWidth="1" />
      </svg>
      {/* Orange block behind the workflow card */}
      <div style={{ display: 'flex', position: 'absolute', top: 0, right: 0, width: 400, height: 560, backgroundColor: ORANGE, borderLeft: `3px solid ${INK}` }} />
      <svg width="400" height="560" viewBox="0 0 400 560" style={{ position: 'absolute', top: 0, right: 0 }}>
        <path d={Array.from({ length: 10 }, (_, i) => `M0 ${i * 42}H400`).join(' ') + ' ' + Array.from({ length: 10 }, (_, i) => `M${i * 42} 0V560`).join(' ')} fill="none" stroke={INK} strokeOpacity="0.16" strokeWidth="1" />
      </svg>

      <div style={{ display: 'flex', position: 'relative', flexDirection: 'column', width: 1200, height: 630 }}>
        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '34px 52px 0', height: 96 }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 50, height: 46, marginRight: 16, border: `3px solid ${INK}`, backgroundColor: ORANGE, boxShadow: `4px 4px 0 ${INK}`, fontSize: 27 }}>B_</div>
            <div style={{ display: 'flex', fontFamily: MONO, fontSize: 16, letterSpacing: 3 }}>BEAG LABS</div>
          </div>
          {date ? <div style={{ display: 'flex', fontFamily: MONO, fontSize: 14, letterSpacing: 1.5, backgroundColor: WHITE, border: `2px solid ${INK}`, padding: '4px 10px' }}>{date}</div> : <div style={{ display: 'flex' }} />}
        </div>

        {/* Main */}
        <div style={{ display: 'flex', flex: 1, alignItems: 'center', padding: '0 52px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', width: 700 }}>
            <div style={{ display: 'flex', alignSelf: 'flex-start', border: `3px solid ${INK}`, backgroundColor: ORANGE, boxShadow: `4px 4px 0 ${INK}`, padding: '7px 16px', marginBottom: 26, fontFamily: MONO, fontSize: 15, letterSpacing: 2, textTransform: 'uppercase' }}>{label}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', fontSize: size, lineHeight: 0.98, letterSpacing: -1.5 }}>
              {words.map((word, i) => {
                const hot = HIGHLIGHT.has(word.replace(/[^A-Z]/g, ''))
                return (
                  <div key={`${word}-${i}`} style={{ display: 'flex', marginRight: Math.round(size * 0.22), padding: hot ? '0 10px' : 0, marginLeft: hot ? -10 : 0, backgroundColor: hot ? ORANGE : 'transparent', border: hot ? `3px solid ${INK}` : '3px solid transparent', ...(hot ? { boxShadow: `5px 5px 0 ${INK}` } : {}) }}>{word}</div>
                )
              })}
            </div>
            <div style={{ display: 'flex', width: 480, height: 4, backgroundColor: INK, marginTop: 24 }} />
            {description ? <div style={{ display: 'flex', marginTop: 20, maxWidth: 640, fontFamily: MONO, fontSize: 18, lineHeight: 1.5, color: '#333' }}>{description}</div> : null}
          </div>
          <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', paddingLeft: 20 }}>
            <WorkflowCard />
          </div>
        </div>

        {/* Footer strip */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 70, backgroundColor: INK, color: WHITE, padding: '0 52px', fontFamily: MONO, fontSize: 15, letterSpacing: 2 }}>
          <div style={{ display: 'flex' }}>
            <div style={{ display: 'flex', color: ORANGE }}>YOUR INFRASTRUCTURE</div>
            <div style={{ display: 'flex', margin: '0 14px' }}>/</div>
            <div style={{ display: 'flex' }}>YOUR DATA</div>
            <div style={{ display: 'flex', margin: '0 14px' }}>/</div>
            <div style={{ display: 'flex' }}>HUMAN APPROVALS</div>
          </div>
          <div style={{ display: 'flex', fontSize: 18, color: WHITE }}>BEAGLABS.COM</div>
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
