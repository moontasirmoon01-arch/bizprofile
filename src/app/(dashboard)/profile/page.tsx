import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { BusinessProfileForm } from "@/components/BusinessProfileForm";

export default async function ProfilePage() {
  const session = await auth();
  const business = await db.business.findUnique({
    where: { userId: session!.user.id },
    include: { address: true },
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">বিজনেস প্রোফাইল</h1>
        <p className="text-gray-500 text-sm mt-1">
          আপনার ব্যবসার তথ্য পূরণ করুন
        </p>
      </div>
      <BusinessProfileForm initialData={business} />
    </div>
  );
}
