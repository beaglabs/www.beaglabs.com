import { ImageResponse } from 'takumi-js/response'
import { googleFonts } from 'takumi-js/helpers'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const title = searchParams.get('title') ?? 'Beag Labs'
  const description = searchParams.get('description') ?? ''
  const label = searchParams.get('label') ?? 'Small models. Deployable anywhere.'

  const fonts = await googleFonts([
    { name: 'Inter', weight: [500, 700, 800] },
    { name: 'JetBrains Mono', weight: [700] },
  ])

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '64px',
          backgroundColor: '#FAFAF9',
          backgroundImage: 'linear-gradient(135deg, #FAFAF9 0%, #FFF3E6 100%)',
          fontFamily: 'Inter',
          position: 'relative',
        }}
      >
        {/* Top border accent */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '6px',
            backgroundColor: '#ff5f1f',
            display: 'flex',
          }}
        />

        {/* Brand row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginTop: '12px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#111111',
              color: '#FAFAF9',
              padding: '6px 14px',
              fontSize: '24px',
              fontWeight: 800,
              letterSpacing: '-0.04em',
              fontFamily: 'Inter',
            }}
          >
            B_
          </div>
          <span
            style={{
              fontSize: '20px',
              fontWeight: 800,
              color: '#111111',
              letterSpacing: '0.08em',
              fontFamily: 'Inter',
            }}
          >
            BEAG LABS
          </span>
        </div>

        {/* Main content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            maxWidth: '900px',
          }}
        >
          {/* Label */}
          <div
            style={{
              display: 'flex',
              alignSelf: 'flex-start',
              alignItems: 'center',
              backgroundColor: '#ff5f1f',
              color: '#111111',
              padding: '5px 14px',
              fontSize: '14px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.14em',
              fontFamily: 'JetBrains Mono',
              border: '2px solid #111111',
            }}
          >
            {label}
          </div>

          {/* Title */}
          <div
            style={{
              fontSize: title.length > 40 ? '56px' : '72px',
              fontWeight: 800,
              color: '#111111',
              lineHeight: 1.05,
              letterSpacing: '-0.045em',
              fontFamily: 'Inter',
            }}
          >
            {title}
          </div>

          {/* Description */}
          {description && (
            <div
              style={{
                fontSize: '28px',
                fontWeight: 500,
                color: '#404040',
                lineHeight: 1.45,
                maxWidth: '850px',
                fontFamily: 'Inter',
              }}
            >
              {description}
            </div>
          )}
        </div>

        {/* Bottom row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '3px solid #111111',
            paddingTop: '20px',
          }}
        >
          <div
            style={{
              fontSize: '18px',
              fontWeight: 500,
              color: '#555555',
              fontFamily: 'Inter',
            }}
          >
            beaglabs.com
          </div>
          <div
            style={{
              display: 'flex',
              gap: '10px',
            }}
          >
            {['Custom Models', 'On-Prem Deploy', '13x Cheaper Than GPT'].map((chip) => (
              <div
                key={chip}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: '#000000',
                  color: '#111111',
                  padding: '6px 14px',
                  fontSize: '14px',
                  fontWeight: 700,
                  border: '2px solid #111111',
                  fontFamily: 'Inter',
                }}
              >
                {chip}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts,
      headers: {
        'Cache-Control': 'public, immutable, max-age=86400',
      },
    }
  )
}
