const HYGRAPH_ENDPOINT = process.env.HYGRAPH_ENDPOINT
const HYGRAPH_TOKEN = process.env.HYGRAPH_TOKEN
const HYGRAPH_PREVIEW_TOKEN = process.env.HYGRAPH_PREVIEW_TOKEN

export async function fetchHygraph<T>(
  query: string,
  variables?: Record<string, unknown>,
  draft = false
): Promise<T> {
  if (!HYGRAPH_ENDPOINT || !HYGRAPH_TOKEN) {
    throw new Error(
      'Missing Hygraph environment variables. Set HYGRAPH_ENDPOINT and HYGRAPH_TOKEN in .env.local'
    )
  }

  // CDN Content API uses ?stage=DRAFT query param for preview
  const endpoint = draft
    ? `${HYGRAPH_ENDPOINT}?stage=DRAFT`
    : HYGRAPH_ENDPOINT
  const token = draft ? HYGRAPH_PREVIEW_TOKEN : HYGRAPH_TOKEN

  if (draft && !HYGRAPH_PREVIEW_TOKEN) {
    throw new Error(
      'Missing HYGRAPH_PREVIEW_TOKEN. Create a permanent auth token in Hygraph with Draft + Published stage access, then add it to .env.local'
    )
  }

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query, variables }),
    next: draft ? { revalidate: 0 } : { revalidate: 3600 },
  })

  if (!res.ok) {
    throw new Error(
      `Hygraph request failed: ${res.status} ${res.statusText}`
    )
  }

  const json = await res.json()

  if (json.errors) {
    throw new Error(
      `Hygraph GraphQL errors: ${JSON.stringify(json.errors)}`
    )
  }

  return json.data as T
}
