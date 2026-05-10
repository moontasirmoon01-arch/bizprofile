"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import Image from "next/image"

const PLATFORM_INFO: Record<string, { icon: string; label: string }> = {
  META: { icon: "📘", label: "Facebook + Instagram" },
  GOOGLE: { icon: "🔴", label: "Google Business" },
  YOUTUBE: { icon: "▶️", label: "YouTube" },
  TIKTOK: { icon: "🎵", label: "TikTok" },
}

interface Product { id: string; name: string; price: number; currency: string }

export function NewCampaignForm({
  products,
  connectedPlatforms,
  businessName,
}: {
  products: Product[]
  connectedPlatforms: string[]
  businessName: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])

  // AI state
  const [aiLoading, setAiLoading] = useState(false)
  const [imgLoading, setImgLoading] = useState(false)
  const [aiImageUrl, setAiImageUrl] = useState("")
  const [imagePrompt, setImagePrompt] = useState("")

  const { register, handleSubmit, setValue, watch } = useForm({
    defaultValues: { title: "", description: "", budget: "", currency: "BDT" }
  })

  function toggleProduct(id: string) {
    setSelectedProducts(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])
  }
  function togglePlatform(p: string) {
    setSelectedPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])
  }

  async function generateContent() {
    setAiLoading(true)
    setError("")
    try {
      const res = await fetch("/api/ai/generate-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productIds: selectedProducts, platforms: selectedPlatforms, businessName }),
      })
      let data: any = {}
      try { data = await res.json() } catch { throw new Error("Server timeout — try again") }
      if (!res.ok) throw new Error(data.error ?? "AI generation failed")
      if (data.title) setValue("title", data.title)
      if (data.caption) {
        const full = data.hashtags ? `${data.caption}\n\n${data.hashtags}` : data.caption
        setValue("description", full)
      }
      // Auto-set image prompt
      const productNames = products.filter(p => selectedProducts.includes(p.id)).map(p => p.name).join(", ")
      setImagePrompt(`Professional product advertisement photo for ${businessName}${productNames ? `, featuring ${productNames}` : ""}, vibrant colors, clean background, Bangladesh market`)
    } catch (e: any) {
      setError(e.message ?? "AI content generation failed")
    }
    setAiLoading(false)
  }

  async function generateImage() {
    if (!imagePrompt) return
    setImgLoading(true)
    setError("")
    try {
      const res = await fetch("/api/ai/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: imagePrompt }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setAiImageUrl(data.url)
    } catch (e: any) {
      setError(e.message ?? "Image generation failed")
    }
    setImgLoading(false)
  }

  async function onSubmit(data: any) {
    if (selectedPlatforms.length === 0) { setError("কমপক্ষে একটি প্ল্যাটফর্ম বেছে নিন"); return }
    setLoading(true)
    setError("")
    const res = await fetch("/api/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        productIds: selectedProducts,
        platforms: selectedPlatforms,
        aiImageUrl: aiImageUrl || undefined,
      }),
    })
    const json = await res.json()
    if (!res.ok) { setError(json.error); setLoading(false); return }
    router.push("/campaigns")
    router.refresh()
  }

  const canGenerateAI = selectedPlatforms.length > 0

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

      {/* Platform selection */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">প্ল্যাটফর্ম বেছে নিন *</h2>
        {connectedPlatforms.length === 0 ? (
          <p className="text-sm text-gray-400">কোনো প্ল্যাটফর্ম কানেক্ট নেই। <a href="/connect" className="text-blue-600 underline">কানেক্ট করুন</a></p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {connectedPlatforms.map(p => (
              <button key={p} type="button" onClick={() => togglePlatform(p)}
                className={`flex items-center gap-2 p-3 rounded-xl border text-sm font-medium transition-colors ${
                  selectedPlatforms.includes(p) ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-600 hover:border-blue-200"
                }`}>
                <span className="text-xl">{PLATFORM_INFO[p]?.icon}</span>
                {PLATFORM_INFO[p]?.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Products */}
      {products.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">প্রোডাক্ট যুক্ত করুন</h2>
          <div className="space-y-2">
            {products.map(p => (
              <label key={p.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                selectedProducts.includes(p.id) ? "border-blue-200 bg-blue-50" : "border-gray-100 hover:border-gray-200"
              }`}>
                <input type="checkbox" checked={selectedProducts.includes(p.id)} onChange={() => toggleProduct(p.id)} className="rounded" />
                <span className="flex-1 text-sm font-medium text-gray-800">{p.name}</span>
                <span className="text-sm text-gray-500">{p.currency} {p.price.toLocaleString()}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* AI Content Generation */}
      <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl border border-purple-100 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">🤖</span>
          <h2 className="font-semibold text-gray-900">AI দিয়ে কন্টেন্ট তৈরি করুন</h2>
        </div>
        <p className="text-sm text-gray-500">প্ল্যাটফর্ম ও প্রোডাক্ট বেছে নিন, তারপর AI আপনার জন্য পোস্ট লিখে দেবে।</p>

        <button
          type="button"
          onClick={generateContent}
          disabled={!canGenerateAI || aiLoading}
          className="w-full py-2.5 bg-purple-600 text-white text-sm font-semibold rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {aiLoading ? "✨ তৈরি হচ্ছে..." : "✨ AI দিয়ে ক্যাপশন লিখুন"}
        </button>

        {!canGenerateAI && (
          <p className="text-xs text-gray-400 text-center">আগে প্ল্যাটফর্ম বেছে নিন</p>
        )}

        {/* Image generation */}
        {imagePrompt && (
          <div className="space-y-3 pt-2 border-t border-purple-100">
            <label className="block text-sm font-medium text-gray-700">ছবির বিবরণ (ইংরেজিতে)</label>
            <textarea
              value={imagePrompt}
              onChange={e => setImagePrompt(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
            <button
              type="button"
              onClick={generateImage}
              disabled={imgLoading}
              className="w-full py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {imgLoading ? "🎨 ছবি তৈরি হচ্ছে (~15 সেকেন্ড)..." : "🎨 AI দিয়ে ছবি তৈরি করুন"}
            </button>
          </div>
        )}

        {aiImageUrl && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-600">তৈরি হওয়া ছবি:</p>
            <div className="relative aspect-square rounded-xl overflow-hidden border border-purple-200">
              <Image src={aiImageUrl} alt="AI generated" fill className="object-cover" />
            </div>
            <p className="text-xs text-gray-400">এই ছবি ক্যাম্পেইনে যোগ হবে ✓</p>
          </div>
        )}
      </div>

      {/* Campaign details */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
        <h2 className="font-semibold text-gray-900">ক্যাম্পেইন তথ্য</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">শিরোনাম *</label>
          <input {...register("title", { required: true })} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" placeholder="যেমন: ঈদ সেল ২০২৬" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">পোস্ট ক্যাপশন</label>
          <textarea {...register("description")} rows={5} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none" placeholder="AI দিয়ে তৈরি করুন অথবা নিজে লিখুন..." />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">বাজেট</label>
            <input {...register("budget")} type="number" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" placeholder="5000" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">মুদ্রা</label>
            <select {...register("currency")} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="BDT">BDT ৳</option>
              <option value="USD">USD $</option>
            </select>
          </div>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">{error}</div>}

      <div className="flex gap-3">
        <button type="button" onClick={() => router.back()} className="flex-1 py-3 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50">বাতিল</button>
        <button type="submit" disabled={loading} className="flex-1 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50">
          {loading ? "তৈরি হচ্ছে..." : "ক্যাম্পেইন তৈরি করুন"}
        </button>
      </div>
    </form>
  )
}
