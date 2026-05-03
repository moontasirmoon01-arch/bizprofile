import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"

const campaignSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  productIds: z.array(z.string()),
  platforms: z.array(z.enum(["META", "GOOGLE", "YOUTUBE", "TIKTOK"])),
  budget: z.coerce.number().positive().optional(),
  currency: z.string().default("BDT"),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
})

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const business = await db.business.findUnique({ where: { userId: session.user.id }, select: { id: true } })
  if (!business) return NextResponse.json([])

  const campaigns = await db.campaign.findMany({
    where: { businessId: business.id },
    include: { posts: true },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(campaigns)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const business = await db.business.findUnique({ where: { userId: session.user.id }, select: { id: true } })
  if (!business) return NextResponse.json({ error: "Setup business first" }, { status: 404 })

  const body = await req.json()
  const parsed = campaignSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })

  const campaign = await db.campaign.create({
    data: {
      businessId: business.id,
      ...parsed.data,
      startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : null,
      endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : null,
    },
  })
  return NextResponse.json(campaign, { status: 201 })
}
