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

async function fetchAsset(url: string): Promise<ArrayBuffer | null> {
  try {
    const response = await fetch(url, { cache: 'force-cache' })
    if (!response.ok) return null
    return response.arrayBuffer()
  } catch {
    return null
  }
}

// External font availability must never decide whether a social preview exists.
// If a font host is temporarily unavailable, Satori falls back to its bundled
// font rather than turning /api/og into a 500 response for link-preview bots.
const fontData = Promise.all([
  fetchAsset(FONT_URLS.robotoCondensed),
  fetchAsset(FONT_URLS.workSans),
  fetchAsset(FONT_URLS.jetBrainsMono),
])

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

function isTrustedCoverHost(hostname: string) {
  return hostname === 'media.graphassets.com' || hostname.endsWith('.graphassets.com')
}

async function resolveCoverImage(rawCoverImage: string): Promise<string | null> {
  if (!rawCoverImage) return null

  try {
    const parsed = new URL(rawCoverImage)
    if (parsed.protocol !== 'https:' || !isTrustedCoverHost(parsed.hostname)) return null

    // Fetch the trusted Hygraph asset ourselves so a CDN hiccup cannot make
    // Satori fail halfway through the entire card render. If it is unavailable,
    // the branded black fallback panel is rendered instead.
    const response = await fetch(parsed.toString(), { cache: 'force-cache' })
    if (!response.ok) return null
    const contentType = response.headers.get('content-type')?.split(';')[0] ?? ''
    if (!contentType.startsWith('image/')) return null

    const bytes = Buffer.from(await response.arrayBuffer())
    if (bytes.byteLength > 8 * 1024 * 1024) return null
    return `data:${contentType};base64,${bytes.toString('base64')}`
  } catch {
    return null
  }
}

// `next/og` renders with Satori. This route is the shared renderer for
// dynamic OG + Twitter cards across Beag Labs.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const title = truncate(searchParams.get('title') ?? 'Beag Labs', 118)
  const description = truncate(searchParams.get('description') ?? '', 156)
  const label = truncate(
    searchParams.get('label') ?? 'Tools for a more secure tomorrow.',
    42
  )
  const rawDate = searchParams.get('date') ?? ''
  const rawCoverImage = searchParams.get('coverImage') ?? ''
  const coverImage = await resolveCoverImage(rawCoverImage)

  const date = rawDate
    ? new Date(rawDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
      })
    : ''

  const [robotoCondensed, workSans, jetBrainsMono] = await fontData
  const titleSize = getTitleSize(title)
  const headlineFont = robotoCondensed ? 'Roboto Condensed' : 'sans-serif'
  const bodyFont = workSans ? 'Work Sans' : 'sans-serif'
  const monoFont = jetBrainsMono ? 'JetBrains Mono' : 'monospace'
  const fonts: Array<{
    name: string
    data: ArrayBuffer
    weight: 600 | 700 | 900
    style: 'normal'
  }> = []

  if (robotoCondensed) fonts.push({ name: 'Roboto Condensed', data: robotoCondensed, weight: 900, style: 'normal' })
  if (workSans) fonts.push({ name: 'Work Sans', data: workSans, weight: 600, style: 'normal' })
  if (jetBrainsMono) fonts.push({ name: 'JetBrains Mono', data: jetBrainsMono, weight: 700, style: 'normal' })

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
            'linear-gradient(to right, rgba(17,17,17,0.11) 1px, transparent 1px), linear-gradient(to bottom, rgba(17,17,17,0.11) 1px, transparent 1px)',
          backgroundSize: '42px 42px',
          padding: '30px',
          fontFamily: bodyFont,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            height: '100%',
            border: `4px solid ${INK}`,
            backgroundColor: 'rgba(255,95,31,0.90)',
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
                  fontFamily: headlineFont,
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
                  fontFamily: monoFont,
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
                  fontFamily: monoFont,
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
                    fontFamily: monoFont,
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
                  maxWidth: '900px',
                  fontFamily: headlineFont,
                  fontSize: `${titleSize}px`,
                  fontWeight: 900,
                  lineHeight: 0.9,
                  letterSpacing: '-0.045em',
                  textTransform: 'uppercase',
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
                    maxWidth: '860px',
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

            {coverImage ? (
              <div
                style={{
                  display: 'flex',
                  width: '270px',
                  borderLeft: `4px solid ${INK}`,
                  backgroundColor: INK,
                  alignItems: 'stretch',
                  overflow: 'hidden',
                }}
              >
                <img
                  src={coverImage}
                  width="266"
                  height="410"
                  style={{ width: '266px', height: '410px', objectFit: 'cover' }}
                />
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  width: '270px',
                  borderLeft: `4px solid ${INK}`,
                  backgroundColor: INK,
                  color: WHITE,
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '28px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    width: '100%',
                    fontFamily: headlineFont,
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
              </div>
            )}
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
                fontFamily: monoFont,
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
                fontFamily: monoFont,
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
      ...(fonts.length ? { fonts } : {}),
      headers: {
        'Cache-Control': 'public, no-transform, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
        'Content-Type': 'image/png',
      },
    }
  )
}
