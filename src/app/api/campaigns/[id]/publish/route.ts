import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { decryptToken } from "@/lib/platforms/encrypt"
import { postToFacebookPage, postToInstagram } from "@/lib/platforms/meta"
import { postToGoogleBusiness } from "@/lib/platforms/google"

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const business = await db.business.findUnique({ where: { userId: session.user.id }, select: { id: true, name: true } })
  if (!business) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const campaign = await db.campaign.findFirst({
    where: { id, businessId: business.id },
    include: {
      posts: true,
    },
  })
  if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 })

  const products = await db.product.findMany({
    where: { id: { in: campaign.productIds }, businessId: business.id },
  })

  const connections = await db.platformConnection.findMany({
    where: { businessId: business.id, platform: { in: campaign.platforms as any } },
  })

  const results: Array<{ platform: string; status: string; error?: string }> = []

  const postContent = [
    `🏪 ${business.name}`,
    campaign.description ?? campaign.title,
    products.map(p => `• ${p.name} — ${p.currency} ${p.price.toLocaleString()}`).join("\n"),
  ].filter(Boolean).join("\n\n")

  for (const conn of connections) {
    const token = decryptToken(conn.accessToken)

    try {
      console.log("[publish] platform:", conn.platform, "pageId:", conn.pageId, "metadata:", JSON.stringify(conn.metadata).slice(0, 200))
      if (conn.platform === "META" && conn.pageId) {
        const firstImage = products.find(p => p.images.length > 0)?.images[0] ?? (campaign as any).imageUrl ?? undefined
        // Use page access token from metadata if available
        const pageData = (conn.metadata as any[])?.find((p: any) => p.id === conn.pageId)
        const pageToken = pageData?.access_token ?? token
        console.log("[publish META] pageId:", conn.pageId, "hasPageToken:", !!pageData?.access_token)
        const result = await postToFacebookPage(conn.pageId, pageToken, postContent, firstImage)
        console.log("[publish META] result:", JSON.stringify(result))

        await db.campaignPost.create({
          data: {
            campaignId: id,
            connectionId: conn.id,
            platform: "META",
            externalId: result.id,
            status: result.id ? "PUBLISHED" : "FAILED",
            publishedAt: result.id ? new Date() : null,
            errorMsg: result.error?.message,
          },
        })
        results.push({ platform: "META", status: result.id ? "published" : "failed" })

        // Instagram: post if page has linked IG Business Account and campaign has an image
        const igAccountId = pageData?.instagram_business_account?.id
        if (igAccountId && firstImage) {
          console.log("[publish IG] igAccountId:", igAccountId)
          try {
            const igResult = await postToInstagram(igAccountId, pageToken, firstImage, postContent)
            console.log("[publish IG] result:", JSON.stringify(igResult))
            await db.campaignPost.create({
              data: {
                campaignId: id,
                connectionId: conn.id,
                platform: "META",
                externalId: igResult.id,
                status: igResult.id ? "PUBLISHED" : "FAILED",
                publishedAt: igResult.id ? new Date() : null,
                errorMsg: igResult.error?.message ?? (igResult.id ? null : JSON.stringify(igResult)),
              },
            })
            results.push({ platform: "INSTAGRAM", status: igResult.id ? "published" : "failed" })
          } catch (igErr: unknown) {
            const msg = igErr instanceof Error ? igErr.message : String(igErr)
            console.error("[publish IG] error:", msg)
            results.push({ platform: "INSTAGRAM", status: "failed", error: msg })
          }
        }
      }

      if (conn.platform === "GOOGLE") {
        // Google Business Post - requires location name from metadata
        const locationName = (conn.metadata as any)?.locationName
        if (locationName) {
          await postToGoogleBusiness(token, locationName, postContent)
          await db.campaignPost.create({
            data: {
              campaignId: id, connectionId: conn.id, platform: "GOOGLE",
              status: "PUBLISHED", publishedAt: new Date(),
            },
          })
          results.push({ platform: "GOOGLE", status: "published" })
        }
      }
    } catch (e: unknown) {
      const errorMsg = e instanceof Error ? e.message : String(e)
      results.push({ platform: conn.platform, status: "failed", error: errorMsg })
      await db.campaignPost.create({
        data: {
          campaignId: id, connectionId: conn.id, platform: conn.platform as any,
          status: "FAILED", errorMsg,
        },
      })
    }
  }

  await db.campaign.update({ where: { id }, data: { status: "ACTIVE" } })
  return NextResponse.json({ results })
}
