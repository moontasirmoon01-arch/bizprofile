import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { productSchema } from "@/lib/validations";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const business = await db.business.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  if (!business) {
    return NextResponse.json({ error: "Setup business profile first" }, { status: 404 });
  }

  const products = await db.product.findMany({
    where: { businessId: business.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(products);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const business = await db.business.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  if (!business) {
    return NextResponse.json({ error: "Setup business profile first" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = productSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const product = await db.product.create({
    data: {
      businessId: business.id,
      ...parsed.data,
      images: body.images ?? [],
    },
  });

  return NextResponse.json(product, { status: 201 });
}
