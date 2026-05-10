import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { randomUUID } from "crypto"
import sharp from "sharp"
import satori from "satori"

export const maxDuration = 60

let cachedFont: ArrayBuffer | null = null

async function getBengaliFont(): Promise<ArrayBuffer> {
  if (cachedFont) return cachedFont
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000"
  const res = await fetch(`${baseUrl}/fonts/NotoSansBengali-Regular.ttf`)
  if (!res.ok) throw new Error(`Font fetch failed: ${res.status}`)
  cachedFont = await res.arrayBuffer()
  return cachedFont
}

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

async function createTextOverlay(
  width: number,
  height: number,
  title: string,
  businessName: string,
  fontData: ArrayBuffer
): Promise<Buffer> {
  const overlayH = Math.round(height * 0.38)
  const titleSize = Math.round(width * 0.052)
  const bizSize = Math.round(width * 0.028)

  const svg = await satori(
    {
      type: "div",
      props: {
        style: {
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          alignItems: "center",
          width: `${width}px`,
          height: `${overlayH}px`,
          background: "linear-gradient(to bottom, transparent, rgba(0,0,0,0.78))",
          paddingBottom: "28px",
          paddingLeft: "20px",
          paddingRight: "20px",
          gap: "10px",
          boxSizing: "border-box",
        },
        children: [
          {
            type: "div",
            props: {
              style: {
                fontFamily: "NotoSansBengali",
                fontSize: `${titleSize}px`,
                fontWeight: "bold",
                color: "white",
                textAlign: "center",
              },
              children: title,
            },
          },
          {
            type: "div",
            props: {
              style: {
                fontFamily: "NotoSansBengali",
                fontSize: `${bizSize}px`,
                color: "rgba(255,255,255,0.82)",
                textAlign: "center",
                letterSpacing: "1px",
              },
              children: businessName,
            },
          },
        ],
      },
    },
    {
      width,
      height: overlayH,
      fonts: [{ name: "NotoSansBengali", data: fontData, weight: 400, style: "normal" }],
    }
  )

  return sharp(Buffer.from(svg)).png().toBuffer()
}

async function overlayLogo(
  img: sharp.Sharp,
  logoUrl: string,
  width: number,
  height: number
): Promise<sharp.Sharp> {
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
    return NextResponse.json({ error: `Replicate ${startRes.status}: ${err.slice(0, 300)}` }, { status: 500 })
  }

  const prediction = await startRes.json()
  const imageUrl = await pollPrediction(prediction.id, token)

  const imgRes = await fetch(imageUrl)
  const imgBytes = await imgRes.arrayBuffer()

  let baseSharp = sharp(Buffer.from(imgBytes))
  const { width = 1024, height = 1024 } = await baseSharp.metadata()

  // Text overlay
  if (title && business?.name) {
    try {
      const fontData = await getBengaliFont()
      const textPng = await createTextOverlay(width, height, title, business.name, fontData)
      baseSharp = sharp(
        await baseSharp
          .composite([{ input: textPng, top: height - Math.round(height * 0.38), left: 0 }])
          .jpeg({ quality: 92 })
          .toBuffer()
      )
    } catch (e) {
      console.error("Text overlay error:", e)
    }
  }

  // Logo overlay
  if (business?.logoUrl) {
    try {
      baseSharp = await overlayLogo(baseSharp, business.logoUrl, width, height)
    } catch (e) {
      console.error("Logo overlay error:", e)
    }
  }

  const finalBuffer = await baseSharp.jpeg({ quality: 92 }).toBuffer()

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
