"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Product } from "@/generated/prisma/client";

export function ProductCard({ product }: { product: Product }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm(`"${product.name}" ডিলিট করবেন?`)) return;
    setDeleting(true);

    await fetch(`/api/products/${product.id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-sm transition-shadow">
      <div className="aspect-square bg-gray-100 relative">
        {product.images[0] ? (
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl text-gray-300">
            📦
          </div>
        )}
        {!product.inStock && (
          <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
            স্টক নেই
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-gray-900 truncate">{product.name}</h3>
        {product.category && (
          <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
            {product.category}
          </span>
        )}
        {product.description && (
          <p className="text-sm text-gray-500 mt-1.5 line-clamp-2">
            {product.description}
          </p>
        )}
        <div className="flex items-center justify-between mt-3">
          <span className="font-bold text-gray-900">
            {product.currency} {product.price.toLocaleString("bn-BD")}
          </span>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded-lg transition-colors disabled:opacity-50"
          >
            {deleting ? "..." : "মুছুন"}
          </button>
        </div>
      </div>
    </div>
  );
}
