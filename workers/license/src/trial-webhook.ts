import type { Bindings } from './env'

export async function postTrialWebhook(
  env: Bindings,
  event: string,
  title: string,
  details: Record<string, string>,
): Promise<void> {
  if (!env.TRIAL_NOTIFICATIONS_WEBHOOK_URL) throw new Error('Trial webhook is not configured')
  const text = [title, ...Object.entries(details).map(([name, value]) => `${name}: ${value}`)].join('\n')
  const response = await fetch(env.TRIAL_NOTIFICATIONS_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    redirect: 'error',
    signal: AbortSignal.timeout(10000),
    body: JSON.stringify({
      event, properties: details, text,
      type: 'message',
      attachments: [{
        contentType: 'application/vnd.microsoft.card.adaptive',
        contentUrl: null,
        content: {
          $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
          type: 'AdaptiveCard', version: '1.2',
          body: [
            { type: 'TextBlock', text: title, weight: 'Bolder', wrap: true },
            { type: 'FactSet', facts: Object.entries(details).map(([title, value]) => ({ title, value })) },
          ],
        },
      }],
    }),
  })
  // Never log response bodies or request errors containing the signed URL.
  if (!response.ok) throw new Error(`Trial webhook returned HTTP ${response.status}`)
  console.info('trial webhook accepted', { event, status: response.status })
}
