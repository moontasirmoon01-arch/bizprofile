import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { randomUUID } from "crypto"
import sharp from "sharp"

export const maxDuration = 60

async function pollPrediction(id: string, token: string): Promise<string> {
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 2000))
    const res = await fetch(`https://api.replicate.com/v1/predictions/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await res.json()
    if (data.status === "succeeded") return data.output?.[0]
    if (data.status === "failed") throw new Error(data.error ?? "Image generation failed")
  }
  throw new Error("Timed out waiting for image")
}

async function overlayLogo(imageBytes: ArrayBuffer, logoUrl: string): Promise<Buffer> {
  const baseImg = sharp(Buffer.from(imageBytes))
  const { width = 1024, height = 1024 } = await baseImg.metadata()

  const logoSize = Math.round(Math.min(width, height) * 0.18)
  const padding = Math.round(logoSize * 0.2)

  const logoRes = await fetch(logoUrl)
  const logoBytes = await logoRes.arrayBuffer()

  const logoBuffer = await sharp(Buffer.from(logoBytes))
    .resize(logoSize, logoSize, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer()

  // White rounded background behind logo
  const bgSize = logoSize + padding * 2
  const bgSvg = `<svg width="${bgSize}" height="${bgSize}">
    <rect width="${bgSize}" height="${bgSize}" rx="${Math.round(bgSize * 0.15)}" fill="white" fill-opacity="0.85"/>
  </svg>`

  const bgBuffer = Buffer.from(bgSvg)

  const composite = await baseImg
    .composite([
      {
        input: bgBuffer,
        left: width - bgSize - padding,
        top: height - bgSize - padding,
      },
      {
        input: logoBuffer,
        left: width - logoSize - padding * 2,
        top: height - logoSize - padding * 2,
      },
    ])
    .jpeg({ quality: 92 })
    .toBuffer()

  return composite
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { prompt } = await req.json()
  if (!prompt) return NextResponse.json({ error: "prompt required" }, { status: 400 })

  const token = process.env.REPLICATE_API_TOKEN?.trim()
  if (!token) return NextResponse.json({ error: "REPLICATE_API_TOKEN not set" }, { status: 500 })

  const business = await db.business.findUnique({
    where: { userId: session.user.id },
    select: { logoUrl: true },
  })

  // Append realism boosters to prompt
  const enhancedPrompt = `${prompt}. Photorealistic, DSLR photography, 85mm lens, professional studio lighting, ultra sharp, 8K resolution, commercial advertisement quality, no text, no watermark`

  // Start FLUX Dev prediction (higher quality)
  const startRes = await fetch("https://api.replicate.com/v1/models/black-forest-labs/flux-dev/predictions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input: {
        prompt: enhancedPrompt,
        num_outputs: 1,
        output_format: "jpg",
        aspect_ratio: "1:1",
        guidance: 3.5,
        num_inference_steps: 28,
      },
    }),
  })

  if (!startRes.ok) {
    const err = await startRes.text()
    console.error("Replicate start error:", err)
    return NextResponse.json({ error: `Replicate ${startRes.status}: ${err.slice(0, 300)}` }, { status: 500 })
  }

  const prediction = await startRes.json()
  const imageUrl = await pollPrediction(prediction.id, token)

  // Download generated image
  const imgRes = await fetch(imageUrl)
  const imgBytes = await imgRes.arrayBuffer()

  // Overlay logo if business has one
  let finalBuffer: Buffer
  if (business?.logoUrl) {
    try {
      finalBuffer = await overlayLogo(imgBytes, business.logoUrl)
    } catch (e) {
      console.error("Logo overlay failed, using image without logo:", e)
      finalBuffer = Buffer.from(imgBytes)
    }
  } else {
    finalBuffer = Buffer.from(imgBytes)
  }

  const path = `ai-generated/${session.user.id}/${randomUUID()}.jpg`
  const bucket = "product-images"
  const supabaseUrl = process.env.SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  const uploadRes = await fetch(`${supabaseUrl}/storage/v1/object/${bucket}/${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "image/jpeg",
    },
    body: finalBuffer,
  })

  if (!uploadRes.ok) {
    console.error("Supabase upload error:", await uploadRes.text())
    return NextResponse.json({ error: "Failed to store image" }, { status: 500 })
  }

  const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`
  return NextResponse.json({ url: publicUrl })
}
