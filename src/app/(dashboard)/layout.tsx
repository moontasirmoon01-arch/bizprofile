import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { SignOutButton } from "@/components/SignOutButton";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="text-xl font-bold text-blue-600">
              🏪 BizProfile
            </Link>
            <div className="hidden md:flex items-center gap-6 text-sm font-medium">
              <Link
                href="/dashboard"
                className="text-gray-600 hover:text-blue-600 transition-colors"
              >
                ড্যাশবোর্ড
              </Link>
              <Link
                href="/profile"
                className="text-gray-600 hover:text-blue-600 transition-colors"
              >
                বিজনেস প্রোফাইল
              </Link>
              <Link
                href="/products"
                className="text-gray-600 hover:text-blue-600 transition-colors"
              >
                প্রোডাক্ট
              </Link>
              <Link
                href="/connect"
                className="text-gray-600 hover:text-blue-600 transition-colors"
              >
                প্ল্যাটফর্ম
              </Link>
              <Link
                href="/campaigns"
                className="text-gray-600 hover:text-blue-600 transition-colors"
              >
                ক্যাম্পেইন
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500 hidden sm:block">
              {session.user.name || session.user.email}
            </span>
            <SignOutButton />
          </div>
        </div>
      </nav>
      <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
