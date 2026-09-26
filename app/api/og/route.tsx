import { ImageResponse } from 'next/og'

export const runtime = 'nodejs'

const ORANGE = '#ff5f1f'
const INK = '#111111'
const WHITE = '#ffffff'

const FONT_URLS = {
  robotoCondensed:
    'https://raw.githubusercontent.com/google/fonts/main/ofl/robotocondensed/RobotoCondensed%5Bwght%5D.ttf',
  workSans:
    'https://raw.githubusercontent.com/google/fonts/main/ofl/worksans/WorkSans%5Bwght%5D.ttf',
  jetBrainsMono:
    'https://raw.githubusercontent.com/google/fonts/main/ofl/jetbrainsmono/JetBrainsMono%5Bwght%5D.ttf',
} as const

const fontData = Promise.all(
  Object.values(FONT_URLS).map(async (url) => {
    const response = await fetch(url, { cache: 'force-cache' })
    if (!response.ok) {
      throw new Error(`Failed to load OG font: ${response.status}`)
    }
    return response.arrayBuffer()
  })
)

function truncate(value: string, max: number) {
  if (value.length <= max) return value
  return `${value.slice(0, max - 1).trimEnd()}…`
}

function getTitleSize(title: string) {
  if (title.length > 90) return 58
  if (title.length > 68) return 66
  if (title.length > 46) return 76
  return 88
}

// `next/og` renders with Satori. This is the shared renderer for dynamic OG
// and Twitter cards so pageMetadata() callers and blog articles inherit one
// Beag Labs visual system.
export async function GET(request: Request) {
  const { origin, searchParams } = new URL(request.url)
  const title = truncate(searchParams.get('title') ?? 'Beag Labs', 118)
  const description = truncate(searchParams.get('description') ?? '', 156)
  const label = truncate(
    searchParams.get('label') ?? 'Tools for a more secure tomorrow.',
    42
  )
  const rawDate = searchParams.get('date') ?? ''
  const rawIcon = searchParams.get('icon') ?? ''

  const icon = rawIcon
    ? rawIcon.startsWith('http')
      ? rawIcon
      : `${origin}${rawIcon.startsWith('/') ? '' : '/'}${rawIcon}`
    : ''

  const date = rawDate
    ? new Date(rawDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
      })
    : ''

  const [robotoCondensed, workSans, jetBrainsMono] = await fontData
  const titleSize = getTitleSize(title)

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
            'linear-gradient(to right, rgba(17,17,17,0.10) 1px, transparent 1px), linear-gradient(to bottom, rgba(17,17,17,0.10) 1px, transparent 1px)',
          backgroundSize: '42px 42px',
          padding: '30px',
          fontFamily: 'Work Sans',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            height: '100%',
            border: `4px solid ${INK}`,
            backgroundColor: ORANGE,
          }}
        >
          <div
            style={{
              height: '92px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: `4px solid ${INK}`,
              padding: '0 34px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '62px',
                  height: '48px',
                  backgroundColor: INK,
                  color: WHITE,
                  fontFamily: 'Roboto Condensed',
                  fontSize: '30px',
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
                  fontFamily: 'JetBrains Mono',
                  fontSize: '17px',
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
                  fontFamily: 'JetBrains Mono',
                  fontSize: '14px',
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                }}
              >
                {label}
              </div>
              {date ? (
                <div
                  style={{
                    display: 'flex',
                    marginLeft: '12px',
                    fontFamily: 'JetBrains Mono',
                    fontSize: '14px',
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
                padding: '44px 42px 36px 42px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  fontFamily: 'Roboto Condensed',
                  fontSize: `${titleSize}px`,
                  fontWeight: 900,
                  lineHeight: 0.9,
                  letterSpacing: '-0.045em',
                  textTransform: 'uppercase',
                  maxWidth: icon ? '720px' : '900px',
                }}
              >
                {title}
              </div>

              <div
                style={{
                  display: 'flex',
                  width: '100%',
                  height: '4px',
                  backgroundColor: INK,
                  marginTop: '24px',
                  marginBottom: description ? '20px' : '0px',
                }}
              />

              {description ? (
                <div
                  style={{
                    display: 'flex',
                    maxWidth: icon ? '680px' : '860px',
                    fontSize: '22px',
                    fontWeight: 600,
                    lineHeight: 1.32,
                    color: '#242424',
                  }}
                >
                  {description}
                </div>
              ) : null}
            </div>

            <div
              style={{
                display: 'flex',
                width: icon ? '330px' : '270px',
                borderLeft: `4px solid ${INK}`,
                backgroundColor: INK,
                color: WHITE,
                alignItems: 'center',
                justifyContent: 'center',
                padding: '28px',
              }}
            >
              {icon ? (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    height: '100%',
                    border: `3px solid ${WHITE}`,
                    backgroundColor: WHITE,
                    boxShadow: `10px 10px 0 ${ORANGE}`,
                    padding: '22px',
                  }}
                >
                  <img
                    src={icon}
                    alt=""
                    width={240}
                    height={240}
                    style={{
                      width: '240px',
                      height: '240px',
                      objectFit: 'contain',
                    }}
                  />
                </div>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    width: '100%',
                    fontFamily: 'Roboto Condensed',
                    fontSize: '43px',
                    fontWeight: 900,
                    lineHeight: 0.92,
                    letterSpacing: '-0.03em',
                    textTransform: 'uppercase',
                  }}
                >
                  <span>Tools for</span>
                  <span>a more</span>
                  <span style={{ color: ORANGE }}>secure</span>
                  <span>tomorrow.</span>
                </div>
              )}
            </div>
          </div>

          <div
            style={{
              height: '64px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderTop: `4px solid ${INK}`,
              padding: '0 34px',
              backgroundColor: WHITE,
            }}
          >
            <div
              style={{
                display: 'flex',
                fontFamily: 'JetBrains Mono',
                fontSize: '13px',
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
              }}
            >
              www.beaglabs.com
            </div>
            <div
              style={{
                display: 'flex',
                fontFamily: 'JetBrains Mono',
                fontSize: '13px',
                fontWeight: 700,
                letterSpacing: '0.12em',
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
      width: 1200,
      height: 630,
      fonts: [
        {
          name: 'Roboto Condensed',
          data: robotoCondensed,
          weight: 900,
          style: 'normal',
        },
        {
          name: 'Work Sans',
          data: workSans,
          weight: 600,
          style: 'normal',
        },
        {
          name: 'JetBrains Mono',
          data: jetBrainsMono,
          weight: 700,
          style: 'normal',
        },
      ],
      headers: {
        'Cache-Control': 'public, immutable, no-transform, max-age=86400',
      },
    }
  )
}
