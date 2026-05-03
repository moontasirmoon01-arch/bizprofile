import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();
  const business = await db.business.findUnique({
    where: { userId: session!.user.id },
    include: { address: true, _count: { select: { products: true, services: true } } },
  });

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
            <p className="text-blue-600 text-sm mt-1">
              আপনার বিজনেস প্রোফাইল এখনো তৈরি হয়নি
            </p>
          </div>
          <Link
            href="/profile"
            className="px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors whitespace-nowrap"
          >
            এখনই সেটআপ করুন →
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: "প্রোডাক্ট",
            value: business?._count.products ?? 0,
            icon: "📦",
            href: "/products",
          },
          {
            label: "সার্ভিস",
            value: business?._count.services ?? 0,
            icon: "🔧",
            href: "/products",
          },
          {
            label: "প্রোফাইল স্ট্যাটাস",
            value: setupComplete ? "সম্পূর্ণ ✓" : "অসম্পূর্ণ",
            icon: "🏪",
            href: "/profile",
          },
        ].map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="bg-white rounded-2xl border border-gray-100 p-6 hover:border-blue-200 hover:shadow-sm transition-all"
          >
            <div className="text-2xl mb-3">{stat.icon}</div>
            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
          </Link>
        ))}
      </div>

      {setupComplete && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">বিজনেস সারসংক্ষেপ</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">নাম:</span>
              <span className="ml-2 font-medium text-gray-900">{business.name}</span>
            </div>
            <div>
              <span className="text-gray-500">ক্যাটেগরি:</span>
              <span className="ml-2 font-medium text-gray-900">{business.category}</span>
            </div>
            {business.address && (
              <div>
                <span className="text-gray-500">শহর:</span>
                <span className="ml-2 font-medium text-gray-900">
                  {business.address.city}
                </span>
              </div>
            )}
            {business.phone && (
              <div>
                <span className="text-gray-500">ফোন:</span>
                <span className="ml-2 font-medium text-gray-900">{business.phone}</span>
              </div>
            )}
          </div>
          <Link
            href="/profile"
            className="mt-4 inline-block text-blue-600 text-sm font-medium hover:underline"
          >
            প্রোফাইল সম্পাদনা করুন →
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/profile"
          className="bg-white rounded-2xl border border-gray-100 p-6 hover:border-blue-200 hover:shadow-sm transition-all group"
        >
          <div className="text-2xl mb-3">🏪</div>
          <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">
            বিজনেস প্রোফাইল
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            আপনার ব্যবসার তথ্য, লোকেশন এবং যোগাযোগ আপডেট করুন
          </p>
        </Link>
        <Link
          href="/products/new"
          className="bg-white rounded-2xl border border-gray-100 p-6 hover:border-blue-200 hover:shadow-sm transition-all group"
        >
          <div className="text-2xl mb-3">➕</div>
          <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">
            নতুন প্রোডাক্ট যোগ করুন
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            প্রোডাক্টের ছবি, দাম এবং বিবরণ আপলোড করুন
          </p>
        </Link>
      </div>
    </div>
  );
}
