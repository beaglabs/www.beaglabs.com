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

export type BriefType = 'papyrus' | 'services'

export const BRIEFS: Record<BriefType, { title: string; path: string }> = {
  papyrus: { title: 'Papyrus Solution Brief', path: '/briefs/papyrus-solution-brief.pdf' },
  services: { title: 'Beag Labs Solution Brief', path: '/briefs/beag-labs-solution-brief.pdf' },
}

/**
 * A solution brief request. The "Solution brief requests" campaign in Customer.io starts on this event, sends the
 * brief for `brief_type`, branches on `marketing_opt_in` to subscribe the person to marketing or not, and on
 * `cc_opt_in` to send a follow-up from James with him on CC.
 */
export async function requestSolutionBrief(email: string, input: { briefType: BriefType; marketingOptIn: boolean; ccOptIn: boolean; page: string }) {
  const brief = BRIEFS[input.briefType]
  const client = getTrackClient()
  await client.identify(email, { email, source: 'beaglabs.com/solution-brief', solution_brief_requested_at: new Date().toISOString() })
  await client.track(email, {
    name: 'solution_brief_requested',
    data: { brief_type: input.briefType, brief_title: brief.title, brief_url: `https://beaglabs.com${brief.path}`, marketing_opt_in: input.marketingOptIn, cc_opt_in: input.ccOptIn, page: input.page },
  })
}
