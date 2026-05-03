import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { NewCampaignForm } from "@/components/NewCampaignForm"

export default async function NewCampaignPage() {
  const session = await auth()
  const business = await db.business.findUnique({
    where: { userId: session!.user.id },
    include: {
      products: { select: { id: true, name: true, price: true, currency: true } },
      connections: { select: { platform: true } },
    },
  })

  if (!business) redirect("/profile")

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">নতুন ক্যাম্পেইন</h1>
        <p className="text-gray-500 text-sm mt-1">ক্যাম্পেইন তৈরি করে সব প্ল্যাটফর্মে প্রকাশ করুন</p>
      </div>
      <NewCampaignForm
        products={business.products}
        connectedPlatforms={business.connections.map(c => c.platform)}
      />
    </div>
  )
}
