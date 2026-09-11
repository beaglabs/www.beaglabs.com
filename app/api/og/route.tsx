import { ImageResponse } from 'takumi-js/response'
import { googleFonts } from 'takumi-js/helpers'

export const runtime = 'nodejs'

// Renders a 1200x630 OG image that mirrors the /blog card UI (neobrutalist:
// white card, 3px black border, hard offset shadow, dotted-grid media area,
// orange category chip, mono date). Query params:
//   title       (required) — card headline
//   label       — category / eyebrow chip (defaults to a tagline)
//   description — optional supporting line
//   date        — ISO date; rendered in the mono meta row when present
//   icon        — absolute or root-relative image URL to feature centered in
//                 the media area (e.g. the Tradewinds Awardable badge)
// The output is a stable PNG URL, so it can also be uploaded/used as a Hygraph
// coverImage for a post.
export async function GET(request: Request) {
  const { origin, searchParams } = new URL(request.url)
  const title = searchParams.get('title') ?? 'Beag Labs'
  const description = searchParams.get('description') ?? ''
  const label = searchParams.get('label') ?? 'Small models. Deployable anywhere.'
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

  const titleSize = title.length > 64 ? 44 : title.length > 42 ? 54 : 64

  const fonts = await googleFonts([
    { name: 'Inter', weight: [500, 700, 800] },
    { name: 'JetBrains Mono', weight: [700] },
  ])

  const ORANGE = '#ff5f1f'
  const INK = '#111111'
  const DOT_GRID: Record<string, string> = {
    backgroundColor: '#f4f4f2',
    backgroundImage: 'radial-gradient(#c9c9c4 2px, transparent 2px)',
    backgroundSize: '26px 26px',
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          padding: '56px',
          backgroundColor: '#FAFAF9',
          backgroundImage: 'radial-gradient(#e4e4e0 2px, transparent 2px)',
          backgroundSize: '26px 26px',
          fontFamily: 'Inter',
        }}
      >
        {/* Card */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            border: `4px solid ${INK}`,
            boxShadow: `18px 18px 0px 0px ${INK}`,
            backgroundColor: '#ffffff',
            overflow: 'hidden',
          }}
        >
          {/* Media area */}
          <div
            style={{
              display: 'flex',
              position: 'relative',
              height: '312px',
              alignItems: 'center',
              justifyContent: 'center',
              borderBottom: `4px solid ${INK}`,
              ...(icon ? { backgroundColor: INK } : DOT_GRID),
            }}
          >
            {icon ? (
              <img
                src={icon}
                width={272}
                height={272}
                style={{ width: '272px', height: '272px', objectFit: 'contain' }}
              />
            ) : (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  border: `4px solid ${INK}`,
                  backgroundColor: ORANGE,
                  boxShadow: `8px 8px 0px 0px ${INK}`,
                  padding: '14px 26px',
                  fontFamily: 'JetBrains Mono',
                  fontSize: '26px',
                  fontWeight: 700,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: INK,
                }}
              >
                {label}
              </div>
            )}

            {/* Corner meta chip */}
            <div
              style={{
                display: 'flex',
                position: 'absolute',
                top: '20px',
                right: '20px',
                border: `3px solid ${INK}`,
                backgroundColor: '#ffffff',
                padding: '6px 12px',
                fontFamily: 'JetBrains Mono',
                fontSize: '16px',
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: INK,
              }}
            >
              beaglabs / blog
            </div>

            {/* CTA badge — conversion prompt, absolutely positioned so it
                never affects the title/description layout below */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                position: 'absolute',
                bottom: '20px',
                left: '20px',
                border: `3px solid ${INK}`,
                backgroundColor: ORANGE,
                boxShadow: `6px 6px 0px 0px ${INK}`,
                padding: '10px 22px',
                fontFamily: 'JetBrains Mono',
                fontSize: '22px',
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: INK,
              }}
            >
              Read more →
            </div>
          </div>

          {/* Body */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              justifyContent: 'center',
              padding: '36px 48px',
              backgroundColor: '#ffffff',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '18px',
                fontFamily: 'JetBrains Mono',
                fontSize: '20px',
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
              }}
            >
              <span style={{ color: ORANGE }}>{label}</span>
              {date ? (
                <span style={{ display: 'flex', color: '#555555' }}>
                  <span style={{ padding: '0 12px', color: INK }}>·</span>
                  {date}
                </span>
              ) : (
                <span />
              )}
            </div>

            <div
              style={{
                display: 'flex',
                fontSize: `${titleSize}px`,
                fontWeight: 800,
                lineHeight: 1.04,
                letterSpacing: '-0.035em',
                color: INK,
              }}
            >
              {title}
            </div>

            {description ? (
              <div
                style={{
                  display: 'flex',
                  marginTop: '18px',
                  fontSize: '24px',
                  fontWeight: 500,
                  lineHeight: 1.4,
                  color: '#555555',
                }}
              >
                {description.length > 120
                  ? `${description.slice(0, 117)}...`
                  : description}
              </div>
            ) : (
              <span />
            )}
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts,
      headers: {
        'Cache-Control': 'public, immutable, no-transform, max-age=86400',
      },
    }
  )
}
