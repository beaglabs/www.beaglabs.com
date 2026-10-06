import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

export const runtime = 'nodejs'

export async function GET() {
  const [uswds, login, oidc] = await Promise.all(['uswds.png', 'login-gov.png', 'openid.png'].map(async name =>
    `data:image/png;base64,${(await readFile(path.join(process.cwd(), 'public/products/papyrus', name))).toString('base64')}`,
  ))
  const [regular, bold, display, mono] = await Promise.all(['WorkSans-400.ttf', 'WorkSans-700.ttf', 'RobotoCondensed-900.ttf', 'JetBrainsMono-700.ttf'].map(name => readFile(path.join(process.cwd(), 'public/fonts', name))))
  return new ImageResponse(
    <div style={{ display: 'flex', flexDirection: 'column', width: 1200, height: 630, background: '#fafaf9', color: '#111', padding: '30px 42px', fontFamily: 'Work Sans' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', background: '#ff5f1f', border: '2px solid #111', padding: '8px 14px', fontFamily: 'JetBrains Mono', fontSize: 14, fontWeight: 700, letterSpacing: 1 }}>CUSTOMER-HOSTED / GOVERNED EXECUTION</div>
        <div style={{ display: 'flex', fontSize: 19, fontWeight: 800 }}>PAPYRUS / BEAG LABS</div>
      </div>
      <div style={{ display: 'flex', marginTop: 18, fontFamily: 'Roboto Condensed', fontSize: 56, fontWeight: 900, lineHeight: 1.05, letterSpacing: -2 }}>The Agentic</div>
      <div style={{ display: 'flex', fontFamily: 'Roboto Condensed', fontSize: 56, fontWeight: 900, lineHeight: 1.05, letterSpacing: -2 }}>Modernization Factory</div>
      <div style={{ display: 'flex', marginTop: 14, fontSize: 19, color: '#555' }}>Document automation. Internal apps. Legacy system enablement.</div>
      <div style={{ display: 'flex', gap: 18, alignItems: 'center', marginTop: 14, height: 40 }}>
        <img src={uswds} width={34} height={34} /><span style={{ fontWeight: 700, fontSize: 18 }}>USWDS</span><span>+</span>
        <div style={{ display: 'flex', width: 130, height: 36, overflow: 'hidden', position: 'relative' }}><img src={login} width={130} height={130} style={{ position: 'absolute', top: -47 }} /></div><span>+</span>
        <img src={oidc} width={34} height={34} /><span style={{ fontSize: 18, fontWeight: 700 }}>OIDC</span>
      </div>
      <div style={{ display: 'flex', gap: 22, marginTop: 20, height: 258 }}>
        <div style={{ display: 'flex', flexDirection: 'column', width: 525, background: '#101b15', color: '#8df6b1', border: '3px solid #111', boxShadow: '5px 5px 0 #111', padding: '14px 18px', fontFamily: 'JetBrains Mono' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #467654', paddingBottom: 10, fontSize: 13 }}><span>TN3270 / CASEINTK</span><span>MOCK HOST</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, fontSize: 14 }}><span>PUBLIC SERVICES</span><span>SCREEN 01</span></div>
          <div style={{ display: 'flex', marginTop: 16, fontSize: 14 }}>TRANSACTION: NEW SERVICE REQUEST</div>
          <div style={{ display: 'flex', marginTop: 14, fontSize: 14 }}>APPLICANT:    __________________</div>
          <div style={{ display: 'flex', marginTop: 10, fontSize: 14 }}>SERVICE TYPE: __________________</div>
          <div style={{ display: 'flex', marginTop: 12, fontSize: 14 }}>REFERENCE: PENDING</div>
          <div style={{ display: 'flex', marginTop: 12, fontSize: 12 }}>READY. AWAITING AUTHENTICATED INPUT.</div>
          <div style={{ display: 'flex', marginTop: 12, fontSize: 11, opacity: .7 }}>PF1 HELP · PF3 EXIT · ENTER SAVE</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', color: '#ff5f1f', fontSize: 34 }}>→</div>
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, background: 'white', border: '3px solid #111', boxShadow: '5px 5px 0 #111', padding: '16px 22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, fontWeight: 700 }}><span>FACTORY APP / SERVICE INTAKE</span><img src={uswds} width={27} height={27} /></div>
          <div style={{ display: 'flex', marginTop: 15, fontSize: 28, fontWeight: 800 }}>A modern front door.</div>
          <div style={{ display: 'flex', marginTop: 12, fontSize: 17, lineHeight: 1.4, color: '#555' }}>Sign in before creating a service request.</div>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 18, border: '2px solid #111', padding: '13px 18px', background: '#ff5f1f', boxShadow: '3px 3px 0 #111', fontSize: 17, fontWeight: 700 }}>Try Login.gov sign-in →</div>
          <div style={{ display: 'flex', marginTop: 17, fontSize: 12, color: '#666' }}>Interactive mock · simulated Login.gov / OIDC</div>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 22, fontSize: 13, fontWeight: 700 }}><span>01 / IDENTITY OPENS THE APP</span><span>02 / THE FORM CAPTURES A REQUEST</span><span>03 / THE LEGACY RECORD UPDATES</span></div>
    </div>,
    { width: 1200, height: 630, fonts: [{ name: 'Work Sans', data: regular, weight: 400, style: 'normal' }, { name: 'Work Sans', data: bold, weight: 700, style: 'normal' }, { name: 'Roboto Condensed', data: display, weight: 900, style: 'normal' }, { name: 'JetBrains Mono', data: mono, weight: 700, style: 'normal' }], headers: { 'Cache-Control': 'public, max-age=86400' } },
  )
}
