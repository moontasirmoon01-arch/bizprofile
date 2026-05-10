import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { randomUUID } from "crypto"

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

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { prompt } = await req.json()
  if (!prompt) return NextResponse.json({ error: "prompt required" }, { status: 400 })

  const token = process.env.REPLICATE_API_TOKEN!

  // Start FLUX Schnell prediction
  const startRes = await fetch("https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ input: { prompt, num_outputs: 1, output_format: "jpg" } }),
  })

  if (!startRes.ok) {
    const err = await startRes.text()
    console.error("Replicate start error:", err)
    return NextResponse.json({ error: "Failed to start image generation" }, { status: 500 })
  }

  const prediction = await startRes.json()
  const imageUrl = await pollPrediction(prediction.id, token)

  // Download and store in Supabase
  const imgRes = await fetch(imageUrl)
  const imgBytes = await imgRes.arrayBuffer()

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
    body: imgBytes,
  })

  if (!uploadRes.ok) {
    console.error("Supabase upload error:", await uploadRes.text())
    return NextResponse.json({ error: "Failed to store image" }, { status: 500 })
  }

  const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`
  return NextResponse.json({ url: publicUrl })
}
