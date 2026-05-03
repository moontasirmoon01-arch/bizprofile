import { google } from "googleapis"

export function getGoogleOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXTAUTH_URL!.trim()}/api/connect/google/callback`
  )
}

export function getGoogleOAuthUrl(state: string): string {
  const client = getGoogleOAuthClient()
  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/business.manage",
      "https://www.googleapis.com/auth/youtube",
      "https://www.googleapis.com/auth/youtube.upload",
      "https://www.googleapis.com/auth/adwords",
    ],
    state,
  })
}

export async function exchangeGoogleCode(code: string) {
  const client = getGoogleOAuthClient()
  const { tokens } = await client.getToken(code)
  return tokens
}

export async function postToGoogleBusiness(accessToken: string, locationName: string, text: string) {
  // Google My Business Local Posts API (v4) via REST
  const url = `https://mybusiness.googleapis.com/v4/${locationName}/localPosts`
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      languageCode: "bn",
      summary: text,
      topicType: "STANDARD",
    }),
  })
  return res.json()
}

export async function getYouTubeChannelInfo(accessToken: string) {
  const client = getGoogleOAuthClient()
  client.setCredentials({ access_token: accessToken })
  const youtube = google.youtube({ version: "v3", auth: client })
  const res = await youtube.channels.list({ part: ["snippet", "statistics"], mine: true })
  return res.data.items?.[0]
}
