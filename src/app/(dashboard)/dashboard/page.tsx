import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";

const PLATFORM_ICONS: Record<string, string> = {
  META: "📘", GOOGLE: "🔴", YOUTUBE: "▶️", TIKTOK: "🎵",
}

export default async function DashboardPage() {
  const session = await auth();
  const business = await db.business.findUnique({
    where: { userId: session!.user.id },
    include: {
      address: true,
      _count: { select: { products: true, services: true, campaigns: true } },
      connections: { select: { platform: true } },
    },
  });

  const recentCampaigns = business ? await db.campaign.findMany({
    where: { businessId: business.id },
    orderBy: { createdAt: "desc" },
    take: 3,
    include: { _count: { select: { posts: true } } },
  }) : []

  const publishedPosts = business ? await db.campaignPost.count({
    where: { campaign: { businessId: business.id }, status: "PUBLISHED" },
  }) : 0

  const setupComplete = !!business;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          স্বাগতম, {session?.user?.name?.split(" ")[0] || "বন্ধু"} 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1">আপনার ব্যবসার ওভারভিউ</p>
      </div>

      {!setupComplete && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 flex items-center justify-between">
          <div>
            <p className="font-semibold text-blue-800">প্রোফাইল সেটআপ করুন</p>
            <p className="text-blue-600 text-sm mt-1">আপনার বিজনেস প্রোফাইল এখনো তৈরি হয়নি</p>
          </div>
          <Link href="/profile" className="px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors whitespace-nowrap">
            এখনই সেটআপ করুন →
          </Link>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "প্রোডাক্ট", value: business?._count.products ?? 0, icon: "📦", href: "/products" },
          { label: "ক্যাম্পেইন", value: business?._count.campaigns ?? 0, icon: "📢", href: "/campaigns" },
          { label: "প্রকাশিত পোস্ট", value: publishedPosts, icon: "✅", href: "/campaigns" },
          { label: "কানেক্টেড", value: business?.connections.length ?? 0, icon: "🔗", href: "/connect" },
        ].map((stat) => (
          <Link key={stat.label} href={stat.href} className="bg-white rounded-2xl border border-gray-100 p-5 hover:border-blue-200 hover:shadow-sm transition-all">
            <div className="text-2xl mb-2">{stat.icon}</div>
            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
          </Link>
        ))}
      </div>

      {business?.connections && business.connections.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-900 mb-3">কানেক্টেড প্ল্যাটফর্ম</h2>
          <div className="flex gap-3">
            {business.connections.map(c => (
              <span key={c.platform} className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 font-medium">
                {PLATFORM_ICONS[c.platform]} {c.platform}
              </span>
            ))}
          </div>
        </div>
      )}

      {recentCampaigns.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">সাম্প্রতিক ক্যাম্পেইন</h2>
            <Link href="/campaigns" className="text-sm text-blue-600 hover:underline">সব দেখুন →</Link>
          </div>
          <div className="space-y-3">
            {recentCampaigns.map(c => (
              <div key={c.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">{c.title}</p>
                  <p className="text-xs text-gray-400">{c._count.posts}টি পোস্ট</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  c.status === "ACTIVE" ? "bg-green-100 text-green-700" :
                  c.status === "DRAFT" ? "bg-gray-100 text-gray-600" :
                  "bg-yellow-100 text-yellow-700"
                }`}>
                  {c.status === "ACTIVE" ? "সক্রিয়" : c.status === "DRAFT" ? "ড্রাফট" : c.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {setupComplete && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-900 mb-3">বিজনেস সারসংক্ষেপ</h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-gray-500">নাম:</span><span className="ml-2 font-medium text-gray-900">{business.name}</span></div>
            <div><span className="text-gray-500">ক্যাটেগরি:</span><span className="ml-2 font-medium text-gray-900">{business.category}</span></div>
            {business.address && <div><span className="text-gray-500">শহর:</span><span className="ml-2 font-medium text-gray-900">{business.address.city}</span></div>}
            {business.phone && <div><span className="text-gray-500">ফোন:</span><span className="ml-2 font-medium text-gray-900">{business.phone}</span></div>}
          </div>
          <Link href="/profile" className="mt-3 inline-block text-blue-600 text-sm font-medium hover:underline">প্রোফাইল সম্পাদনা করুন →</Link>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/campaigns/new" className="bg-white rounded-2xl border border-gray-100 p-5 hover:border-blue-200 hover:shadow-sm transition-all group">
          <div className="text-2xl mb-2">📢</div>
          <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">নতুন ক্যাম্পেইন</h3>
          <p className="text-sm text-gray-500 mt-1">সোশ্যাল মিডিয়ায় পোস্ট প্রকাশ করুন</p>
        </Link>
        <Link href="/products/new" className="bg-white rounded-2xl border border-gray-100 p-5 hover:border-blue-200 hover:shadow-sm transition-all group">
          <div className="text-2xl mb-2">➕</div>
          <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">নতুন প্রোডাক্ট</h3>
          <p className="text-sm text-gray-500 mt-1">প্রোডাক্টের ছবি, দাম এবং বিবরণ আপলোড করুন</p>
        </Link>
      </div>
    </div>
  );
}
