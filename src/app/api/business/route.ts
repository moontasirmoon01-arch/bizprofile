import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { businessSchema } from "@/lib/validations";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const business = await db.business.findUnique({
    where: { userId: session.user.id },
    include: { address: true },
  });

  return NextResponse.json(business);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = businessSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const { city, street, state, country, postalCode, ...bizData } = parsed.data;

  const existing = await db.business.findUnique({
    where: { userId: session.user.id },
  });

  if (existing) {
    const updated = await db.business.update({
      where: { userId: session.user.id },
      data: {
        ...bizData,
        address: {
          upsert: {
            create: { city, street, state, country, postalCode },
            update: { city, street, state, country, postalCode },
          },
        },
      },
      include: { address: true },
    });
    return NextResponse.json(updated);
  }

  const business = await db.business.create({
    data: {
      userId: session.user.id,
      ...bizData,
      address: {
        create: { city, street, state, country, postalCode },
      },
    },
    include: { address: true },
  });

  return NextResponse.json(business, { status: 201 });
}
