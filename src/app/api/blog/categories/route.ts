import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ───────────────────────────────────────
// GET /api/blog/categories — Public: list categories
// ───────────────────────────────────────

export async function GET() {
  try {
    const categories = await prisma.blogCategory.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        color: true,
        _count: { select: { posts: { where: { status: "PUBLISHED" } } } },
      },
      orderBy: { name: "asc" },
    });

    // Only return categories that have at least one published post
    const filtered = categories.filter((c) => c._count.posts > 0);

    return NextResponse.json({ categories: filtered });
  } catch (error) {
    console.error("[BLOG_CATEGORIES_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}
