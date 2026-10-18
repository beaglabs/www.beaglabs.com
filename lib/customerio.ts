import { TrackClient } from 'customerio-node'

let trackClient: TrackClient | null = null

function getTrackClient(): TrackClient {
  if (!trackClient) {
    const siteId = process.env.CUSTOMERIO_SITE_ID ?? ''
    const apiKey = process.env.CUSTOMERIO_TRACK_API_KEY ?? ''
    trackClient = new TrackClient(siteId, apiKey)
  }
  return trackClient
}

export async function identifyCustomer(email: string, source: string = 'beaglabs.com/newsletter') {
  try {
    await getTrackClient().identify(email, {
      source,
      signed_up_at: new Date().toISOString(),
      newsletter_subscriber: true,
    })
    return true
  } catch (err) {
    console.error('identifyCustomer failed:', err)
    return false
  }
}

export async function subscribeToNewsletter(email: string) {
  try {
    await getTrackClient().identify(email, {
      source: 'beaglabs.com/newsletter',
      subscribed_at: new Date().toISOString(),
      newsletter_subscriber: true,
    })
    return true
  } catch (err) {
    console.error('subscribeToNewsletter failed:', err)
    return false
  }
}

/** A requested credit email, using Customer.io's public form action integration. */
export async function sendComputeCreditEmail(email: string, code: string) {
  const siteId = process.env.CUSTOMERIO_SITE_ID
  if (!siteId) throw new Error('Customer.io site ID is not configured')
  const endpoint = new URL('https://customerioforms.com/forms/submit_action')
  endpoint.searchParams.set('site_id', siteId)
  endpoint.searchParams.set('form_id', '01m58bc66mcrg961h9q49bv0tc')
  endpoint.searchParams.set('success_url', 'https://beaglabs.com/')
  const response = await fetch(endpoint, {
    method: 'POST', redirect: 'manual',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ email, credit_code: code }),
  })
  if (response.status !== 302 || response.headers.get('location') !== 'https://beaglabs.com/') {
    throw new Error('Customer.io did not accept the credit request')
  }
}
