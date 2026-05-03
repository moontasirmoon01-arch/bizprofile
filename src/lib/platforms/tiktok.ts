export const TIKTOK_AUTH_URL = "https://business-api.tiktok.com/portal/auth"
export const TIKTOK_TOKEN_URL = "https://business-api.tiktok.com/open_api/v1.3/oauth2/access_token/"
export const TIKTOK_API_URL = "https://business-api.tiktok.com/open_api/v1.3"

export function getTikTokOAuthUrl(state: string): string {
  const params = new URLSearchParams({
    app_id: process.env.TIKTOK_APP_ID!,
    redirect_uri: `${process.env.NEXTAUTH_URL}/api/connect/tiktok/callback`,
    state,
  })
  return `${TIKTOK_AUTH_URL}?${params}`
}

export async function exchangeTikTokCode(code: string, appId: string, secret: string) {
  const res = await fetch(TIKTOK_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ app_id: appId, secret, auth_code: code }),
  })
  return res.json()
}

export async function createTikTokCampaign(accessToken: string, advertiserId: string, name: string, budget: number) {
  const res = await fetch(`${TIKTOK_API_URL}/campaign/create/`, {
    method: "POST",
    headers: { "Access-Token": accessToken, "Content-Type": "application/json" },
    body: JSON.stringify({
      advertiser_id: advertiserId,
      campaign_name: name,
      objective_type: "PRODUCT_SALES",
      budget_mode: "BUDGET_MODE_TOTAL",
      budget,
    }),
  })
  return res.json()
}
