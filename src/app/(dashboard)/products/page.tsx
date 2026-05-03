import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import type { Product } from "@/generated/prisma/client";
import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";

export default async function ProductsPage() {
  const session = await auth();

  const business = await db.business.findUnique({
    where: { userId: session!.user.id },
    select: { id: true },
  });

  if (!business) {
    return (
      <div className="text-center py-20">
        <div className="text-5xl mb-4">🏪</div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          আগে বিজনেস প্রোফাইল তৈরি করুন
        </h2>
        <p className="text-gray-500 text-sm mb-6">
          প্রোডাক্ট যোগ করতে আপনার প্রোফাইল সম্পন্ন করুন
        </p>
        <Link
          href="/profile"
          className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
        >
          প্রোফাইল সেটআপ করুন
        </Link>
      </div>
    );
  }

  const products = await db.product.findMany({
    where: { businessId: business.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">প্রোডাক্ট</h1>
          <p className="text-gray-500 text-sm mt-1">
            মোট {products.length}টি প্রোডাক্ট
          </p>
        </div>
        <Link
          href="/products/new"
          className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors"
        >
          + নতুন প্রোডাক্ট
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <div className="text-5xl mb-4">📦</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            কোনো প্রোডাক্ট নেই
          </h2>
          <p className="text-gray-500 text-sm mb-6">
            আপনার প্রথম প্রোডাক্ট যোগ করুন
          </p>
          <Link
            href="/products/new"
            className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
          >
            প্রোডাক্ট যোগ করুন
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product: Product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
