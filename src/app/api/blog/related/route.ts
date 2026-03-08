import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ───────────────────────────────────────
// GET /api/blog/related — Fetch related posts
// ───────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const excludeId = searchParams.get("exclude") || "";
    const categorySlug = searchParams.get("category") || "";
    const limit = Math.min(parseInt(searchParams.get("limit") || "3"), 6);

    // First try to find posts in the same category
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let posts: any[] = [];

    if (categorySlug) {
      posts = await prisma.blogPost.findMany({
        where: {
          status: "PUBLISHED",
          id: { not: excludeId },
          category: { slug: categorySlug },
        },
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          coverImage: true,
          readingTime: true,
          publishedAt: true,
          author: { select: { firstName: true, lastName: true, avatar: true } },
          category: { select: { name: true, slug: true } },
        },
        orderBy: { viewCount: "desc" },
        take: limit,
      });
    }

    // If not enough, fill with recent popular posts
    if (posts.length < limit) {
      const existingIds = [excludeId, ...posts.map((p) => p.id)];
      const morePosts = await prisma.blogPost.findMany({
        where: {
          status: "PUBLISHED",
          id: { notIn: existingIds },
        },
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          coverImage: true,
          readingTime: true,
          publishedAt: true,
          author: { select: { firstName: true, lastName: true, avatar: true } },
          category: { select: { name: true, slug: true } },
        },
        orderBy: [{ viewCount: "desc" }, { publishedAt: "desc" }],
        take: limit - posts.length,
      });
      posts = [...posts, ...morePosts];
    }

    return NextResponse.json({ posts });
  } catch (error) {
    console.error("[BLOG_RELATED_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to fetch related posts" },
      { status: 500 }
    );
  }
}
