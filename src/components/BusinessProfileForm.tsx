"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { businessSchema, type BusinessInput } from "@/lib/validations";

const CATEGORIES = [
  "রেস্টুরেন্ট / খাবার",
  "কাপড় / ফ্যাশন",
  "ইলেকট্রনিক্স",
  "সৌন্দর্য / পার্লার",
  "মুদিখানা / সুপারশপ",
  "ওষুধ / ফার্মেসি",
  "ফার্নিচার",
  "শিক্ষা / কোচিং",
  "স্বাস্থ্যসেবা",
  "নির্মাণ / হোম সার্ভিস",
  "পরিবহন",
  "অন্যান্য",
];

interface Props {
  initialData: {
    name: string;
    category: string;
    description?: string | null;
    phone?: string | null;
    email?: string | null;
    website?: string | null;
    address?: {
      city: string;
      street?: string | null;
      state?: string | null;
      postalCode?: string | null;
    } | null;
  } | null;
}

export function BusinessProfileForm({ initialData }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useForm<BusinessInput>({
    resolver: zodResolver(businessSchema) as any,
    defaultValues: {
      name: initialData?.name ?? "",
      category: initialData?.category ?? "",
      description: initialData?.description ?? "",
      phone: initialData?.phone ?? "",
      email: initialData?.email ?? "",
      website: initialData?.website ?? "",
      city: initialData?.address?.city ?? "",
      street: initialData?.address?.street ?? "",
      state: initialData?.address?.state ?? "",
      postalCode: initialData?.address?.postalCode ?? "",
      country: "Bangladesh",
    },
  });

  async function onSubmit(data: BusinessInput) {
    setLoading(true);
    setError("");
    setSuccess(false);

    const res = await fetch("/api/business", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const json = await res.json();

    if (!res.ok) {
      setError(json.error || "সংরক্ষণ ব্যর্থ হয়েছে");
    } else {
      setSuccess(true);
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
        <h2 className="font-semibold text-gray-900">মূল তথ্য</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ব্যবসার নাম <span className="text-red-500">*</span>
          </label>
          <input
            {...register("name")}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            placeholder="যেমন: রহিম স্টোর"
          />
          {errors.name && (
            <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ক্যাটেগরি <span className="text-red-500">*</span>
          </label>
          <select
            {...register("category")}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
          >
            <option value="">ক্যাটেগরি বেছে নিন</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          {errors.category && (
            <p className="text-red-500 text-xs mt-1">{errors.category.message}</p>
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
            placeholder="আপনার ব্যবসা সম্পর্কে সংক্ষেপে লিখুন..."
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
        <h2 className="font-semibold text-gray-900">যোগাযোগ তথ্য</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ফোন নম্বর
            </label>
            <input
              {...register("phone")}
              type="tel"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="01XXXXXXXXX"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ইমেইল
            </label>
            <input
              {...register("email")}
              type="email"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="business@example.com"
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ওয়েবসাইট
          </label>
          <input
            {...register("website")}
            type="url"
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            placeholder="https://yoursite.com"
          />
          {errors.website && (
            <p className="text-red-500 text-xs mt-1">{errors.website.message}</p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
        <h2 className="font-semibold text-gray-900">ঠিকানা</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            শহর <span className="text-red-500">*</span>
          </label>
          <input
            {...register("city")}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            placeholder="ঢাকা"
          />
          {errors.city && (
            <p className="text-red-500 text-xs mt-1">{errors.city.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            রাস্তা / এলাকা
          </label>
          <input
            {...register("street")}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            placeholder="মিরপুর ১০, ঢাকা"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              জেলা / বিভাগ
            </label>
            <input
              {...register("state")}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="ঢাকা বিভাগ"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              পোস্টকোড
            </label>
            <input
              {...register("postalCode")}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="1216"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700">
          ✓ প্রোফাইল সফলভাবে সংরক্ষিত হয়েছে
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
      >
        {loading ? "সংরক্ষণ হচ্ছে..." : "প্রোফাইল সংরক্ষণ করুন"}
      </button>
    </form>
  );
}
