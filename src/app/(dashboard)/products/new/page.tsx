import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { ProductUploadForm } from "@/components/ProductUploadForm";

export default async function NewProductPage() {
  const session = await auth();

  const business = await db.business.findUnique({
    where: { userId: session!.user.id },
    select: { id: true },
  });

  if (!business) redirect("/profile");

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">নতুন প্রোডাক্ট</h1>
        <p className="text-gray-500 text-sm mt-1">
          প্রোডাক্টের তথ্য এবং ছবি যোগ করুন
        </p>
      </div>
      <ProductUploadForm />
    </div>
  );
}
