import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center text-white">
        <div className="mb-8">
          <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-4xl">
            🏪
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">BizProfile</h1>
          <p className="text-xl text-blue-100 mb-2">
            আপনার ব্যবসার ডিজিটাল প্রোফাইল তৈরি করুন
          </p>
          <p className="text-blue-200 text-sm">
            Products • Services • Location — সব এক জায়গায়
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/register"
            className="px-8 py-3 bg-white text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transition-colors"
          >
            শুরু করুন — বিনামূল্যে
          </Link>
          <Link
            href="/login"
            className="px-8 py-3 bg-white/20 text-white font-semibold rounded-xl hover:bg-white/30 transition-colors border border-white/30"
          >
            লগইন করুন
          </Link>
        </div>

        <div className="mt-16 grid grid-cols-3 gap-6 text-center">
          {[
            { icon: "📦", label: "প্রোডাক্ট আপলোড" },
            { icon: "📍", label: "লোকেশন সেটআপ" },
            { icon: "📊", label: "ক্যাম্পেইন রেডি" },
          ].map((f) => (
            <div key={f.label} className="bg-white/10 rounded-xl p-4">
              <div className="text-3xl mb-2">{f.icon}</div>
              <p className="text-sm text-blue-100">{f.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
