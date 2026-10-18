import { describe, expect, it } from 'vitest'
import { signedIn } from './helpers/session'

const css = (html: string) => html.slice(html.indexOf('<style>'), html.indexOf('</style>'))

describe('Console layout', () => {
  it('fixes the sidebar to the viewport and scrolls only the main column', async () => {
    const { h, get } = signedIn()
    h.sql.prepare("UPDATE accounts SET organization = ? WHERE id = 'acct_1'").run('A'.repeat(200))
    const html = await (await get('/billing')).text()
    expect(html).toMatch(/<body class="console-body"><div class="console">\s*<aside class="side"[^>]*>[\s\S]*<\/aside>\s*<main class="page grid-bg">/)
    const styles = css(html)
    expect(styles).toContain('body.console-body{height:100%;overflow:hidden}')
    expect(styles).toMatch(/\.console\{display:grid;grid-template-columns:232px minmax\(0,1fr\);height:100vh;height:100dvh;overflow:hidden\}/)
    expect(styles).toMatch(/\.side\{[^}]*height:100%;[^}]*overflow:hidden\}/)
    expect(styles).toMatch(/main\.page\{height:100%;[^}]*overflow-y:auto;overflow-x:hidden/)
    // Long nav/account text gets an ellipsis instead of growing the sidebar.
    expect(styles).toContain('.side .brand span,.side nav a,.side .acct .who,.side .acct .email{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}')
    expect(html).toContain(`<span class="who" title="${'A'.repeat(200)}">`)
    expect(html).toContain('<span class="email" title="owner@example.com">owner@example.com</span>')
    // No sticky/scrolling sidebar left over.
    expect(styles).not.toMatch(/\.side\{[^}]*position:sticky/)
  })

  it('wraps long Activity messages and clamps them to two lines with More', async () => {
    const { h, get } = signedIn()
    h.insertDeployment({ id: 'dep_1', billing_state: 'active' })
    h.sql.prepare("UPDATE deployments SET provider = 'hosted', hostname = 'acme.papyrus.beaglabs.com' WHERE id = 'dep_1'").run()
    const long = `Azure: ${'InvalidTemplateDeployment/'.repeat(30)}`
    h.sql.prepare("INSERT INTO events (account_id, deployment_id, at, level, source, message) VALUES ('acct_1', 'dep_1', '2026-10-17T14:00:00.000Z', 'error', 'deploy', ?)").run(long)
    const html = await (await get('/deploy/dep_1')).text()
    expect(html).toContain(`<td class="msg"><span class="txt">${long}</span><button type="button" class="xp" data-expand aria-expanded="false" hidden>More</button></td>`)
    const styles = css(html)
    expect(styles).toContain('.log td.msg{overflow-wrap:anywhere;word-break:normal;min-width:0}')
    expect(styles).toContain('-webkit-line-clamp:2')
    expect(styles).toContain('.log .scroll{max-height:440px;overflow-y:auto;overflow-x:hidden}')
    expect(styles).toContain('.cols{display:grid;grid-template-columns:minmax(0,1fr) 330px')
  })
})
