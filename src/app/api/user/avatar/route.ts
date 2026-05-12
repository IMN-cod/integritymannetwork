import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  optimizeImage,
  ALLOWED_MIME_TYPES,
} from "@/lib/image-optimizer";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const MAX_AVATAR_BYTES = 5 * 1024 * 1024; // 5MB

// POST /api/user/avatar — upload current user's avatar
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    // Accept either "file" or "files" for flexibility
    const file =
      (formData.get("file") as File | null) ||
      ((formData.getAll("files") as File[])[0] ?? null);

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Unsupported image type "${file.type}"` },
        { status: 400 }
      );
    }

    if (file.size > MAX_AVATAR_BYTES) {
      return NextResponse.json(
        { error: "Image must be 5MB or smaller" },
        { status: 400 }
      );
    }

    let url: string;
    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      const result = await optimizeImage(buffer, "avatar", UPLOAD_DIR);
      url = result.url;
    } catch (err) {
      console.error("[USER_AVATAR_UPLOAD] optimize failed", err);
      return NextResponse.json(
        { error: "Could not process image" },
        { status: 500 }
      );
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { avatar: url },
    });

    return NextResponse.json({ url, urls: [url] });
  } catch (error) {
    console.error("[USER_AVATAR_UPLOAD]", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
