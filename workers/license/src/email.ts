import { Resend } from 'resend'
import type { Bindings } from './env'

function esc(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!)
}

function emailShell(title: string, body: string): string {
  return `<!doctype html><html><body style="margin:0;background:#fafaf9;color:#111;font-family:Arial,Helvetica,sans-serif"><div style="max-width:680px;margin:40px auto;padding:0 20px"><div style="border:3px solid #111;background:#fff;box-shadow:8px 8px 0 #111"><div style="padding:18px 22px;border-bottom:3px solid #111;background:#ff5f1f;font-weight:900;letter-spacing:.06em;text-transform:uppercase">BEAG LABS</div><div style="padding:28px"><h1 style="margin:0 0 18px;font-size:28px;line-height:1.1">${esc(title)}</h1>${body}</div></div><p style="font-size:12px;color:#666;margin:18px 0">Beag Labs · Partner Operations</p></div></body></html>`
}

function button(label: string, href: string, orange = true): string {
  return `<a href="${esc(href)}" style="display:inline-block;margin:8px 10px 8px 0;padding:12px 18px;border:3px solid #111;background:${orange ? '#ff5f1f' : '#fff'};color:#111;text-decoration:none;font-weight:900;box-shadow:4px 4px 0 #111">${esc(label)}</a>`
}

async function send(env: Bindings, to: string | string[], subject: string, html: string) {
  const resend = new Resend(env.RESEND_API_KEY)
  const result = await resend.emails.send({
    from: env.PARTNER_FROM_EMAIL,
    to,
    subject,
    html,
  })
  if (result.error) throw new Error(`Resend: ${result.error.message}`)
  return result.data
}

export async function sendApplicationReviewEmail(env: Bindings, input: {
  companyName: string
  companyDomain: string
  annualRevenueUsd: number
  uei: string
  cage: string
  pocName: string
  pocEmail: string
  skus: string[]
  token: string
}) {
  const base = `${env.BASE_URL}/partner-application/review?token=${encodeURIComponent(input.token)}`
  const rows = [
    ['Company', input.companyName],
    ['Domain', input.companyDomain],
    ['Annual revenue', new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(input.annualRevenueUsd)],
    ['UEI', input.uei],
    ['CAGE', input.cage],
    ['Main POC', `${input.pocName} <${input.pocEmail}>`],
    ['SKUs', input.skus.join(', ')],
  ].map(([k, v]) => `<tr><td style="padding:7px 12px 7px 0;font-weight:800;vertical-align:top">${esc(k)}</td><td style="padding:7px 0">${esc(v)}</td></tr>`).join('')

  return send(env, env.PARTNERS_EMAIL, `Partner application: ${input.companyName}`, emailShell('New partner application', `
    <p>A company has requested access to the Beag Labs Partner Portal. Review the application before creating any partner identity or ordering access.</p>
    <table style="border-collapse:collapse;width:100%;margin:18px 0">${rows}</table>
    <div>${button('YES — Review & Approve', `${base}&decision=approve`)}${button('NO — Review & Reject', `${base}&decision=reject`, false)}</div>
    <p style="font-size:12px;color:#666">These links open a confirmation page. Email scanners cannot approve or reject an application by following the link alone.</p>
  `))
}

export async function sendPartnerInviteEmail(env: Bindings, input: { companyName: string; email: string; token: string }) {
  const url = `${env.BASE_URL}/partner/invite?token=${encodeURIComponent(input.token)}`
  return send(env, input.email, `You're invited to the Beag Labs Partner Portal`, emailShell('Partner access approved', `
    <p><strong>${esc(input.companyName)}</strong> has been approved for Beag Labs partner access.</p>
    <p>Use the invitation below to register your Beag Labs identity. Sign-in is passwordless and restricted to approved partner email addresses.</p>
    <div>${button('Register with Beag Labs', url)}</div>
    <p style="font-size:12px;color:#666">This invitation is single-use and expires automatically.</p>
  `))
}

export async function sendMagicLinkEmail(env: Bindings, email: string, url: string) {
  return send(env, email, 'Sign in to Beag Labs Partner Portal', emailShell('Secure sign-in link', `
    <p>Use this single-use link to sign in to the Beag Labs Partner Portal.</p>
    <div>${button('Sign in', url)}</div>
    <p style="font-size:12px;color:#666">If you did not request this link, you can ignore this email.</p>
  `))
}
