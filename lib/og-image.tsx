import { ImageResponse } from 'next/og'

export const OG_SIZE = { width: 1200, height: 630 } as const

const ORANGE = '#ff5f1f'
const INK = '#111111'
const WHITE = '#ffffff'

const DISPLAY_FONT_URL =
  'https://raw.githubusercontent.com/biswas08433/soulmate/9173666f41eb7b29a903cc719f0b75e642efeb69/assets/fonts/Roboto_Condensed/static/RobotoCondensed-Black.ttf'

async function fetchDisplayFont(): Promise<ArrayBuffer | null> {
  try {
    const response = await fetch(DISPLAY_FONT_URL, { cache: 'force-cache' })
    if (!response.ok) return null
    const data = await response.arrayBuffer()
    if (data.byteLength < 12) return null
    const sfntVersion = new DataView(data).getUint32(0, false)
    return sfntVersion === 0x00010000 ? data : null
  } catch {
    return null
  }
}

const displayFontPromise = fetchDisplayFont()

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

async function renderHomeOgImage() {
  const font = await displayFontPromise
  const family = font ? 'Roboto Condensed' : 'sans-serif'
  // Pure hero composition: no imitation browser, navbar, app screenshots or CTAs.
  // Satori supports CSS gradients; explicit flex children keep the grid and text reliable.
  return new ImageResponse(
    <div style={{
      width: 1200, height: 630, display: 'flex', position: 'relative',
      backgroundColor: '#fafaf9', color: INK, overflow: 'hidden',

      padding: '46px',
    }}>
      {Array.from({length: 38}, (_,i) => <div key={'v'+i} style={{position:'absolute',top:0,left:i*32,width:1,height:630,backgroundColor:'rgba(17,17,17,0.12)'}} />)}
      {Array.from({length: 20}, (_,i) => <div key={'h'+i} style={{position:'absolute',left:0,top:i*32,width:1200,height:1,backgroundColor:'rgba(17,17,17,0.12)'}} />)}
      <div style={{display:'flex',position:'relative',width:'100%',height:'100%',flexDirection:'column',justifyContent:'space-between'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div style={{display:'flex',alignItems:'center',gap:13}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'center',width:60,height:60,backgroundColor:INK,color:WHITE,border:'5px solid '+ORANGE,boxShadow:'5px 5px 0px #111',fontFamily:family,fontSize:31,fontWeight:900}}>B_</div>
            <div style={{display:'flex',fontFamily:family,fontSize:28,fontWeight:900,letterSpacing:1}}>BEAG LABS</div>
          </div>
          <div style={{display:'flex',alignItems:'center',backgroundColor:ORANGE,border:'3px solid '+INK,padding:'12px 17px',fontSize:15,fontWeight:800,letterSpacing:2}}>CUSTOMER-HOSTED AI</div>
        </div>
        <div style={{display:'flex',flexDirection:'column',paddingTop:12}}>
          <div style={{display:'flex',flexDirection:'column',fontFamily:family,fontWeight:900,fontSize:110,lineHeight:0.87,letterSpacing:-3}}>
            <div style={{display:'flex'}}>SOLVING THE</div>
            <div style={{display:'flex'}}>BORING</div>
            <div style={{display:'flex'}}>PROBLEMS<span style={{color:ORANGE}}>.</span></div>
          </div>
          <div style={{display:'flex',width:750,height:5,backgroundColor:INK,marginTop:25,marginBottom:22}}/>
          <div style={{display:'flex',fontSize:23,lineHeight:1.32,fontWeight:600,maxWidth:930}}>
            Document automation. Internal apps. Legacy modernization.
          </div>
        </div>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',fontSize:15,fontWeight:800,letterSpacing:2}}>
          <div style={{display:'flex',backgroundColor:ORANGE,border:'3px solid '+INK,padding:'11px 18px',boxShadow:'5px 5px 0 #111'}}>YOUR INFRASTRUCTURE · YOUR CONTROL</div>
          <div style={{display:'flex'}}>BEAGLABS.COM ↗</div>
        </div>
      </div>
    </div>,
    {
      ...OG_SIZE,
      ...(font ? {fonts:[{name:'Roboto Condensed',data:font,weight:900 as const,style:'normal' as const}]} : {}),
      headers:{'Cache-Control':'public, max-age=3600'},
    }
  )
}

export async function renderOgImage(input: OgImageInput) {
  const title = truncate(input.title || 'Beag Labs', 118)
  const description = truncate(input.description || '', 170)
  const label = truncate(input.label || 'MISSION-READY', 40)
  const date = formatDate(input.date)
  const displayFontData = await displayFontPromise
  const displayFamily = displayFontData ? 'Roboto Condensed' : 'Arial Narrow'

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
                  fontFamily: displayFamily,
                  fontSize: '28px',
                  fontWeight: 900,
                  letterSpacing: '-0.04em',
                }}
              >
                B_
              </div>
              <div style={{ display: 'flex', marginLeft: '18px', fontSize: '16px', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase' }}>
                Beag Labs
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', border: `3px solid ${INK}`, backgroundColor: WHITE, padding: '9px 14px', fontSize: '13px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                {label}
              </div>
              {date ? (
                <div style={{ display: 'flex', marginLeft: '14px', fontSize: '13px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  {date}
                </div>
              ) : null}
            </div>
          </div>

          <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center', padding: '38px 42px 34px 42px' }}>
              <div style={{ display: 'flex', maxWidth: '825px', fontFamily: displayFamily, fontSize: `${titleSize(title)}px`, fontWeight: 900, lineHeight: 0.92, letterSpacing: '-0.045em', textTransform: 'uppercase' }}>
                {title}
              </div>

              <div style={{ width: '100%', height: '4px', display: 'flex', backgroundColor: INK, marginTop: '22px', marginBottom: description ? '18px' : '0px' }} />

              {description ? (
                <div style={{ display: 'flex', maxWidth: '820px', fontSize: '21px', fontWeight: 600, lineHeight: 1.28, color: '#242424' }}>
                  {description}
                </div>
              ) : null}
            </div>

            <div style={{ width: '250px', display: 'flex', flexDirection: 'column', justifyContent: 'center', borderLeft: `4px solid ${INK}`, backgroundColor: INK, color: WHITE, padding: '30px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', fontFamily: displayFamily, fontSize: '42px', fontWeight: 900, lineHeight: 0.92, letterSpacing: '-0.035em', textTransform: 'uppercase' }}>
                <span>Custom AI.</span>
                <span style={{ color: ORANGE }}>On your</span>
                <span>infra.</span>
              </div>
            </div>
          </div>

          <div style={{ height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: `4px solid ${INK}`, padding: '0 32px', backgroundColor: WHITE }}>
            <div style={{ display: 'flex', fontSize: '12px', fontWeight: 700, letterSpacing: '0.13em', textTransform: 'uppercase' }}>
              www.beaglabs.com
            </div>
            <div style={{ display: 'flex', fontSize: '12px', fontWeight: 700, letterSpacing: '0.11em', textTransform: 'uppercase' }}>
              AI · DATA · INFRASTRUCTURE
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      ...(displayFontData
        ? {
            fonts: [
              {
                name: 'Roboto Condensed',
                data: displayFontData,
                weight: 900 as const,
                style: 'normal' as const,
              },
            ],
          }
        : {}),
      headers: {
        'Cache-Control': 'public, no-store, max-age=0',
      },
    }
  )
}

export function renderOgRequest(request: Request) {
  if (new URL(request.url).searchParams.get('variant') === 'home') return renderHomeOgImage()
  const { searchParams } = new URL(request.url)
  return renderOgImage({
    title: searchParams.get('title') || 'Beag Labs',
    description: searchParams.get('description') || undefined,
    label: searchParams.get('label') || undefined,
    date: searchParams.get('date') || undefined,
  })
}
