import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { exchangeMetaCode, getLongLivedToken, getMetaPages } from "@/lib/platforms/meta"
import { exchangeGoogleCode } from "@/lib/platforms/google"
import { exchangeTikTokCode } from "@/lib/platforms/tiktok"
import { encryptToken } from "@/lib/platforms/encrypt"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ platform: string }> }
) {
  const { platform } = await params
  const url = new URL(req.url)
  const code = url.searchParams.get("code")
  const state = url.searchParams.get("state")
  const error = url.searchParams.get("error")

  if (error) return NextResponse.redirect(new URL("/connect?error=" + error, process.env.NEXTAUTH_URL!))
  if (!code || !state) return NextResponse.redirect(new URL("/connect?error=missing_params", process.env.NEXTAUTH_URL!))

  const userId = state.split(":")[0]
  const business = await db.business.findUnique({ where: { userId }, select: { id: true } })
  if (!business) return NextResponse.redirect(new URL("/connect?error=no_business", process.env.NEXTAUTH_URL!))

  try {
    const platformUpper = platform.toUpperCase() as "META" | "GOOGLE" | "YOUTUBE" | "TIKTOK"

    if (platformUpper === "META") {
      console.log("[META callback] exchanging code...")
      const tokens = await exchangeMetaCode(code)
      console.log("[META callback] short token ok, getting long-lived token...")
      if (!tokens.access_token) {
        console.error("[META callback] no access_token in response:", JSON.stringify(tokens))
        return NextResponse.redirect(new URL("/connect?error=no_access_token", process.env.NEXTAUTH_URL!))
      }
      const longToken = await getLongLivedToken(tokens.access_token)
      console.log("[META callback] long token ok, fetching pages...")
      const pages = await getMetaPages(longToken)
      console.log("[META callback] pages response:", JSON.stringify(pages).slice(0, 300))
      const firstPage = pages.data?.[0]

      await db.platformConnection.upsert({
        where: { businessId_platform: { businessId: business.id, platform: "META" } },
        create: {
          businessId: business.id,
          platform: "META",
          accessToken: encryptToken(longToken),
          pageId: firstPage?.id,
          metadata: pages.data ?? [],
        },
        update: {
          accessToken: encryptToken(longToken),
          pageId: firstPage?.id,
          metadata: pages.data ?? [],
        },
      })
    }

    if (platformUpper === "GOOGLE" || platformUpper === "YOUTUBE") {
      const tokens = await exchangeGoogleCode(code)
      await db.platformConnection.upsert({
        where: { businessId_platform: { businessId: business.id, platform: "GOOGLE" } },
        create: {
          businessId: business.id,
          platform: "GOOGLE",
          accessToken: encryptToken(tokens.access_token!),
          refreshToken: tokens.refresh_token ? encryptToken(tokens.refresh_token) : null,
          expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        },
        update: {
          accessToken: encryptToken(tokens.access_token!),
          refreshToken: tokens.refresh_token ? encryptToken(tokens.refresh_token) : null,
          expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        },
      })
    }

    if (platformUpper === "TIKTOK") {
      const data = await exchangeTikTokCode(code, process.env.TIKTOK_APP_ID!, process.env.TIKTOK_APP_SECRET!)
      await db.platformConnection.upsert({
        where: { businessId_platform: { businessId: business.id, platform: "TIKTOK" } },
        create: {
          businessId: business.id,
          platform: "TIKTOK",
          accessToken: encryptToken(data.data?.access_token),
          adAccountId: data.data?.advertiser_id,
          expiresAt: new Date(Date.now() + (data.data?.expires_in ?? 86400) * 1000),
        },
        update: {
          accessToken: encryptToken(data.data?.access_token),
          adAccountId: data.data?.advertiser_id,
          expiresAt: new Date(Date.now() + (data.data?.expires_in ?? 86400) * 1000),
        },
      })
    }

    return NextResponse.redirect(new URL("/connect?success=" + platform, process.env.NEXTAUTH_URL!))
  } catch (e: any) {
    console.error("[OAuth callback] FATAL error for platform", platform, ":", e?.message ?? e)
    const errMsg = encodeURIComponent(e?.message?.slice(0, 100) ?? "exchange_failed")
    return NextResponse.redirect(new URL("/connect?error=" + errMsg, process.env.NEXTAUTH_URL!))
  }
}
