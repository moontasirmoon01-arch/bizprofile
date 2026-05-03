"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { productSchema, type ProductInput } from "@/lib/validations";
import Image from "next/image";

const PRODUCT_CATEGORIES = [
  "খাবার / পানীয়",
  "কাপড় / পোশাক",
  "ইলেকট্রনিক্স",
  "সৌন্দর্য পণ্য",
  "গৃহস্থালি",
  "বই / শিক্ষা",
  "খেলনা",
  "স্বাস্থ্য পণ্য",
  "অন্যান্য",
];

export function ProductUploadForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useForm<ProductInput>({ resolver: zodResolver(productSchema) as any });

  async function handleImageUpload(files: FileList) {
    setUploading(true);
    const uploaded: string[] = [];

    for (const file of Array.from(files)) {
      if (file.size > 5 * 1024 * 1024) {
        setError(`${file.name} অনেক বড়। সর্বোচ্চ ৫MB।`);
        continue;
      }

      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, contentType: file.type }),
      });

      if (!res.ok) {
        setError("ছবি আপলোড ব্যর্থ হয়েছে");
        continue;
      }

      const { url, key } = await res.json();

      await fetch(url, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-images/${key}`;
      uploaded.push(publicUrl);
    }

    setImages((prev) => [...prev, ...uploaded]);
    setUploading(false);
  }

  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  async function onSubmit(data: ProductInput) {
    setLoading(true);
    setError("");

    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, images }),
    });

    const json = await res.json();

    if (!res.ok) {
      setError(json.error || "প্রোডাক্ট সংরক্ষণ ব্যর্থ হয়েছে");
    } else {
      router.push("/products");
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
        <h2 className="font-semibold text-gray-900">ছবি আপলোড</h2>

        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-colors"
        >
          <div className="text-3xl mb-2">📷</div>
          <p className="text-sm font-medium text-gray-700">ছবি বেছে নিন</p>
          <p className="text-xs text-gray-400 mt-1">JPG, PNG — সর্বোচ্চ ৫MB প্রতিটি</p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
        />

        {uploading && (
          <p className="text-sm text-blue-600 text-center animate-pulse">
            ছবি আপলোড হচ্ছে...
          </p>
        )}

        {images.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {images.map((img, i) => (
              <div key={i} className="relative aspect-square rounded-xl overflow-hidden group">
                <Image src={img} alt={`Product ${i + 1}`} fill className="object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
        <h2 className="font-semibold text-gray-900">প্রোডাক্টের তথ্য</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            প্রোডাক্টের নাম <span className="text-red-500">*</span>
          </label>
          <input
            {...register("name")}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            placeholder="যেমন: কটন শার্ট"
          />
          {errors.name && (
            <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            বিবরণ
          </label>
          <textarea
            {...register("description")}
            rows={3}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
            placeholder="প্রোডাক্ট সম্পর্কে বিস্তারিত লিখুন..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              দাম <span className="text-red-500">*</span>
            </label>
            <div className="flex">
              <select
                {...register("currency")}
                className="px-3 py-2.5 border border-r-0 border-gray-200 rounded-l-xl bg-gray-50 text-sm focus:outline-none"
              >
                <option value="BDT">৳</option>
                <option value="USD">$</option>
              </select>
              <input
                {...register("price")}
                type="number"
                step="0.01"
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-r-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="0.00"
              />
            </div>
            {errors.price && (
              <p className="text-red-500 text-xs mt-1">{errors.price.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ক্যাটেগরি
            </label>
            <select
              {...register("category")}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
            >
              <option value="">বেছে নিন</option>
              {PRODUCT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input
            {...register("inStock")}
            type="checkbox"
            id="inStock"
            defaultChecked
            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="inStock" className="text-sm text-gray-700">
            স্টকে আছে
          </label>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 py-3 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
        >
          বাতিল
        </button>
        <button
          type="submit"
          disabled={loading || uploading}
          className="flex-1 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {loading ? "সংরক্ষণ হচ্ছে..." : "প্রোডাক্ট সংরক্ষণ করুন"}
        </button>
      </div>
    </form>
  );
}
