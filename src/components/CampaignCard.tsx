"use client"
import { useState } from "react"

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "ড্রাফট", ACTIVE: "সক্রিয়", PAUSED: "বিরতি", COMPLETED: "সম্পন্ন",
}
const PLATFORM_ICONS: Record<string, string> = {
  META: "📘", GOOGLE: "🔴", YOUTUBE: "▶️", TIKTOK: "🎵", INSTAGRAM: "📸",
}

const STATUS_COLORS: Record<string, string> = {
  published: "text-green-600",
  failed: "text-red-500",
}

export function CampaignCard({ campaign }: { campaign: any }) {
  const [publishing, setPublishing] = useState(false)
  const [result, setResult] = useState<string>("")

  async function handlePublish() {
    setPublishing(true)
    const res = await fetch(`/api/campaigns/${campaign.id}/publish`, { method: "POST" })
    const data = await res.json()
    setResult(data.results?.map((r: any) => `${PLATFORM_ICONS[r.platform] ?? r.platform} ${r.status === "published" ? "✓" : "✗"}`).join("  ") || "সম্পন্ন")
    setPublishing(false)
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-gray-900">{campaign.title}</h3>
          {campaign.description && (
            <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{campaign.description}</p>
          )}
        </div>
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
          campaign.status === "ACTIVE" ? "bg-green-100 text-green-700" :
          campaign.status === "DRAFT" ? "bg-gray-100 text-gray-600" :
          "bg-yellow-100 text-yellow-700"
        }`}>
          {STATUS_LABELS[campaign.status] ?? campaign.status}
        </span>
      </div>

      <div className="flex items-center gap-2 mb-4">
        {campaign.platforms.map((p: string) => (
          <span key={p} className="text-lg" title={p}>{PLATFORM_ICONS[p]}</span>
        ))}
        {campaign.budget && (
          <span className="ml-auto text-sm font-medium text-gray-600">
            {campaign.currency} {campaign.budget.toLocaleString()}
          </span>
        )}
      </div>

      {result && (
        <div className="mb-3 text-xs text-green-600 bg-green-50 rounded-lg px-3 py-2">{result}</div>
      )}

      <div className="flex gap-2">
        {campaign.status === "DRAFT" && (
          <button
            onClick={handlePublish}
            disabled={publishing}
            className="flex-1 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50"
          >
            {publishing ? "প্রকাশ হচ্ছে..." : "📢 প্রকাশ করুন"}
          </button>
        )}
        <div className="flex-1 text-center text-xs text-gray-400 py-2">
          {campaign.posts.length}টি প্ল্যাটফর্মে পোস্ট
        </div>
      </div>
    </div>
  )
}
