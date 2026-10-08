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
  const displayFontData = await displayFontPromise
  const bold = displayFontData ? 'Roboto Condensed' : 'Arial Narrow'
  const frame = { display: 'flex' as const, border: '3px solid #111', background: WHITE }
  return new ImageResponse(
    <div style={{ width: 1200, height: 630, display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: WHITE, color: INK, fontFamily: 'sans-serif', backgroundImage: 'linear-gradient(to right,rgba(17,17,17,.09) 1px,transparent 1px),linear-gradient(to bottom,rgba(17,17,17,.09) 1px,transparent 1px)', backgroundSize: '32px 32px' }}>
      <div style={{height: 45, display: 'flex', paddingLeft: 32, alignItems: 'center'}}>
        <div style={{...frame, backgroundColor: ORANGE, padding: '7px 13px', fontSize: 13, fontWeight: 700, letterSpacing: 2, boxShadow: '4px 4px 0px #111'}}>PAPYRUS · CUSTOMER-HOSTED SOFTWARE</div>
      </div>
      <div style={{height: 30, display: 'flex', background: INK, color: WHITE, justifyContent: 'center', alignItems: 'center', fontSize: 12}}>Practical AI on your own infrastructure <span style={{color: ORANGE, marginLeft: 10}}>BEAG LABS →</span></div>
      <div style={{height: 62, display: 'flex', backgroundColor: ORANGE, borderBottom: '4px solid #111', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px'}}>
        <div style={{display:'flex', alignItems:'center', justifyContent:'center', width:42, height:42, color:WHITE, background: INK, fontSize:23, fontWeight:900}}>B_</div>
        <div style={{display:'flex', fontWeight:800, fontSize:13, letterSpacing:1}}>SOLUTIONS　　EXPLORE　　RESOURCES　　COMPANY</div>
        <div style={{...frame, fontWeight:800, fontSize:12, padding:'10px 14px', boxShadow:'4px 4px 0px #111'}}>SEE PAPYRUS →</div>
      </div>
      <div style={{display:'flex', flex:1, padding:'30px 32px 24px', gap:34}}>
        <div style={{width:535, display:'flex', flexDirection:'column', justifyContent:'center'}}>
          <div style={{display:'flex', flexDirection:'column', fontFamily:bold, fontWeight:900, fontSize:82, lineHeight:.87, letterSpacing:-3}}>
            <span>SOLVING THE</span><span>BORING</span><span>PROBLEMS.</span>
          </div>
          <div style={{display:'flex', backgroundColor:INK, width:'100%', height:4, marginTop:23, marginBottom:20}}/>
          <div style={{fontSize:19, lineHeight:1.35, fontWeight:600, display:'flex'}}>Give Papyrus a document, a legacy workflow, or an internal process. Turn repetitive work into governed, reviewable actions on your infrastructure.</div>
          <div style={{display:'flex', gap:10, marginTop:20}}>
            <div style={{...frame, background:ORANGE, boxShadow:'4px 4px 0px #111', fontSize:14, fontWeight:900, padding:'12px 15px'}}>START A ONE-MONTH TRIAL →</div>
            <div style={{...frame, fontSize:14, fontWeight:900, padding:'12px 13px'}}>EXPLORE PAPYRUS</div>
          </div>
          <div style={{display:'flex', marginTop:21, fontSize:11, letterSpacing:1, color:'#555', fontWeight:700}}>YOUR INFRASTRUCTURE · YOUR DATA · HUMAN APPROVALS</div>
        </div>
        <div style={{flex:1, display:'flex', flexDirection:'column', border:'4px solid #111', boxShadow:'9px 9px 0 #111', background:WHITE}}>
          <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', height:52, padding:'0 14px', borderBottom:'2px solid #ddd'}}>
            <div style={{display:'flex', alignItems:'center', gap:9}}><span style={{display:'flex', width:27, height:27, alignItems:'center', justifyContent:'center', background:INK, color:WHITE, fontWeight:900}}>P</span><span style={{fontWeight:800,fontSize:15}}>Papyrus</span><span style={{fontSize:13,color:'#777'}}>/ Sessions</span></div>
            <div style={{fontSize:11,fontWeight:700,color:'#16864b'}}>● PREVIEW</div>
          </div>
          <div style={{display:'flex', flex:1}}>
            <div style={{display:'flex', width:116, padding:11, flexDirection:'column', borderRight:'1px solid #ddd', gap:20, fontSize:12, fontWeight:700}}>
              <span>▣ Sessions</span><span>☷ Decisions</span><span>▤ Tools</span>
            </div>
            <div style={{display:'flex',flex:1,flexDirection:'column',padding:13}}>
              <div style={{display:'flex',flexDirection:'column',border:'1px solid #ddd',background:'#f8f8f8',padding:12,fontSize:14,lineHeight:1.3}}>
                Extract key terms from this contract and create a summary of the obligations and renewal terms.
                <span style={{display:'flex',alignSelf:'flex-start',background:WHITE,border:'1px solid #bbb',padding:'6px 9px',fontSize:11,marginTop:9}}>▣ contract-intake.pdf　×</span>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:9,marginTop:22}}>
                <span style={{display:'flex',alignItems:'center',justifyContent:'center',width:31,height:31,background:ORANGE,border:'2px solid #111',fontWeight:900}}>P</span><span style={{fontWeight:800,fontSize:13}}>Papyrus</span><span style={{fontSize:12,color:'#777'}}>Extracting document...</span>
              </div>
              <div style={{display:'flex', flexDirection:'column',marginLeft:14,marginTop:13,gap:16,fontSize:12}}>
                <span>●　Document uploaded</span><span style={{color:ORANGE,fontWeight:800}}>●　Analyzing content</span><span style={{color:'#999'}}>○　Preparing structured summary</span>
              </div>
              <div style={{display:'flex',marginTop:'auto',border:'1px solid #ddd',padding:'10px 11px',fontSize:11,color:'#999',justifyContent:'space-between'}}>Ask Papyrus to work on your files... <span style={{color:INK}}>↑</span></div>
            </div>
          </div>
          <div style={{display:'flex',height:46,alignItems:'center',justifyContent:'center',background:ORANGE,borderTop:'3px solid #111',fontWeight:900,fontSize:14}}>▷　WATCH THE ACTUAL PRODUCT DEMO</div>
        </div>
      </div>
    </div>,
    {...OG_SIZE, ...(displayFontData ? {fonts:[{name:'Roboto Condensed',data:displayFontData,weight:900 as const,style:'normal' as const}]} : {}), headers:{'Cache-Control':'public, max-age=3600'}}
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
