import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { unlink } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { logAdminAction } from "@/lib/audit";
import {
  optimizeImage,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE,
  type ImageContext,
} from "@/lib/image-optimizer";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

const VALID_CONTEXTS = new Set<ImageContext>([
  "blog-cover", "blog-og", "product", "event-cover",
  "course-cover", "avatar", "rich-text", "general",
]);

function parseContext(raw: string | null): ImageContext {
  if (raw && VALID_CONTEXTS.has(raw as ImageContext)) return raw as ImageContext;
  return "general";
}

// ── POST /api/admin/upload?context=blog-cover ─────────────────────────
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const context = parseContext(req.nextUrl.searchParams.get("context"));
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];

    if (!files.length) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    const results = [];
    const errors: string[] = [];

    for (const file of files) {
      // Validate MIME type
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        errors.push(`${file.name}: unsupported type "${file.type}"`);
        continue;
      }

      // Validate raw size before buffering
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name}: too large (${(file.size / 1024 / 1024).toFixed(1)} MB — max 20 MB)`);
        continue;
      }

      try {
        const buffer = Buffer.from(await file.arrayBuffer());
        const result = await optimizeImage(buffer, context, UPLOAD_DIR);
        results.push(result);
      } catch (err) {
        errors.push(`${file.name}: ${err instanceof Error ? err.message : "processing failed"}`);
      }
    }

    if (results.length > 0) {
      await logAdminAction({
        action: "UPLOAD",
        entity: "Upload",
        details: {
          context,
          count: results.length,
          totalSavedBytes: results.reduce((s, r) => s + r.savedBytes, 0),
          urls: results.map((r) => r.url),
        },
      });
    }

    return NextResponse.json({
      // Legacy field — keeps RichTextEditor and any other consumers working
      urls: results.map((r) => r.url),
      // Full optimization metadata for the new ImageUpload component
      results,
      errors: errors.length > 0 ? errors : undefined,
      count: results.length,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

// ── DELETE /api/admin/upload?path=/uploads/xxx.webp ───────────────────
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const filePath = req.nextUrl.searchParams.get("path");
    if (!filePath) {
      return NextResponse.json({ error: "No path provided" }, { status: 400 });
    }

    // Security: only allow files inside /uploads/, block path traversal
    if (!filePath.startsWith("/uploads/") || filePath.includes("..")) {
      return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    }

    const absPath = path.join(process.cwd(), "public", filePath);
    const uploadsDir = path.normalize(path.join(process.cwd(), "public", "uploads"));
    const normalizedAbs = path.normalize(absPath);

    // Extra safeguard: resolved path must be inside uploads dir
    if (!normalizedAbs.startsWith(uploadsDir + path.sep)) {
      return NextResponse.json({ error: "Path traversal detected" }, { status: 400 });
    }

    if (existsSync(absPath)) {
      await unlink(absPath);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
