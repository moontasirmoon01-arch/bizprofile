import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { ConnectPlatformCard } from "@/components/ConnectPlatformCard"

const PLATFORMS = [
  {
    id: "META",
    name: "Facebook + Instagram",
    icon: "📘",
    description: "পেজে পোস্ট করুন, বিজ্ঞাপন চালান",
    color: "blue",
    envKeys: ["META_APP_ID", "META_APP_SECRET"],
  },
  {
    id: "GOOGLE",
    name: "Google Business + YouTube",
    icon: "🔴",
    description: "Google Business Profile আপডেট, YouTube পোস্ট",
    color: "red",
    envKeys: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"],
  },
  {
    id: "TIKTOK",
    name: "TikTok for Business",
    icon: "🎵",
    description: "TikTok ক্যাম্পেইন তৈরি করুন",
    color: "gray",
    envKeys: ["TIKTOK_APP_ID", "TIKTOK_APP_SECRET"],
  },
]

const ERROR_MESSAGES: Record<string, string> = {
  missing_params: "Facebook থেকে code পাওয়া যায়নি।",
  no_business: "বিজনেস প্রোফাইল পাওয়া যায়নি।",
  exchange_failed: "Token exchange ব্যর্থ হয়েছে। App permissions বা redirect URI চেক করুন।",
  access_denied: "অনুমতি দেওয়া হয়নি। আবার চেষ্টা করুন।",
}

export default async function ConnectPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>
}) {
  const { success, error } = await searchParams
  const session = await auth()
  const business = await db.business.findUnique({
    where: { userId: session!.user.id },
    include: { connections: { select: { platform: true, createdAt: true, pageId: true } } },
  })

  const connectedMap = Object.fromEntries(
    (business?.connections ?? []).map(c => [c.platform, c])
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">প্ল্যাটফর্ম কানেক্ট করুন</h1>
        <p className="text-gray-500 text-sm mt-1">
          সোশ্যাল মিডিয়া অ্যাকাউন্ট সংযুক্ত করে এক জায়গা থেকে সব ম্যানেজ করুন
        </p>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700">
          ✓ <strong>{success.toUpperCase()}</strong> সফলভাবে সংযুক্ত হয়েছে!
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          <strong>Error:</strong> {ERROR_MESSAGES[error] ?? error}
        </div>
      )}

      {!business && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-700">
          প্ল্যাটফর্ম কানেক্ট করতে আগে বিজনেস প্রোফাইল সম্পন্ন করুন।
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {PLATFORMS.map(platform => (
          <ConnectPlatformCard
            key={platform.id}
            platform={platform}
            connected={!!connectedMap[platform.id]}
            connectedAt={connectedMap[platform.id]?.createdAt?.toISOString()}
            disabled={!business}
          />
        ))}
      </div>

    </div>
  )
}
