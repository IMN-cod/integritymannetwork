import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

// ───────────────────────────────────────
// POST /api/blog/[slug]/view — Track view
// ───────────────────────────────────────

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const rl = rateLimit(req, { key: "blog:view", limit: 120, windowMs: 60 * 1000 });
    if (!rl.ok) return rateLimitResponse(rl);

    const { slug } = await params;

    if (!slug || typeof slug !== "string" || slug.length > 255) {
      return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
    }

    const post = await prisma.blogPost.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    await prisma.blogPost.update({
      where: { slug },
      data: { viewCount: { increment: 1 } },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[BLOG_VIEW_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to track view" },
      { status: 500 }
    );
  }
}
