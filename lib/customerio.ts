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

/** A requested service credit email, delivered by the Customer.io credit automation. */
export async function sendComputeCreditEmail(email: string, code: string, redeemUrl: string) {
  const client = getTrackClient()
  await client.identify(email, { email, compute_credit_requested: true, source: 'beaglabs.com/hero' })
  await client.track(email, { name: 'papyrus_compute_credit_requested', data: { credit_code: code, redeem_url: redeemUrl, amount_usd: 1000 } })
}
