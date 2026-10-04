import { ImageResponse } from 'next/og'

// `next/og` is the App Router entrypoint for Vercel OG. ImageResponse is
// rendered by Vercel's Satori engine and rasterized to PNG for social crawlers.
export const OG_SIZE = { width: 1200, height: 630 } as const

const ORANGE = '#ff5f1f'
const INK = '#111111'
const WHITE = '#ffffff'

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
  if (title.length > 48) return 72
  return 82
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

export function renderOgImage(input: OgImageInput) {
  const title = truncate(input.title || 'Beag Labs', 118)
  const description = truncate(input.description || '', 170)
  const label = truncate(input.label || 'MISSION-READY', 40)
  const date = formatDate(input.date)

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          position: 'relative',
          overflow: 'hidden',
          backgroundColor: ORANGE,
          color: INK,
          backgroundImage:
            'linear-gradient(to right, rgba(17,17,17,0.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(17,17,17,0.12) 1px, transparent 1px)',
          backgroundSize: '44px 44px',
          padding: '28px',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            border: `4px solid ${INK}`,
            backgroundColor: 'rgba(255,95,31,0.93)',
          }}
        >
          <div
            style={{
              height: '88px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: `4px solid ${INK}`,
              padding: '0 32px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div
                style={{
                  width: '62px',
                  height: '48px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: INK,
                  color: WHITE,
                  fontSize: '28px',
                  fontWeight: 900,
                  letterSpacing: '-0.04em',
                }}
              >
                B_
              </div>
              <div
                style={{
                  display: 'flex',
                  marginLeft: '18px',
                  fontFamily: 'monospace',
                  fontSize: '16px',
                  fontWeight: 700,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                }}
              >
                Beag Labs
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  border: `3px solid ${INK}`,
                  backgroundColor: WHITE,
                  padding: '9px 14px',
                  fontFamily: 'monospace',
                  fontSize: '13px',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                }}
              >
                {label}
              </div>
              {date ? (
                <div
                  style={{
                    display: 'flex',
                    marginLeft: '14px',
                    fontFamily: 'monospace',
                    fontSize: '13px',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                  }}
                >
                  {date}
                </div>
              ) : null}
            </div>
          </div>

          <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                justifyContent: 'center',
                padding: '38px 42px 34px 42px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  maxWidth: '825px',
                  fontSize: `${titleSize(title)}px`,
                  fontWeight: 900,
                  lineHeight: 0.92,
                  letterSpacing: '-0.045em',
                  textTransform: 'uppercase',
                }}
              >
                {title}
              </div>

              <div
                style={{
                  width: '100%',
                  height: '4px',
                  display: 'flex',
                  backgroundColor: INK,
                  marginTop: '22px',
                  marginBottom: description ? '18px' : '0px',
                }}
              />

              {description ? (
                <div
                  style={{
                    display: 'flex',
                    maxWidth: '820px',
                    fontSize: '21px',
                    fontWeight: 600,
                    lineHeight: 1.28,
                    color: '#242424',
                  }}
                >
                  {description}
                </div>
              ) : null}
            </div>

            <div
              style={{
                width: '250px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                borderLeft: `4px solid ${INK}`,
                backgroundColor: INK,
                color: WHITE,
                padding: '30px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  fontSize: '42px',
                  fontWeight: 900,
                  lineHeight: 0.92,
                  letterSpacing: '-0.035em',
                  textTransform: 'uppercase',
                }}
              >
                <span>Custom AI.</span>
                <span style={{ color: ORANGE }}>On your</span>
                <span>infra.</span>
              </div>
            </div>
          </div>

          <div
            style={{
              height: '60px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderTop: `4px solid ${INK}`,
              padding: '0 32px',
              backgroundColor: WHITE,
            }}
          >
            <div
              style={{
                display: 'flex',
                fontFamily: 'monospace',
                fontSize: '12px',
                fontWeight: 700,
                letterSpacing: '0.13em',
                textTransform: 'uppercase',
              }}
            >
              www.beaglabs.com
            </div>
            <div
              style={{
                display: 'flex',
                fontFamily: 'monospace',
                fontSize: '12px',
                fontWeight: 700,
                letterSpacing: '0.11em',
                textTransform: 'uppercase',
              }}
            >
              AI · DATA · INFRASTRUCTURE
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      headers: {
        'Cache-Control':
          'public, no-transform, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
      },
    }
  )
}

export function renderOgRequest(request: Request) {
  const { searchParams } = new URL(request.url)
  return renderOgImage({
    title: searchParams.get('title') || 'Beag Labs',
    description: searchParams.get('description') || undefined,
    label: searchParams.get('label') || undefined,
    date: searchParams.get('date') || undefined,
  })
}
