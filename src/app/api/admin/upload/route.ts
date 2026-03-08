import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import crypto from "crypto";
import { logAdminAction } from "@/lib/audit";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

// POST /api/admin/upload — Upload image(s)
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const files = formData.getAll("files") as File[];

    if (!files.length) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    // Ensure upload directory exists
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const uploaded: string[] = [];
    const errors: string[] = [];

    for (const file of files) {
      // Validate type
      if (!ALLOWED_TYPES.includes(file.type)) {
        errors.push(`${file.name}: Invalid type (${file.type}). Allowed: JPEG, PNG, WebP, GIF, AVIF`);
        continue;
      }

      // Validate size
      if (file.size > MAX_SIZE) {
        errors.push(`${file.name}: Too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max: 5MB`);
        continue;
      }

      // Generate unique filename preserving extension
      const ext = path.extname(file.name).toLowerCase() || ".jpg";
      const uniqueName = `${crypto.randomUUID()}${ext}`;

      // Write file
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const filePath = path.join(uploadDir, uniqueName);
      await writeFile(filePath, buffer);

      // Return the public URL path
      uploaded.push(`/uploads/${uniqueName}`);
    }

    if (uploaded.length > 0) {
      await logAdminAction({ action: "UPLOAD", entity: "Upload", details: { fileCount: uploaded.length, files: uploaded } });
    }

    return NextResponse.json({
      urls: uploaded,
      errors: errors.length > 0 ? errors : undefined,
      count: uploaded.length,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
