import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const business = await db.business.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  })
  if (!business) return NextResponse.json([])

  const connections = await db.platformConnection.findMany({
    where: { businessId: business.id },
    select: { platform: true, pageId: true, adAccountId: true, channelId: true, createdAt: true },
  })

  return NextResponse.json(connections)
}

export async function DELETE(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { platform } = await req.json()
  const business = await db.business.findUnique({ where: { userId: session.user.id }, select: { id: true } })
  if (!business) return NextResponse.json({ error: "Not found" }, { status: 404 })

  await db.platformConnection.deleteMany({
    where: { businessId: business.id, platform },
  })
  return NextResponse.json({ success: true })
}
