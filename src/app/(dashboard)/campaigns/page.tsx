import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import Link from "next/link"
import { CampaignCard } from "@/components/CampaignCard"

export default async function CampaignsPage() {
  const session = await auth()
  const business = await db.business.findUnique({
    where: { userId: session!.user.id },
    include: {
      connections: { select: { platform: true } },
    },
  })

  const campaigns = business ? await db.campaign.findMany({
    where: { businessId: business.id },
    include: { posts: true },
    orderBy: { createdAt: "desc" },
  }) : []

  const connectedPlatforms = (business?.connections ?? []).map(c => c.platform)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ক্যাম্পেইন</h1>
          <p className="text-gray-500 text-sm mt-1">মোট {campaigns.length}টি ক্যাম্পেইন</p>
        </div>
        <Link
          href="/campaigns/new"
          className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700"
        >
          + নতুন ক্যাম্পেইন
        </Link>
      </div>

      {connectedPlatforms.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm">
          <span className="text-yellow-700">কোনো প্ল্যাটফর্ম কানেক্ট নেই। </span>
          <Link href="/connect" className="text-blue-600 font-medium hover:underline">
            প্ল্যাটফর্ম কানেক্ট করুন →
          </Link>
        </div>
      )}

      {campaigns.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <div className="text-5xl mb-4">📢</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">কোনো ক্যাম্পেইন নেই</h2>
          <Link href="/campaigns/new" className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700">
            প্রথম ক্যাম্পেইন তৈরি করুন
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {campaigns.map(c => <CampaignCard key={c.id} campaign={c as any} />)}
        </div>
      )}
    </div>
  )
}
