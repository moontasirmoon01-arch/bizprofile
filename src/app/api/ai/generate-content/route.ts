import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { productIds, platforms, businessName } = await req.json()

  const products = productIds?.length
    ? await db.product.findMany({ where: { id: { in: productIds } } })
    : []

  const platformList = (platforms as string[]).join(", ")
  const productList = products.map((p: any) =>
    `${p.name} — ${p.currency} ${p.price}${p.description ? ` (${p.description})` : ""}`
  ).join("\n")

  const prompt = `You are a social media marketing expert for small businesses in Bangladesh.
Create an engaging ${platformList} post in Bengali (বাংলা) for this business and products.

Business: ${businessName}
Products/Services:
${productList || "General business promotion"}

Requirements:
- Write in Bengali (বাংলা)
- Engaging, friendly tone suitable for Bangladeshi audience
- Include relevant emojis
- Keep caption under 300 words
- Add 5-8 relevant Bengali/English hashtags at the end

Respond in this exact JSON format:
{
  "title": "short campaign title in Bengali (max 8 words)",
  "caption": "full post caption with emojis",
  "hashtags": "#tag1 #tag2 #tag3"
}`

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error("Claude API error:", res.status, err)
    return NextResponse.json({ error: `Claude API ${res.status}: ${err.slice(0, 200)}` }, { status: 500 })
  }

  const data = await res.json()
  const text = data.content?.[0]?.text ?? ""

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    const parsed = JSON.parse(jsonMatch?.[0] ?? text)
    return NextResponse.json(parsed)
  } catch {
    return NextResponse.json({ error: "Failed to parse AI response", raw: text }, { status: 500 })
  }
}
