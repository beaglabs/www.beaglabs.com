const HYGRAPH_ENDPOINT = process.env.HYGRAPH_ENDPOINT
const HYGRAPH_PREVIEW_ENDPOINT = process.env.HYGRAPH_PREVIEW_ENDPOINT
const HYGRAPH_TOKEN = process.env.HYGRAPH_TOKEN
const HYGRAPH_PREVIEW_TOKEN = process.env.HYGRAPH_PREVIEW_TOKEN

export async function fetchHygraph<T>(
  query: string,
  variables?: Record<string, unknown>,
  draft = false
): Promise<T> {
  const endpoint = draft ? HYGRAPH_PREVIEW_ENDPOINT : HYGRAPH_ENDPOINT
  const token = draft ? HYGRAPH_PREVIEW_TOKEN : HYGRAPH_TOKEN

  if (!endpoint || !token) {
    const mode = draft ? 'preview' : 'published'
    throw new Error(
      `Missing Hygraph ${mode} environment variables. Set HYGRAPH_${draft ? 'PREVIEW_' : ''}ENDPOINT and HYGRAPH_${draft ? 'PREVIEW_' : ''}TOKEN in .env.local`
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
