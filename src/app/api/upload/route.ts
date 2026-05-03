import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { randomUUID } from "crypto";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const ext = file.name.split(".").pop();
  const path = `${session.user.id}/${randomUUID()}.${ext}`;
  const bucket = "product-images";
  const supabaseUrl = process.env.SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const bytes = await file.arrayBuffer();

  const res = await fetch(`${supabaseUrl}/storage/v1/object/${bucket}/${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": file.type,
    },
    body: bytes,
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("Supabase upload error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }

  const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
  return NextResponse.json({ url: publicUrl });
}
