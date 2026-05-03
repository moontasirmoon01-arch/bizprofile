import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getMetaOAuthUrl } from "@/lib/platforms/meta"
import { getGoogleOAuthUrl } from "@/lib/platforms/google"
import { getTikTokOAuthUrl } from "@/lib/platforms/tiktok"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ platform: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { platform } = await params
  const state = `${session.user.id}:${Date.now()}`

  let url: string
  switch (platform.toUpperCase()) {
    case "META": url = getMetaOAuthUrl(state); break
    case "GOOGLE": url = getGoogleOAuthUrl(state); break
    case "TIKTOK": url = getTikTokOAuthUrl(state); break
    default: return NextResponse.json({ error: "Unknown platform" }, { status: 400 })
  }

  return NextResponse.redirect(url)
}
