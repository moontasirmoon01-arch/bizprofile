// Facebook + Instagram via Meta Graph API v21.0
export const META_AUTH_URL = "https://www.facebook.com/v21.0/dialog/oauth"
export const META_TOKEN_URL = "https://graph.facebook.com/v21.0/oauth/access_token"
export const META_GRAPH_URL = "https://graph.facebook.com/v21.0"

export function getMetaOAuthUrl(state: string): string {
  const configId = process.env.META_CONFIG_ID

  if (configId) {
    // Business Login: config_id defines scopes — do NOT send scope param
    const params = new URLSearchParams({
      client_id: process.env.META_APP_ID!,
      redirect_uri: `${process.env.NEXTAUTH_URL}/api/connect/meta/callback`,
      state,
      response_type: "code",
      config_id: configId,
    })
    return `${META_AUTH_URL}?${params}`
  }

  // Standard Facebook Login fallback
  const params = new URLSearchParams({
    client_id: process.env.META_APP_ID!,
    redirect_uri: `${process.env.NEXTAUTH_URL}/api/connect/meta/callback`,
    scope: "pages_show_list,pages_read_engagement,pages_manage_posts",
    state,
    response_type: "code",
  })
  return `${META_AUTH_URL}?${params}`
}

export async function exchangeMetaCode(code: string): Promise<{ access_token: string; token_type: string }> {
  const params = new URLSearchParams({
    client_id: process.env.META_APP_ID!,
    client_secret: process.env.META_APP_SECRET!,
    redirect_uri: `${process.env.NEXTAUTH_URL}/api/connect/meta/callback`,
    code,
  })
  const res = await fetch(`${META_TOKEN_URL}?${params}`)
  return res.json()
}

export async function getLongLivedToken(shortToken: string): Promise<string> {
  const params = new URLSearchParams({
    grant_type: "fb_exchange_token",
    client_id: process.env.META_APP_ID!,
    client_secret: process.env.META_APP_SECRET!,
    fb_exchange_token: shortToken,
  })
  const res = await fetch(`${META_TOKEN_URL}?${params}`)
  const data = await res.json()
  return data.access_token
}

export async function getMetaPages(accessToken: string) {
  const res = await fetch(`${META_GRAPH_URL}/me/accounts?access_token=${accessToken}`)
  return res.json()
}

export async function postToFacebookPage(pageId: string, pageToken: string, message: string, imageUrl?: string) {
  const body: Record<string, string> = { message, access_token: pageToken }
  const endpoint = imageUrl ? `${META_GRAPH_URL}/${pageId}/photos` : `${META_GRAPH_URL}/${pageId}/feed`
  if (imageUrl) body.url = imageUrl
  const res = await fetch(endpoint, { method: "POST", body: new URLSearchParams(body) })
  return res.json()
}

export async function postToInstagram(igUserId: string, accessToken: string, imageUrl: string, caption: string) {
  // Step 1: Create media container
  const containerRes = await fetch(`${META_GRAPH_URL}/${igUserId}/media`, {
    method: "POST",
    body: new URLSearchParams({ image_url: imageUrl, caption, access_token: accessToken }),
  })
  const { id: creationId } = await containerRes.json()
  // Step 2: Publish
  const publishRes = await fetch(`${META_GRAPH_URL}/${igUserId}/media_publish`, {
    method: "POST",
    body: new URLSearchParams({ creation_id: creationId, access_token: accessToken }),
  })
  return publishRes.json()
}
