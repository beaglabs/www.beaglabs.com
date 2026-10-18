import * as Effect from 'effect/Effect'
import * as Exit from 'effect/Exit'
import * as Cause from 'effect/Cause'
import * as FetchHttpClient from 'effect/http/FetchHttpClient'
import type * as HttpClient from 'effect/http/HttpClient'
import { Hono, type Context as HonoContext } from 'hono'
import { getCookie } from 'hono/cookie'
import * as Auth from './auth'
import { accountTrial, backfillTrialEnds, completeCheckoutForAccount, handleWebhook, portalUrl, pruneCheckoutIntents, startCheckout } from './billing'
import { SUPPORT_JS, SUPPORT_SCRIPT_PATH } from './support'
import { encryptJson, randomToken, timingSafeEqual } from './crypto'
import { EVENT_FILTERS, eventJson, isEventFilter, listEvents, logEvent } from './events'
import { HOSTED_PROVIDER, byocEnabled, claimOrgName, hostedHostname, hostedProviderContext, loadHostedInfra, orgNameAvailability, saveHostedInfra } from './hosted'
import { bootstrapHosted } from './providers/aws-hosted'
import type { Bindings } from './env'
import { LOGO_128_BASE64, LOGO_64_BASE64, LOGO_PATHS } from './logo'
import { connectTemplate } from './providers/aws'
import { credentialsFromForm, missingFields, providerById } from './providers/registry'
import { checkCredentials, isHostname, license, loadCredentials, runStep } from './runner'
import { Env, UserError, getOwnedDeployment, listDeployments, nowIso, run, saveProgress, type Account, type Deployment } from './services'
import { isStepId, record, resetFrom } from './setup'
import { deploymentStatus } from './status'
import { meterComputeHour, monthUsage, reportUsage } from './metering'
import { deleteDeployment, resumeTeardowns, runTeardown, startDeployment, stopDeployment } from './lifecycle'
import { LIVE_PATH } from './activity-hub'
import * as Views from './views'
import { autoAdvance, dueCheck } from './advance'
import { acceptTerms, bindingInfo, createPortalTransaction, microsoftCallback, pruneTransactions, redeemHandle, startConsent, startPortal, termsFor } from './microsoft'
import { availableActions, buildDeploymentView, buildSummary, currentStep, type ViewContext } from './deployment-view'
import { browserCapture, captureAndStore, loadCapture, previewObject, requestCapture, screenshotsEnabled, type CaptureFn } from './preview'
import type { ActionId, ActionResult, DetailPayload, ListPayload } from './ui/types'

export interface AppDeps {
  /** Override fetch for every outbound call (tests). */
  fetch?: typeof fetch
  /** Override the preview screenshot (tests); production uses Browser Rendering. */
  capture?: CaptureFn
}

type Ctx = HonoContext<{ Bindings: Bindings }>
type Program<A> = Effect.Effect<A, unknown, Env | HttpClient.HttpClient>

const fromBase64 = (b64: string) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
const LOGOS_PNG: Record<string, Uint8Array<ArrayBuffer>> = { [LOGO_PATHS.small]: fromBase64(LOGO_64_BASE64), [LOGO_PATHS.large]: fromBase64(LOGO_128_BASE64) }

/**
 * Scripts and images only from this site (the support photo is a static asset here); live Activity opens a WebSocket
 * to this site (wss: spelled out for browsers whose 'self' omits it).
 */
export const contentSecurityPolicy = (env: Pick<Bindings, 'BASE_URL'>) => {
  const base = new URL(env.BASE_URL)
  const socket = `${base.protocol === 'http:' ? 'ws:' : 'wss:'}//${base.host}`
  return [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data:",
    `connect-src 'self' ${socket}`,
    "base-uri 'none'",
    "frame-ancestors 'none'",
  ].join('; ')
}

/** Run an Effect program with these bindings and an HTTP client (requests, the cron). */
export const runProgram = <A>(env: Bindings, program: Program<A>, deps: AppDeps = {}) => {
  const withFetch = deps.fetch ? program.pipe(Effect.provideService(FetchHttpClient.Fetch, deps.fetch)) : program
  return Effect.runPromiseExit(withFetch.pipe(Effect.provide(FetchHttpClient.layer), Effect.provideService(Env, env)) as Effect.Effect<A, unknown, never>)
}

/** The hourly cron: compute meter events for the hour that just ended (src/metering.ts), then waiting teardowns. */
export const scheduled = async (env: Bindings, now = Date.now(), deps: AppDeps = {}) => {
  await runProgram(env, pruneCheckoutIntents(), deps)
  const exit = await runProgram(env, meterComputeHour(now), deps)
  if (Exit.isFailure(exit)) console.error('compute metering failed', (Cause.squash(exit.cause) as { _tag?: string })?._tag ?? 'defect')
  const teardowns = await runProgram(env, resumeTeardowns(), deps)
  if (Exit.isFailure(teardowns)) console.error('resuming teardowns failed', (Cause.squash(teardowns.cause) as { _tag?: string })?._tag ?? 'defect')
  await runProgram(env, pruneTransactions(), deps)
  return Exit.isSuccess(exit) ? exit.value : null
}

export function createApp(deps: AppDeps = {}) {
  const app = new Hono<{ Bindings: Bindings }>()

  /** Run an Effect program with this request's bindings and an HTTP client. */
  const exec = <A>(c: Ctx, program: Program<A>) => runProgram(c.env, program, deps)

  const userError = (exit: Exit.Exit<unknown, unknown>) => {
    if (Exit.isSuccess(exit)) return null
    const error = Cause.squash(exit.cause) as { _tag?: string; message?: string; status?: number }
    if (error?._tag === 'UserError') return { message: error.message ?? 'Request failed', status: error.status ?? 400 }
    // Never log request bodies or credentials: the tag is enough to find the failing call.
    console.error('control-plane error', error?._tag ?? 'defect')
    return { message: 'Something went wrong on our side. Try again.', status: 500 }
  }

  /** Run a page program; render failures as an HTML error page. */
  const page = async (c: Ctx, program: Program<Response>, account?: Account | null) => {
    const exit = await exec(c, program)
    if (Exit.isSuccess(exit)) return exit.value
    const failure = userError(exit)!
    return c.html(Views.errorPage(failure.message, account), failure.status as 400)
  }

  const currentAccount = (c: Ctx) => Auth.sessionAccount(getCookie(c, Auth.SESSION_COOKIE))

  /** Pages behind sign-in. */
  const signedIn = (c: Ctx, body: (account: Account) => Program<Response>) =>
    page(
      c,
      Effect.gen(function* () {
        const account = yield* currentAccount(c)
        if (!account) return c.redirect(`/login`, 303)
        // The trial banner: trial ends come from webhooks; backfill from Stripe once if one is missing.
        const deployments = yield* listDeployments(account.id)
        yield* backfillTrialEnds(deployments).pipe(Effect.ignore)
        account.trial = accountTrial(deployments)
        account.hostnames = deployments.flatMap((d) => (d.hostname ? [d.hostname] : []))
        return yield* body(account)
      }),
    )

  // Form posts must come from this site (SameSite=Lax cookies already block cross-site posts; this is belt and braces).
  app.use('*', async (c, next) => {
    // A 101 WebSocket response has immutable headers; the upgrade route checks its own origin.
    if (c.req.path === LIVE_PATH) return next()
    if (c.req.method === 'POST' && !c.req.path.startsWith('/api/')) {
      const origin = c.req.header('origin')
      if (origin && origin !== new URL(c.env.BASE_URL).origin) return c.text('Forbidden', 403)
    }
    await next()
    c.header('content-security-policy', contentSecurityPolicy(c.env))
    c.header('x-frame-options', 'DENY')
    c.header('referrer-policy', 'same-origin')
    c.header('x-content-type-options', 'nosniff')
  })

  app.get('/health', (c) => c.json({ ok: true }))

  app.get('/', (c) => page(c, Effect.map(currentAccount(c), (account) => c.redirect(account ? '/deploy' : '/signup', 303))))

  // Sign-up and sign-in -------------------------------------------------------------------------------------------

  app.get('/signup', (c) => c.html(Views.signupPage(null, c.req.query('email')?.trim().slice(0, 254))))
  app.post('/signup', async (c) => {
    const form = await c.req.parseBody()
    const email = String(form.email ?? '')
    const exit = await exec(c, Auth.sendMagicLink(email, { name: String(form.name ?? ''), organization: String(form.organization ?? '') }))
    const failure = userError(exit)
    return failure ? c.html(Views.signupPage(failure.message, email), failure.status as 400) : c.html(Views.checkEmailPage(Auth.normalizeEmail(email)))
  })

  app.get('/login', (c) => c.html(Views.loginPage()))
  app.post('/login', async (c) => {
    const email = String((await c.req.parseBody()).email ?? '')
    const failure = userError(await exec(c, Auth.sendMagicLink(email)))
    return failure ? c.html(Views.loginPage(failure.message), failure.status as 400) : c.html(Views.checkEmailPage(Auth.normalizeEmail(email)))
  })

  app.get('/login/email', async (c) => {
    const exit = await exec(
      c,
      Effect.gen(function* () {
        const account = yield* Auth.redeemMagicLink(c.req.query('token') ?? '')
        yield* logEvent({ accountId: account.id, level: 'info', source: 'account', message: `${account.email} signed in with an email link` })
        return yield* Auth.createSession(account.id)
      }),
    )
    if (Exit.isFailure(exit)) return c.html(Views.loginPage(userError(exit)!.message), 400)
    c.header('set-cookie', exit.value.cookie)
    return c.redirect('/deploy', 303)
  })

  for (const provider of ['microsoft', 'google'] as const) {
    app.get(`/login/${provider}`, async (c) => {
      const exit = await exec(c, Auth.startOidc(provider))
      if (Exit.isFailure(exit)) return c.html(Views.loginPage(userError(exit)!.message), 500)
      c.header('set-cookie', exit.value.cookie)
      return c.redirect(exit.value.url, 302)
    })
    app.get(`/login/${provider}/callback`, async (c) => {
      const exit = await exec(
        c,
        Effect.gen(function* () {
          const result = yield* Auth.finishOidc(provider, { code: c.req.query('code'), state: c.req.query('state'), error: c.req.query('error') }, getCookie(c, Auth.STATE_COOKIE))
          const session = yield* Auth.createSession(result.account.id)
          yield* logEvent({ accountId: result.account.id, level: 'info', source: 'account', message: `${result.account.email} signed in with ${provider === 'microsoft' ? 'Microsoft' : 'Google'}` })
          return { ...result, session }
        }),
      )
      if (Exit.isFailure(exit)) return c.html(Views.loginPage(userError(exit)!.message), 400)
      c.header('set-cookie', exit.value.session.cookie, { append: true })
      c.header('set-cookie', `${Auth.STATE_COOKIE}=; Path=/login; HttpOnly; Secure; SameSite=Lax; Max-Age=0`, { append: true })
      return c.redirect(exit.value.returnTo, 303)
    })
  }

  app.get('/logout', async (c) => {
    const exit = await exec(c, Auth.endSession(getCookie(c, Auth.SESSION_COOKIE)))
    if (Exit.isSuccess(exit)) c.header('set-cookie', exit.value)
    return c.redirect('/login', 303)
  })

  // Billing -------------------------------------------------------------------------------------------------------

  app.get('/billing', (c) =>
    signedIn(c, (account) =>
      Effect.gen(function* () {
        const deployments = yield* listDeployments(account.id)
        const usage = yield* monthUsage(account.id)
        return c.html(Views.billingPage(account, deployments, c.req.query('error'), usage))
      }),
    ),
  )

  app.post('/billing/checkout', async (c) => {
    const form = await c.req.parseBody()
    return signedIn(c, (account) =>
      Effect.gen(function* () {
        let deployment: Deployment | undefined
        if (form.deployment) {
          deployment = yield* getOwnedDeployment(account.id, String(form.deployment))
          if (deployment.lifecycle === 'deleting' || deployment.lifecycle === 'deleted') return yield* new UserError({ message: 'This deployment was deleted.', status: 409 })
          if (deployment.billing_state === 'active') return c.redirect(yield* portalUrl(deployment), 303)
        }
        return c.redirect(yield* startCheckout(account, deployment), 303)
      }),
    )
  })

  app.get('/billing/complete', (c) => signedIn(c, (account) => Effect.gen(function* () {
    const result = yield* completeCheckoutForAccount(account, c.req.query('session_id') ?? '').pipe(Effect.result)
    if (result._tag === 'Failure') {
      const failure = result.failure as { message?: string }
      return c.redirect(`/billing?error=${encodeURIComponent(failure.message ?? 'Billing setup is still processing. Please try again shortly.')}`, 303)
    }
    return c.redirect(`/deploy/${encodeURIComponent(result.success)}`, 303)
  })))

  app.post('/billing/portal', async (c) => {
    const form = await c.req.parseBody()
    return signedIn(c, (account) =>
      Effect.gen(function* () {
        const deployment = yield* getOwnedDeployment(account.id, String(form.deployment ?? ''))
        return c.redirect(yield* portalUrl(deployment), 303)
      }),
    )
  })

  app.post('/api/stripe/webhook', async (c) => {
    const raw = await c.req.text()
    const exit = await exec(c, handleWebhook(raw, c.req.header('stripe-signature') ?? null))
    if (Exit.isSuccess(exit)) return c.json(exit.value)
    const failure = userError(exit)!
    return c.json({ error: failure.message }, failure.status as 400)
  })

  /** Bring-your-own-cloud routes answer 404 unless BYOC is on for this account (or for everyone). */
  const requireByoc = (account: Account | null) =>
    Effect.flatMap(byocEnabled(account), (enabled) => (enabled ? Effect.void : Effect.fail(new UserError({ message: 'Not found', status: 404 }))))

  // Provision -----------------------------------------------------------------------------------------------------

  /** Which secret fields already have a saved value (never the values themselves). */
  const savedFlags = (deployment: Deployment, providerId: string) =>
    deployment.provider === providerId && deployment.credentials_ciphertext
      ? loadCredentials(deployment).pipe(
          Effect.map((creds) => Object.fromEntries(Object.keys(creds).map((key) => [key, true])) as Record<string, boolean>),
          Effect.orElseSucceed(() => ({}) as Record<string, boolean>),
        )
      : Effect.succeed({} as Record<string, boolean>)

  const ensureExternalId = (deployment: Deployment) =>
    Effect.gen(function* () {
      if (deployment.aws_external_id) return
      deployment.aws_external_id = `beag-${randomToken(18)}`
      yield* run('UPDATE deployments SET aws_external_id = ? WHERE id = ? AND aws_external_id IS NULL', deployment.aws_external_id, deployment.id)
    })

  const renderProvision = (c: Ctx, account: Account, deployment: Deployment, providerId: string | undefined, message?: { text: string; kind: 'error' | 'ok' } | null) =>
    Effect.gen(function* () {
      const provider = providerById(providerId ?? deployment.provider)
      if (provider?.connect === 'aws-role') yield* ensureExternalId(deployment)
      const saved = provider ? yield* savedFlags(deployment, provider.id) : {}
      return c.html(
        Views.provisionPage({ account, deployment, provider, saved, awsTemplateUrl: c.env.AWS_CONNECT_TEMPLATE_URL, awsPrincipalArn: c.env.AWS_PRINCIPAL_ARN, message }),
        message?.kind === 'error' ? 400 : 200,
      )
    })

  app.get('/provision', (c) =>
    signedIn(c, (account) =>
      Effect.gen(function* () {
        yield* requireByoc(account)
        const requested = c.req.query('deployment')
        const deployments = yield* listDeployments(account.id)
        const deployment = requested ? yield* getOwnedDeployment(account.id, requested) : deployments.find((d) => d.steps.connect.status !== 'pass') ?? deployments[0]
        if (!deployment) return c.redirect('/billing', 303)
        if (deployment.provider === HOSTED_PROVIDER) return c.redirect(`/deploy/${deployment.id}`, 303)
        return yield* renderProvision(c, account, deployment, c.req.query('provider'))
      }),
    ),
  )

  app.post('/provision', async (c) => {
    const form = Object.fromEntries(Object.entries(await c.req.parseBody()).map(([key, value]) => [key, typeof value === 'string' ? value : ''])) as Record<string, string>
    return signedIn(c, (account) =>
      Effect.gen(function* () {
        yield* requireByoc(account)
        const deployment = yield* getOwnedDeployment(account.id, form.deployment ?? '')
        if (deployment.provider === HOSTED_PROVIDER) return yield* new UserError({ message: 'This deployment is hosted by Beag Labs.', status: 409 })
        const provider = providerById(form.provider)
        if (!provider) return yield* renderProvision(c, account, deployment, undefined, { text: 'Choose a provider', kind: 'error' })
        if (deployment.license_deployment_id && deployment.provider && deployment.provider !== provider.id) {
          return yield* renderProvision(c, account, deployment, provider.id, { text: 'This deployment is already deployed. Start a new deployment to use a different provider.', kind: 'error' })
        }
        const previous = deployment.provider === provider.id ? yield* loadCredentials(deployment).pipe(Effect.orElseSucceed(() => ({}))) : {}
        const credentials = credentialsFromForm(provider, form, previous)
        const missing = missingFields(provider, credentials)
        if (missing.length) return yield* renderProvision(c, account, deployment, provider.id, { text: `Missing: ${missing.join(', ')}`, kind: 'error' })

        const sealed = yield* encryptJson(c.env.CREDENTIALS_KEY, account.id, credentials)
        yield* run('UPDATE deployments SET provider = ?, credentials_ciphertext = ?, updated_at = ? WHERE id = ?', provider.id, sealed, nowIso(), deployment.id)
        deployment.provider = provider.id
        deployment.credentials_ciphertext = sealed

        // Read-only check on save; the result becomes the setup page's "connect" step.
        const check = yield* checkCredentials(deployment, credentials).pipe(Effect.result)
        deployment.steps = record(resetFrom(deployment.steps, 'connect'), 'connect', check._tag === 'Success' ? { status: 'pass', reason: check.success } : { status: 'fail', reason: check.failure.message })
        yield* saveProgress(deployment)
        // Only the provider's summary or error: never the credentials themselves.
        yield* logEvent({
          accountId: account.id,
          deploymentId: deployment.id,
          source: 'connect',
          ...(check._tag === 'Success' ? { level: 'ok' as const, message: `${provider.name} credentials checked: ${check.success}` } : { level: 'error' as const, message: `${provider.name} credential check failed: ${check.failure.message}` }),
        })
        return yield* renderProvision(
          c,
          account,
          deployment,
          provider.id,
          check._tag === 'Success' ? { text: `Connected: ${check.success}`, kind: 'ok' } : { text: `Credential check failed: ${check.failure.message}`, kind: 'error' },
        )
      }),
    )
  })

  app.get('/aws/connect-template.yaml', (c) =>
    page(
      c,
      Effect.gen(function* () {
        yield* requireByoc(yield* currentAccount(c))
        return c.body(connectTemplate(), 200, { 'content-type': 'text/yaml; charset=utf-8' })
      }),
    ),
  )

  // Deploy and setup ----------------------------------------------------------------------------------------------

  /** Everything the deployment view model needs besides the row itself. */
  const viewContext = (c: Ctx, account: Account, deployment: Deployment, siblings: Deployment[]) =>
    Effect.gen(function* () {
      const usage = (yield* monthUsage(account.id))[deployment.id]
      const capture = yield* loadCapture(deployment.id)
      return {
        account,
        termsAccepted: Boolean(yield* termsFor(deployment.id)),
        region: c.env.HOSTED_AWS_REGION || 'us-east-2',
        now: Date.now(),
        screenshots: screenshotsEnabled(c.env),
        capture,
        ...(usage ? { usage } : {}),
        siblings: siblings.filter((d) => d.id !== deployment.id),
      } satisfies ViewContext
    })

  const detailView = (c: Ctx, account: Account, deployment: Deployment) =>
    Effect.gen(function* () {
      const siblings = yield* listDeployments(account.id)
      return buildDeploymentView(deployment, yield* viewContext(c, account, deployment, siblings))
    })

  const listPayload = (c: Ctx, deployments: Deployment[]): ListPayload => ({
    deployments: deployments.map((d) => buildSummary(d, { region: c.env.HOSTED_AWS_REGION || 'us-east-2', now: Date.now() })),
    serverTime: nowIso(),
  })

  /** The org-name claim screen until the deployment has an address; then the Deployment page. */
  const renderDeployment = (c: Ctx, account: Account, deployment: Deployment, message?: string | null, status = 200) =>
    Effect.gen(function* () {
      const byoc = yield* byocEnabled(account)
      if (!deployment.provider && deployment.lifecycle === 'running') return c.html(Views.claimPage(account, deployment, message, byoc), status as 200)
      const events = yield* listEvents(account.id, { deploymentId: deployment.id })
      const view = yield* detailView(c, account, deployment)
      const before = byoc && deployment.provider && deployment.provider !== HOSTED_PROVIDER && !deployment.license_deployment_id && deployment.lifecycle === 'running' ? Views.hostnameCard(deployment) : ''
      return c.html(Views.deploymentPage({ account, view, events, serverTime: nowIso(), message, before }), status as 200)
    })

  app.get('/deploy', (c) =>
    signedIn(c, (account) =>
      Effect.gen(function* () {
        const deployments = yield* listDeployments(account.id)
        // One deployment (the usual case) is the page itself; several get the table.
        if (deployments.length === 1) return yield* renderDeployment(c, account, deployments[0]!, c.req.query('error'))
        return c.html(Views.deployListPage(account, listPayload(c, deployments)))
      }),
    ),
  )

  app.get('/deploy/:id', (c) =>
    signedIn(c, (account) =>
      Effect.gen(function* () {
        const deployment = yield* getOwnedDeployment(account.id, c.req.param('id'))
        return yield* renderDeployment(c, account, deployment, c.req.query('error'))
      }),
    ),
  )

  app.get(Views.ORG_NAME_SCRIPT_PATH, (c) => c.body(Views.ORG_NAME_JS, 200, { 'content-type': 'text/javascript; charset=utf-8', 'cache-control': 'public, max-age=300' }))

  /** Live check for the org-name form: syntax, reserved names, uniqueness. */
  app.get('/api/org-names/check', async (c) => {
    const exit = await exec(
      c,
      Effect.gen(function* () {
        const account = yield* currentAccount(c)
        return account ? yield* orgNameAvailability(c.req.query('name') ?? '') : null
      }),
    )
    if (Exit.isSuccess(exit)) return exit.value ? c.json(exit.value, 200, { 'cache-control': 'no-store' }) : c.json({ error: 'Sign in first' }, 401)
    const failure = userError(exit)!
    return c.json({ error: failure.message }, failure.status as 500)
  })

  /** Who accepted the terms from this request: the address and browser, for the record. */
  const acceptanceContext = (c: Ctx) => ({ ip: c.req.header('cf-connecting-ip') ?? null, userAgent: c.req.header('user-agent') ?? null })

  /**
   * Hosted (the default): accept the terms, claim <org>.papyrus.beaglabs.com, deploy straight away when billing is
   * active, then Connect Microsoft.
   */
  app.post('/deploy/:id/org', async (c) => {
    const form = await c.req.parseBody()
    const org = String(form.org ?? '')
    return signedIn(c, (account) =>
      Effect.gen(function* () {
        const deployment = yield* getOwnedDeployment(account.id, c.req.param('id'))
        if (deployment.provider || deployment.license_deployment_id) return yield* renderDeployment(c, account, deployment, 'This deployment already has its address.', 409)
        if (form.terms !== 'accept') return yield* renderDeployment(c, account, deployment, 'Accept the Terms of Service and Privacy Policy to continue.', 400)
        const claimed = yield* claimOrgName(account.id, deployment.id, org).pipe(Effect.result)
        if (claimed._tag === 'Failure') return yield* renderDeployment(c, account, deployment, claimed.failure.message, claimed.failure.status ?? 400)
        yield* acceptTerms(deployment, account, acceptanceContext(c))
        const hostname = hostedHostname(claimed.success)
        yield* logEvent({ accountId: account.id, deploymentId: deployment.id, level: 'ok', source: 'address', message: `Claimed "${claimed.success}" · ${hostname}` })
        yield* run('UPDATE deployments SET provider = ?, hostname = ?, updated_at = ? WHERE id = ?', HOSTED_PROVIDER, hostname, nowIso(), deployment.id)
        deployment.provider = HOSTED_PROVIDER
        deployment.hostname = hostname
        deployment.steps = record(resetFrom(deployment.steps, 'connect'), 'connect', { status: 'pass', reason: 'Hosted by Beag Labs.' })
        yield* saveProgress(deployment)
        if (deployment.billing_state === 'active') yield* runStep(deployment, account, 'deploy')
        // Registered with the license Worker by the deploy: straight on to Microsoft.
        return c.redirect(deployment.license_deployment_id ? `/deploy/${deployment.id}/microsoft/connect` : `/deploy/${deployment.id}`, 303)
      }),
    )
  })

  // Connect Microsoft (src/microsoft.ts) ----------------------------------------------------------------------------

  /** Off to Microsoft: an administrator approves Papyrus for the organization, then signs in as System Owner. */
  app.get('/deploy/:id/microsoft/connect', (c) =>
    signedIn(c, (account) =>
      Effect.gen(function* () {
        const deployment = yield* getOwnedDeployment(account.id, c.req.param('id'))
        const started = yield* startConsent(deployment, account).pipe(Effect.result)
        if (started._tag === 'Failure') {
          const failure = started.failure as { _tag?: string; message?: string; status?: number }
          if (failure?._tag !== 'UserError') return yield* Effect.fail(started.failure)
          return yield* renderDeployment(c, account, deployment, failure.message, failure.status ?? 400)
        }
        return c.redirect(started.success, 302)
      }),
    ),
  )

  /** The Connect Microsoft dialog on the deployment page: accept the terms, then connect. */
  app.post('/deploy/:id/microsoft/connect', async (c) => {
    const form = await c.req.parseBody()
    return signedIn(c, (account) =>
      Effect.gen(function* () {
        const deployment = yield* getOwnedDeployment(account.id, c.req.param('id'))
        if (form.terms !== 'accept') return yield* renderDeployment(c, account, deployment, 'Accept the Terms of Service and Privacy Policy to connect Microsoft.', 400)
        yield* acceptTerms(deployment, account, acceptanceContext(c))
        return c.redirect(`/deploy/${deployment.id}/microsoft/connect`, 303)
      }),
    )
  })

  /** Microsoft's redirect for both Connect (adminconsent, then sign-in) and sign-in to Papyrus. */
  app.get('/microsoft/callback', (c) =>
    page(
      c,
      Effect.gen(function* () {
        const account = yield* currentAccount(c)
        const query = c.req.query()
        const result = yield* microsoftCallback(
          { state: query.state, code: query.code, error: query.error, error_description: query.error_description, tenant: query.tenant, admin_consent: query.admin_consent },
          account,
        )
        if (result.kind === 'admin') return c.html(Views.adminApprovalPage(result, account), 403)
        return c.redirect(result.url, 302)
      }),
    ),
  )

  app.get('/microsoft/start', (c) => page(c, Effect.map(startPortal(c.req.query('txn')), (url) => c.redirect(url, 302))))

  app.get('/microsoft/consented', (c) => c.html(Views.consentedPage()))

  app.get(Views.COPY_SCRIPT_PATH, (c) => c.body(Views.COPY_JS, 200, { 'content-type': 'text/javascript; charset=utf-8', 'cache-control': 'public, max-age=300' }))
  app.get('/setup/:id', (c) => c.redirect(`/deploy/${encodeURIComponent(c.req.param('id'))}`, 301))

  app.post('/deploy/:id/hostname', async (c) => {
    const hostname = String((await c.req.parseBody()).hostname ?? '').trim().toLowerCase().replace(/\.$/, '')
    return signedIn(c, (account) =>
      Effect.gen(function* () {
        const deployment = yield* getOwnedDeployment(account.id, c.req.param('id'))
        const byoc = yield* byocEnabled(account)
        if (!byoc || !deployment.provider || deployment.provider === HOSTED_PROVIDER) return yield* new UserError({ message: 'Hosted deployments use their organization name as the address.', status: 409 })
        if (deployment.license_deployment_id) return yield* renderDeployment(c, account, deployment, 'The hostname is bound to the license issued at deploy.', 409)
        if (!isHostname(hostname)) return yield* renderDeployment(c, account, deployment, 'Enter a hostname you control, like papyrus.example.com', 400)
        yield* run('UPDATE deployments SET hostname = ?, updated_at = ? WHERE id = ?', hostname, nowIso(), deployment.id)
        deployment.hostname = hostname
        deployment.steps = deployment.steps.connect.status === 'pass' ? resetFrom(deployment.steps, 'deploy') : deployment.steps
        yield* saveProgress(deployment)
        return c.redirect(`/deploy/${deployment.id}`, 303)
      }),
    )
  })

  app.post('/deploy/:id/steps/:step', (c) =>
    signedIn(c, (account) =>
      Effect.gen(function* () {
        const step = c.req.param('step')
        if (!isStepId(step) || step === 'connect') return yield* new UserError({ message: 'Unknown step', status: 404 })
        const deployment = yield* getOwnedDeployment(account.id, c.req.param('id'))
        yield* runStep(deployment, account, step)
        return c.redirect(`/deploy/${deployment.id}#${step}`, 303)
      }),
    ),
  )

  // Stop / Start / Delete ----------------------------------------------------------------------------------------

  /** Run a lifecycle action; a refusal or provider failure is shown on the deployment page. */
  const lifecycleAction = (c: Ctx, action: (deployment: Deployment, account: Account) => Program<unknown>) =>
    signedIn(c, (account) =>
      Effect.gen(function* () {
        const deployment = yield* getOwnedDeployment(account.id, c.req.param('id')!)
        const result = yield* action(deployment, account).pipe(Effect.result)
        if (result._tag === 'Failure') {
          const failure = result.failure as { _tag?: string; message?: string; status?: number }
          if (failure?._tag !== 'UserError') return yield* Effect.fail(result.failure)
          return yield* renderDeployment(c, account, yield* getOwnedDeployment(account.id, deployment.id), failure.message, failure.status ?? 400)
        }
        return c.redirect(`/deploy/${deployment.id}`, 303)
      }),
    )

  app.post('/deploy/:id/stop', (c) => lifecycleAction(c, stopDeployment))
  app.post('/deploy/:id/start', (c) => lifecycleAction(c, startDeployment))
  /** Retry (or check on) a teardown that failed or is waiting. */
  app.post('/deploy/:id/teardown', (c) => lifecycleAction(c, (deployment, account) => runTeardown(deployment, account.id)))

  /** Deployment settings → Delete deployment. The exact org name (hosted) or hostname (BYOC) confirms it. */
  app.post('/deploy/:id/delete', async (c) => {
    const typed = String((await c.req.parseBody()).confirm ?? '')
    return signedIn(c, (account) =>
      Effect.gen(function* () {
        const deployment = yield* getOwnedDeployment(account.id, c.req.param('id'))
        const result = yield* deleteDeployment(deployment, account, typed).pipe(Effect.result)
        if (result._tag === 'Failure') {
          const failure = result.failure as { _tag?: string; message?: string; status?: number }
          if (failure?._tag !== 'UserError') return yield* Effect.fail(result.failure)
          return c.html(Views.deploymentSettingsPage(account, deployment, failure.message ?? 'Delete failed'), (failure.status ?? 400) as 400)
        }
        return c.redirect(`/deploy/${deployment.id}`, 303)
      }),
    )
  })

  // Team, Support, Settings --------------------------------------------------------------------------------------

  app.get('/team', (c) => signedIn(c, (account) => Effect.succeed(c.html(Views.teamPage(account, [account])))))

  app.get('/support', (c) => signedIn(c, (account) => Effect.map(listDeployments(account.id), (deployments) => c.html(Views.supportPage(account, deployments)))))

  app.get(Views.DEPLOYMENT_SETTINGS_SCRIPT_PATH, (c) => c.body(Views.DEPLOYMENT_SETTINGS_JS, 200, { 'content-type': 'text/javascript; charset=utf-8', 'cache-control': 'public, max-age=300' }))

  app.get('/deploy/:id/settings', (c) => signedIn(c, (account) => Effect.map(getOwnedDeployment(account.id, c.req.param('id')), (deployment) => c.html(Views.deploymentSettingsPage(account, deployment, c.req.query('error'))))))

  app.get('/settings', (c) => signedIn(c, (account) => Effect.map(listDeployments(account.id), (deployments) => c.html(Views.settingsPage(account, deployments)))))

  app.post('/settings', async (c) => {
    const form = await c.req.parseBody()
    const field = (name: string) => String(form[name] ?? '').trim().slice(0, 200)
    return signedIn(c, (account) =>
      Effect.gen(function* () {
        const deployments = yield* listDeployments(account.id)
        // The organization is on the license once a deployment registers, so it stays as it is from then on.
        const locked = deployments.some((d) => d.license_deployment_id)
        const name = field('name') || null
        const organization = locked ? account.organization : field('organization') || null
        yield* run('UPDATE accounts SET name = ?, organization = ? WHERE id = ?', name, organization, account.id)
        yield* logEvent({ accountId: account.id, level: 'info', source: 'account', message: 'Account settings updated' })
        return c.html(Views.settingsPage({ ...account, name, organization }, deployments, { text: 'Saved.', kind: 'ok' }))
      }),
    )
  })

  // Activity ------------------------------------------------------------------------------------------------------

  /** The signed-in account's events, newest first. `deployment`, `filter`, `source`, `level` (comma lists), `before`/`after` ids, `limit`. */
  app.get('/api/events', async (c) => {
    const list = (value: string | undefined) => (value ? value.split(',').map((part) => part.trim()).filter(Boolean) : undefined)
    const cursor = (value: string | undefined) => {
      const n = Number(value)
      return Number.isSafeInteger(n) && n > 0 ? n : null
    }
    const exit = await exec(
      c,
      Effect.gen(function* () {
        const account = yield* currentAccount(c)
        if (!account) return null
        const deploymentId = c.req.query('deployment') || null
        if (deploymentId) yield* getOwnedDeployment(account.id, deploymentId)
        const filter = c.req.query('filter')
        const preset: { sources?: readonly string[]; levels?: readonly string[] } = isEventFilter(filter) ? EVENT_FILTERS[filter] : {}
        const result = yield* listEvents(account.id, {
          deploymentId,
          sources: list(c.req.query('source')) ?? preset.sources,
          levels: list(c.req.query('level')) ?? preset.levels,
          before: cursor(c.req.query('before')),
          after: cursor(c.req.query('after')),
          limit: Number(c.req.query('limit')) || 50,
        })
        return { events: result.events.map(eventJson), next: result.next }
      }),
    )
    if (Exit.isSuccess(exit)) return exit.value ? c.json(exit.value, 200, { 'cache-control': 'no-store' }) : c.json({ error: 'Sign in first' }, 401)
    const failure = userError(exit)!
    return c.json({ error: failure.message }, failure.status as 404)
  })

  /**
   * Live Activity: a WebSocket to the account's ActivityHub, which pushes each new event as it is written.
   * Signed-in session cookie, same origin only. The page falls back to polling GET /api/events when it drops.
   */
  app.get(LIVE_PATH, async (c) => {
    if (c.req.header('upgrade')?.toLowerCase() !== 'websocket') return c.json({ error: 'Expected a WebSocket upgrade' }, 426)
    if (c.req.header('origin') !== new URL(c.env.BASE_URL).origin) return c.json({ error: 'Cross-origin request refused' }, 403)
    const exit = await exec(c, currentAccount(c))
    const account = Exit.isSuccess(exit) ? exit.value : null
    if (!account) return c.json({ error: 'Sign in first' }, 401)
    if (!c.env.ACTIVITY) return c.json({ error: 'Live Activity is not available' }, 503)
    const stub = c.env.ACTIVITY.get(c.env.ACTIVITY.idFromName(account.id))
    return stub.fetch('https://activity-hub/connect', { headers: { upgrade: 'websocket', 'x-account-id': account.id } })
  })

  for (const path of Object.keys(LOGOS_PNG)) {
    app.get(path, (c) => c.body(LOGOS_PNG[path]!, 200, { 'content-type': 'image/png', 'cache-control': 'public, max-age=86400' }))
  }

  // Admin: one-time hosted bootstrap ------------------------------------------------------------------------------

  /**
   * Creates (or finds) the shared hosted infrastructure in Beag Labs' AWS account and prints the Cloudflare records
   * to add. Idempotent: rerun it until it says ready. `Authorization: Bearer <ADMIN_TOKEN>`.
   */
  app.post('/admin/hosted/bootstrap', async (c) => {
    const token = (c.req.header('authorization') ?? '').replace(/^Bearer\s+/i, '')
    if (!c.env.ADMIN_TOKEN || !token || !timingSafeEqual(token, c.env.ADMIN_TOKEN)) return c.json({ error: 'Not found' }, 404)
    const exit = await exec(
      c,
      Effect.gen(function* () {
        const infra = yield* loadHostedInfra()
        const result = yield* bootstrapHosted(hostedProviderContext(c.env), infra).pipe(Effect.ensuring(saveHostedInfra(infra).pipe(Effect.ignore)), Effect.result)
        if (result._tag === 'Failure') return { status: 'fail' as const, reason: (result.failure as { message?: string }).message ?? 'failed', cloudflare: [] as string[], infra }
        const cloudflare = result.success.dnsRecords.map((r) => `${r.type} ${r.name} → ${r.value} (DNS only) — ${r.purpose ?? ''}`)
        return { status: result.success.status, reason: result.success.reason, dnsRecords: result.success.dnsRecords, cloudflare, infra }
      }),
    )
    if (Exit.isSuccess(exit)) return c.json(exit.value, exit.value.status === 'fail' ? 502 : 200, { 'cache-control': 'no-store' })
    const failure = userError(exit)!
    return c.json({ error: failure.message }, failure.status as 500)
  })

  // Email support -------------------------------------------------------------------------------------------------

  app.get(SUPPORT_SCRIPT_PATH, (c) => c.body(SUPPORT_JS, 200, { 'content-type': 'text/javascript; charset=utf-8', 'cache-control': 'public, max-age=300' }))

  // Papyrus check-in ----------------------------------------------------------------------------------------------

  app.get('/api/deployments/status', async (c) => {
    const exit = await exec(c, deploymentStatus(c.req.header('authorization'), c.req.header('x-papyrus-deployment-id')))
    if (Exit.isSuccess(exit)) return c.json(exit.value, 200, { 'cache-control': 'no-store' })
    const failure = userError(exit)!
    return c.json({ error: failure.message }, failure.status as 401)
  })

  /** Deployment-key JSON routes: errors as `{ code, error }`. */
  const deploymentApi = async (c: Ctx, program: Program<unknown>) => {
    const exit = await exec(c, program)
    if (Exit.isSuccess(exit)) return c.json(exit.value as object, 200, { 'cache-control': 'no-store' })
    const failure = userError(exit)!
    const code = (Cause.squash((exit as Exit.Failure<unknown, unknown>).cause) as { code?: string })?.code
    return c.json({ ...(code ? { code } : {}), error: failure.message }, failure.status as 400, { 'cache-control': 'no-store' })
  }

  /** Papyrus's sign-in through the broker: `{ state, nonce }` → `{ url }` to send the browser to. */
  app.post('/api/microsoft/transactions', async (c) => {
    const body = await c.req.json().catch(() => null)
    return deploymentApi(c, createPortalTransaction(c.req.header('authorization'), c.req.header('x-papyrus-deployment-id'), body))
  })

  /** One-time handle → the signed identity assertion. */
  app.post('/api/microsoft/redeem', async (c) => {
    const body = await c.req.json().catch(() => null)
    return deploymentApi(c, redeemHandle(c.req.header('authorization'), c.req.header('x-papyrus-deployment-id'), body))
  })

  /** The tenant, app and System Owner, once Connect Microsoft is done (404 not_bound until then). */
  app.get('/api/microsoft/binding', (c) => deploymentApi(c, bindingInfo(c.req.header('authorization'), c.req.header('x-papyrus-deployment-id'))))

  /** Papyrus's agent-execution usage: one report per period (≤ 1 hour), forwarded as a Stripe meter event. */
  app.post('/api/deployments/usage', async (c) => {
    const body = await c.req.json().catch(() => null)
    const exit = await exec(c, reportUsage(c.req.header('authorization'), c.req.header('x-papyrus-deployment-id'), body))
    if (Exit.isSuccess(exit)) return c.json(exit.value, 200, { 'cache-control': 'no-store' })
    const failure = userError(exit)!
    return c.json({ error: failure.message }, failure.status as 400)
  })

  // Deployment view-model API (the deployment pages poll these) ----------------------------------------------------

  /** JSON routes behind sign-in. Mutations must come from this site. */
  const api = (c: Ctx, body: (account: Account) => Program<Response>, options: { mutation?: boolean } = {}) =>
    (async () => {
      if (options.mutation && c.req.header('origin') !== new URL(c.env.BASE_URL).origin) return c.json({ ok: false, message: 'Cross-origin request refused' }, 403)
      const exit = await exec(
        c,
        Effect.gen(function* () {
          const account = yield* currentAccount(c)
          if (!account) return c.json({ ok: false, message: 'Sign in first' }, 401)
          return yield* body(account)
        }),
      )
      if (Exit.isSuccess(exit)) {
        exit.value.headers.set('cache-control', 'no-store')
        return exit.value
      }
      const failure = userError(exit)!
      return c.json({ ok: false, message: failure.message }, failure.status as 400, { 'cache-control': 'no-store' })
    })()

  /** Run work after the response when the runtime allows it (Workers), else inline (tests). */
  const background = (c: Ctx, program: Program<unknown>) => {
    const promise = exec(c, program).then(() => undefined)
    try {
      c.executionCtx.waitUntil(promise)
      return Promise.resolve()
    } catch {
      return promise
    }
  }

  /** The signed-in account's deployments, as table rows. */
  app.get('/api/deployments', (c) => api(c, (account) => Effect.map(listDeployments(account.id), (deployments) => c.json(listPayload(c, deployments)))))

  /**
   * One deployment's view model. While its page is open, the read-only check that is due (address, health, Microsoft,
   * registration, a waiting teardown) runs after the response, so the next poll shows the result.
   */
  app.get('/api/deployments/:id', (c) =>
    api(c, (account) =>
      Effect.gen(function* () {
        const deployment = yield* getOwnedDeployment(account.id, c.req.param('id'))
        const view = yield* detailView(c, account, deployment)
        if (dueCheck(deployment)) yield* Effect.promise(() => background(c, autoAdvance(deployment, account)))
        return c.json({ deployment: view, serverTime: nowIso() } satisfies DetailPayload)
      }),
    ),
  )

  const ACTION_DONE: Record<ActionId, string> = {
    stop: 'Stopped. Data, address and registration are kept.',
    start: 'Started. Papyrus is starting up.',
    redeploy: 'Redeployed.',
    retry: 'Retried.',
    check: 'Checked.',
    teardown: 'Teardown continued.',
  }
  const isActionId = (value: string): value is ActionId => Object.hasOwn(ACTION_DONE, value)

  /** Lifecycle and setup actions as JSON. Ownership and whether the action is allowed are checked here, not in the page. */
  const runAction = (deployment: Deployment, account: Account, action: ActionId): Program<string> =>
    Effect.gen(function* () {
      const allowed = availableActions(deployment).some((a) => a.id === action)
      if (!allowed) return yield* new UserError({ message: `${action[0]!.toUpperCase()}${action.slice(1)} is not available for this deployment right now.`, status: 409 })
      switch (action) {
        case 'stop':
          yield* stopDeployment(deployment, account)
          return ACTION_DONE.stop
        case 'start':
          yield* startDeployment(deployment, account)
          return ACTION_DONE.start
        case 'teardown':
          yield* runTeardown(deployment, account.id)
          return ACTION_DONE.teardown
        case 'redeploy': {
          const result = yield* runStep(deployment, account, 'deploy')
          if (result.status === 'fail') return yield* new UserError({ message: result.reason ?? 'Redeploy failed.', status: 502 })
          return result.reason ?? ACTION_DONE.redeploy
        }
        case 'retry':
        case 'check': {
          const step = currentStep(deployment)
          if (!step) return ACTION_DONE[action]
          const result = yield* runStep(deployment, account, step)
          if (result.status === 'fail' && action === 'retry') return yield* new UserError({ message: result.reason ?? 'Still failing.', status: 502 })
          return result.reason ?? ACTION_DONE[action]
        }
      }
    })

  app.post('/api/deployments/:id/actions/:action', (c) =>
    api(
      c,
      (account) =>
        Effect.gen(function* () {
          const action = c.req.param('action')
          if (!isActionId(action)) return c.json({ ok: false, message: 'Unknown action' }, 404)
          const deployment = yield* getOwnedDeployment(account.id, c.req.param('id'))
          const outcome = yield* runAction(deployment, account, action).pipe(Effect.result)
          const fresh = yield* getOwnedDeployment(account.id, deployment.id)
          const view = yield* detailView(c, account, fresh)
          if (outcome._tag === 'Failure') {
            const failure = outcome.failure as { _tag?: string; message?: string; status?: number }
            if (failure?._tag !== 'UserError') return yield* Effect.fail(outcome.failure)
            return c.json({ ok: false, message: failure.message ?? 'That did not work', deployment: view } satisfies ActionResult, (failure.status ?? 400) as 400)
          }
          return c.json({ ok: true, message: outcome.success, deployment: view } satisfies ActionResult)
        }),
      { mutation: true },
    ),
  )

  /** Take (or retake) the preview screenshot. 429 while rate-limited; the capture runs after the response. */
  app.post('/api/deployments/:id/preview', (c) =>
    api(
      c,
      (account) =>
        Effect.gen(function* () {
          const deployment = yield* getOwnedDeployment(account.id, c.req.param('id'))
          const claimed = yield* requestCapture(deployment).pipe(Effect.result)
          if (claimed._tag === 'Success') yield* Effect.promise(() => background(c, captureAndStore(deployment, deps.capture ?? browserCapture)))
          const view = yield* detailView(c, account, yield* getOwnedDeployment(account.id, deployment.id))
          if (claimed._tag === 'Failure') {
            const failure = claimed.failure as { message?: string; status?: number }
            return c.json({ ok: false, message: failure.message ?? 'Preview unavailable', deployment: view } satisfies ActionResult, (failure.status ?? 400) as 400)
          }
          return c.json({ ok: true, message: 'Capturing the preview.', deployment: view } satisfies ActionResult, 202)
        }),
      { mutation: true },
    ),
  )

  /** The stored screenshot, only for the deployment's own account. Versioned URL (?v=capture time), so cache hard. */
  app.get('/api/deployments/:id/preview.jpg', (c) =>
    api(c, (account) =>
      Effect.gen(function* () {
        yield* getOwnedDeployment(account.id, c.req.param('id'))
        const object = yield* previewObject(c.req.param('id'))
        if (!object) return c.json({ ok: false, message: 'No preview yet' }, 404)
        return new Response(object.body as ReadableStream, { headers: { 'content-type': 'image/jpeg', 'x-content-type-options': 'nosniff' } })
      }),
    ).then((response) => {
      if (response.status === 200) response.headers.set('cache-control', 'private, max-age=31536000, immutable')
      return response
    }),
  )

  return app
}
