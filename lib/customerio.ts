import { APIClient, SendEmailRequest, TrackClient } from 'customerio-node'

let apiClient: APIClient | null = null
let trackClient: TrackClient | null = null

function getApiClient(): APIClient {
  if (!apiClient) {
    apiClient = new APIClient(process.env.CUSTOMERIO_APP_API_KEY ?? '')
  }
  return apiClient
}

function getTrackClient(): TrackClient {
  if (!trackClient) {
    const siteId = process.env.CUSTOMERIO_SITE_ID ?? ''
    const apiKey = process.env.CUSTOMERIO_TRACK_API_KEY ?? ''
    trackClient = new TrackClient(siteId, apiKey)
  }
  return trackClient
}

export async function identifyCustomer(email: string, source: string = 'beaglabs.com/cookbook') {
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

export async function sendCookbookEmail(email: string) {
  const transactionalMessageId = process.env.CUSTOMERIO_TRANSACTIONAL_MESSAGE_ID
  if (!transactionalMessageId) {
    console.error('CUSTOMERIO_TRANSACTIONAL_MESSAGE_ID not set')
    return false
  }

  try {
    const pdfUrl = 'https://beaglabs.com/beag-labs-ml-cookbook-2026.pdf'

    const req = new SendEmailRequest({
      transactional_message_id: transactionalMessageId,
      identifiers: { email },
      to: email,
      message_data: {
        pdf_download_url: pdfUrl,
        recipe_count: 52,
        domain_count: 7,
        page_estimate: '90+',
      },
    })

    await getApiClient().sendEmail(req)
    return true
  } catch (err) {
    console.error('sendCookbookEmail failed:', err)
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

export async function trackCookbookDownloaded(email: string) {
  try {
    await getTrackClient().track(email, {
      name: 'cookbook_downloaded',
      data: {
        downloaded_at: new Date().toISOString(),
      },
    })
    return true
  } catch (err) {
    console.error('trackCookbookDownloaded failed:', err)
    return false
  }
}
