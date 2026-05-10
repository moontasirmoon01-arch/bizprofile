"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { SignOutButton } from "./SignOutButton"

const NAV = [
  { href: "/dashboard", label: "ড্যাশবোর্ড", icon: "🏠" },
  { href: "/profile", label: "বিজনেস প্রোফাইল", icon: "🏪" },
  { href: "/products", label: "প্রোডাক্ট", icon: "📦" },
  { href: "/connect", label: "প্ল্যাটফর্ম", icon: "🔗" },
  { href: "/campaigns", label: "ক্যাম্পেইন", icon: "📢" },
]

export function Sidebar({ userName }: { userName?: string | null }) {
  const pathname = usePathname()

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 h-full w-56 bg-white border-r border-gray-100 z-20">
        <div className="px-5 py-4 border-b border-gray-100">
          <Link href="/dashboard" className="text-lg font-bold text-blue-600">🏪 BizProfile</Link>
        </div>
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {NAV.map(item => {
            const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  active ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="p-4 border-t border-gray-100 space-y-2">
          {userName && <p className="text-xs text-gray-400 truncate px-1">{userName}</p>}
          <SignOutButton />
        </div>
      </aside>

      {/* Mobile bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-20 flex safe-area-inset-bottom">
        {NAV.map(item => {
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-xs font-medium transition-colors ${
                active ? "text-blue-600" : "text-gray-400"
              }`}
            >
              <span className="text-xl leading-none">{item.icon}</span>
              <span>{item.label.split(" ")[0]}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
