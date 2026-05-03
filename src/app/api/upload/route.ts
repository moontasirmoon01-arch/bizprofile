import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getUploadUrl } from "@/lib/storage";
import { randomUUID } from "crypto";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { filename, contentType } = await req.json();

  if (!filename || !contentType) {
    return NextResponse.json({ error: "filename and contentType required" }, { status: 400 });
  }

  const ext = filename.split(".").pop();
  const path = `${session.user.id}/${randomUUID()}.${ext}`;

  const { url, key } = await getUploadUrl(path);

  return NextResponse.json({ url, key });
}
