"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"

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
}: {
  products: Product[]
  connectedPlatforms: string[]
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])

  const { register, handleSubmit } = useForm()

  function toggleProduct(id: string) {
    setSelectedProducts(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])
  }
  function togglePlatform(p: string) {
    setSelectedPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])
  }

  async function onSubmit(data: any) {
    if (selectedPlatforms.length === 0) { setError("কমপক্ষে একটি প্ল্যাটফর্ম বেছে নিন"); return }
    setLoading(true)
    setError("")
    const res = await fetch("/api/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, productIds: selectedProducts, platforms: selectedPlatforms }),
    })
    const json = await res.json()
    if (!res.ok) { setError(json.error); setLoading(false); return }
    router.push("/campaigns")
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
        <h2 className="font-semibold text-gray-900">ক্যাম্পেইন তথ্য</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">শিরোনাম *</label>
          <input {...register("title", { required: true })} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" placeholder="যেমন: ঈদ সেল ২০২৬" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">বিবরণ</label>
          <textarea {...register("description")} rows={3} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none" placeholder="ক্যাম্পেইন সম্পর্কে..." />
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

      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">প্ল্যাটফর্ম বেছে নিন</h2>
        {connectedPlatforms.length === 0 ? (
          <p className="text-sm text-gray-400">কোনো প্ল্যাটফর্ম কানেক্ট নেই।</p>
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
