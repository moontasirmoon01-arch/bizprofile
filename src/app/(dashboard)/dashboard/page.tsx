import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";

const PLATFORM_ICONS: Record<string, string> = {
  META: "📘", GOOGLE: "🔴", YOUTUBE: "▶️", TIKTOK: "🎵",
}

const PLATFORM_NAMES: Record<string, string> = {
  META: "Facebook + Instagram", GOOGLE: "Google", YOUTUBE: "YouTube", TIKTOK: "TikTok",
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

  const hasProfile = !!business;
  const hasConnection = (business?.connections.length ?? 0) > 0;
  const hasProduct = (business?._count.products ?? 0) > 0;
  const hasCampaign = (business?._count.campaigns ?? 0) > 0;
  const onboardingDone = hasProfile && hasConnection && hasProduct && hasCampaign;

  const steps = [
    { done: hasProfile, label: "বিজনেস প্রোফাইল তৈরি করুন", href: "/profile" },
    { done: hasConnection, label: "সোশ্যাল মিডিয়া কানেক্ট করুন", href: "/connect" },
    { done: hasProduct, label: "প্রোডাক্ট যোগ করুন", href: "/products/new" },
    { done: hasCampaign, label: "প্রথম ক্যাম্পেইন তৈরি করুন", href: "/campaigns/new" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          স্বাগতম, {session?.user?.name?.split(" ")[0] || "বন্ধু"} 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1">আপনার ব্যবসার ওভারভিউ</p>
      </div>

      {/* Onboarding checklist */}
      {!onboardingDone && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-900 mb-1">শুরু করুন</h2>
          <p className="text-sm text-gray-400 mb-4">এই ধাপগুলো সম্পন্ন করে আপনার ব্যবসা পরিচালনা শুরু করুন</p>
          <div className="space-y-2">
            {steps.map((step, i) => (
              <Link
                key={i}
                href={step.done ? "#" : step.href}
                className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                  step.done ? "opacity-50 cursor-default" : "hover:bg-blue-50 group"
                }`}
              >
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  step.done ? "bg-green-100 text-green-600" : "bg-blue-100 text-blue-600"
                }`}>
                  {step.done ? "✓" : i + 1}
                </span>
                <span className={`text-sm font-medium ${step.done ? "text-gray-400 line-through" : "text-gray-700 group-hover:text-blue-600"}`}>
                  {step.label}
                </span>
                {!step.done && <span className="ml-auto text-blue-400 text-xs">→</span>}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Stats grid */}
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

      {/* Connected platforms */}
      {business?.connections && business.connections.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900">কানেক্টেড প্ল্যাটফর্ম</h2>
            <Link href="/connect" className="text-xs text-blue-600 hover:underline">ম্যানেজ করুন →</Link>
          </div>
          <div className="flex flex-wrap gap-2">
            {business.connections.map(c => (
              <span key={c.platform} className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-full text-sm text-green-700 font-medium">
                {PLATFORM_ICONS[c.platform]} {PLATFORM_NAMES[c.platform] ?? c.platform}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Recent campaigns */}
      {recentCampaigns.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">সাম্প্রতিক ক্যাম্পেইন</h2>
            <Link href="/campaigns" className="text-sm text-blue-600 hover:underline">সব দেখুন →</Link>
          </div>
          <div className="space-y-1">
            {recentCampaigns.map(c => (
              <div key={c.id} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">{c.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{c._count.posts}টি পোস্ট</p>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
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

      {/* Quick actions */}
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
