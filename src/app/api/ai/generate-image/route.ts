import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { randomUUID } from "crypto"
import { readFileSync } from "fs"
import path from "path"
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

function escapeXml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}

function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(" ")
  const lines: string[] = []
  let current = ""
  for (const word of words) {
    if ((current + " " + word).trim().length > maxChars) {
      if (current) lines.push(current.trim())
      current = word
    } else {
      current = (current + " " + word).trim()
    }
  }
  if (current) lines.push(current.trim())
  return lines.slice(0, 3)
}

async function addTextOverlay(
  imageBytes: ArrayBuffer,
  title: string,
  businessName: string
): Promise<Buffer> {
  const fontPath = path.join(process.cwd(), "public", "fonts", "NotoSansBengali-Regular.ttf")
  const fontBase64 = readFileSync(fontPath).toString("base64")

  const baseImg = sharp(Buffer.from(imageBytes))
  const { width = 1024, height = 1024 } = await baseImg.metadata()

  const gradientH = Math.round(height * 0.35)
  const gradientY = height - gradientH

  const titleFontSize = Math.round(width * 0.055)
  const bizFontSize = Math.round(width * 0.032)
  const titleLines = wrapText(title, 22)
  const lineH = titleFontSize * 1.4

  const titleBlockH = titleLines.length * lineH
  const titleStartY = gradientY + gradientH * 0.28
  const bizY = gradientY + gradientH * 0.82

  const titleElements = titleLines
    .map((line, i) =>
      `<text x="${width / 2}" y="${titleStartY + i * lineH}" font-family="NotoSansBengali" font-size="${titleFontSize}" fill="white" text-anchor="middle" dominant-baseline="hanging" font-weight="bold" filter="url(#shadow)">${escapeXml(line)}</text>`
    )
    .join("\n")

  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      @font-face {
        font-family: 'NotoSansBengali';
        src: url('data:font/truetype;base64,${fontBase64}');
      }
    </style>
    <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="black" stop-opacity="0"/>
      <stop offset="100%" stop-color="black" stop-opacity="0.72"/>
    </linearGradient>
    <filter id="shadow">
      <feDropShadow dx="1" dy="1" stdDeviation="2" flood-color="black" flood-opacity="0.8"/>
    </filter>
  </defs>
  <rect x="0" y="${gradientY}" width="${width}" height="${gradientH}" fill="url(#grad)"/>
  ${titleElements}
  <text x="${width / 2}" y="${bizY}" font-family="NotoSansBengali" font-size="${bizFontSize}" fill="rgba(255,255,255,0.8)" text-anchor="middle" dominant-baseline="hanging" letter-spacing="1">${escapeXml(businessName)}</text>
</svg>`

  return baseImg
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
    .jpeg({ quality: 92 })
    .toBuffer()
}

async function overlayLogo(img: sharp.Sharp, logoUrl: string, width: number, height: number): Promise<sharp.Sharp> {
  const logoSize = Math.round(Math.min(width, height) * 0.14)
  const padding = Math.round(logoSize * 0.25)

  const logoRes = await fetch(logoUrl)
  const logoBytes = await logoRes.arrayBuffer()

  const logoBuffer = await sharp(Buffer.from(logoBytes))
    .resize(logoSize, logoSize, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer()

  const bgSize = logoSize + padding * 2
  const bgSvg = `<svg width="${bgSize}" height="${bgSize}"><rect width="${bgSize}" height="${bgSize}" rx="${Math.round(bgSize * 0.15)}" fill="white" fill-opacity="0.85"/></svg>`

  return img.composite([
    { input: Buffer.from(bgSvg), left: width - bgSize - padding, top: padding },
    { input: logoBuffer, left: width - logoSize - padding * 2, top: padding * 2 },
  ])
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { prompt, title } = await req.json()
  if (!prompt) return NextResponse.json({ error: "prompt required" }, { status: 400 })

  const token = process.env.REPLICATE_API_TOKEN?.trim()
  if (!token) return NextResponse.json({ error: "REPLICATE_API_TOKEN not set" }, { status: 500 })

  const business = await db.business.findUnique({
    where: { userId: session.user.id },
    select: { logoUrl: true, name: true },
  })

  const enhancedPrompt = `${prompt}. Photorealistic, DSLR photography, 85mm lens, professional studio lighting, ultra sharp, 8K resolution, commercial advertisement quality, no text, no watermark`

  const startRes = await fetch("https://api.replicate.com/v1/models/black-forest-labs/flux-dev/predictions", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      input: { prompt: enhancedPrompt, num_outputs: 1, output_format: "jpg", aspect_ratio: "1:1", guidance: 3.5, num_inference_steps: 28 },
    }),
  })

  if (!startRes.ok) {
    const err = await startRes.text()
    return NextResponse.json({ error: `Replicate ${startRes.status}: ${err.slice(0, 300)}` }, { status: 500 })
  }

  const prediction = await startRes.json()
  const imageUrl = await pollPrediction(prediction.id, token)

  const imgRes = await fetch(imageUrl)
  const imgBytes = await imgRes.arrayBuffer()

  let finalBuffer: Buffer

  try {
    // Add text overlay first
    const withText = title && business?.name
      ? await addTextOverlay(imgBytes, title, business.name)
      : Buffer.from(imgBytes)

    // Then overlay logo top-right
    if (business?.logoUrl) {
      const withTextSharp = sharp(withText)
      const { width = 1024, height = 1024 } = await withTextSharp.metadata()
      const withLogo = await overlayLogo(withTextSharp, business.logoUrl, width, height)
      finalBuffer = await withLogo.jpeg({ quality: 92 }).toBuffer()
    } else {
      finalBuffer = withText
    }
  } catch (e) {
    console.error("Overlay error:", e)
    finalBuffer = Buffer.from(imgBytes)
  }

  const filePath = `ai-generated/${session.user.id}/${randomUUID()}.jpg`
  const bucket = "product-images"
  const supabaseUrl = process.env.SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  const uploadRes = await fetch(`${supabaseUrl}/storage/v1/object/${bucket}/${filePath}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${serviceKey}`, "Content-Type": "image/jpeg" },
    body: finalBuffer,
  })

  if (!uploadRes.ok) {
    return NextResponse.json({ error: "Failed to store image" }, { status: 500 })
  }

  return NextResponse.json({ url: `${supabaseUrl}/storage/v1/object/public/${bucket}/${filePath}` })
}
