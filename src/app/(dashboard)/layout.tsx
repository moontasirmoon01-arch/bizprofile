import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar userName={session.user.name || session.user.email} />
      <main className="md:ml-56 pb-24 md:pb-0">
        <div className="max-w-3xl mx-auto px-4 py-8">{children}</div>
      </main>
    </div>
  );
}
