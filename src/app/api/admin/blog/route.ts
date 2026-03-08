import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { logAdminAction } from "@/lib/audit";

// ────────────────────────────────
// GET /api/admin/blog — List posts
// ────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const categoryId = searchParams.get("categoryId") || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortDir = (searchParams.get("sortDir") || "desc") as "asc" | "desc";

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { excerpt: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status) where.status = status;
    if (categoryId) where.categoryId = categoryId;

    const orderBy: Record<string, string> = {};
    if (["createdAt", "title", "viewCount", "publishedAt", "updatedAt"].includes(sortBy)) {
      orderBy[sortBy] = sortDir;
    } else {
      orderBy.createdAt = "desc";
    }

    const [posts, total, statusCounts] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          coverImage: true,
          status: true,
          featured: true,
          viewCount: true,
          readingTime: true,
          publishedAt: true,
          createdAt: true,
          updatedAt: true,
          author: { select: { firstName: true, lastName: true, avatar: true } },
          category: { select: { id: true, name: true, slug: true, color: true } },
          tags: { include: { tag: { select: { id: true, name: true, slug: true } } } },
          _count: { select: { comments: true } },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.blogPost.count({ where }),
      prisma.blogPost.groupBy({
        by: ["status"],
        _count: true,
      }),
    ]);

    const totalAll = await prisma.blogPost.count();
    const totalViews = await prisma.blogPost.aggregate({ _sum: { viewCount: true } });

    const stats = {
      total: totalAll,
      draft: statusCounts.find((s) => s.status === "DRAFT")?._count || 0,
      published: statusCounts.find((s) => s.status === "PUBLISHED")?._count || 0,
      archived: statusCounts.find((s) => s.status === "ARCHIVED")?._count || 0,
      totalViews: totalViews._sum.viewCount || 0,
    };

    return NextResponse.json({
      posts,
      stats,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("[ADMIN_BLOG_GET]", error);
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
  }
}

// ──────────────────────────────────
// POST /api/admin/blog — Create post
// ──────────────────────────────────

function calculateReadingTime(html: string): number {
  const text = html.replace(/<[^>]*>/g, "");
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 238));
}

function autoExcerpt(html: string, maxLength = 160): string {
  const text = html.replace(/<[^>]*>/g, "").trim();
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).replace(/\s+\S*$/, "") + "...";
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, content, excerpt, coverImage, categoryId, tagIds, status, featured, metaDescription, scheduledAt } = body;

    if (!title || !content) {
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
    }

    // Smart slug generation
    let slug = body.slug || slugify(title);
    const existingSlug = await prisma.blogPost.findUnique({ where: { slug } });
    if (existingSlug) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    const readingTime = calculateReadingTime(content);
    const finalExcerpt = excerpt || autoExcerpt(content, 160);

    const post = await prisma.blogPost.create({
      data: {
        title,
        slug,
        content,
        excerpt: finalExcerpt,
        coverImage: coverImage || null,
        categoryId: categoryId || null,
        status: status || "DRAFT",
        featured: featured || false,
        readingTime,
        metaDescription: metaDescription || null,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        authorId: session.user.id,
        publishedAt: status === "PUBLISHED" ? new Date() : null,
        ...(tagIds?.length && {
          tags: { create: tagIds.map((tagId: string) => ({ tagId })) },
        }),
      },
      include: {
        author: { select: { firstName: true, lastName: true } },
        category: { select: { name: true } },
        tags: { include: { tag: true } },
      },
    });

    await logAdminAction({
      action: "CREATE",
      entity: "BlogPost",
      entityId: post.id,
      details: { title, slug, status: status || "DRAFT" },
    });

    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    console.error("[ADMIN_BLOG_POST]", error);
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
  }
}

// ────────────────────────────────────
// PATCH /api/admin/blog — Bulk actions
// ────────────────────────────────────

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { postIds, action } = await req.json();

    if (!postIds?.length || !action) {
      return NextResponse.json({ error: "Post IDs and action are required" }, { status: 400 });
    }

    let updateData: Record<string, unknown> = {};

    switch (action) {
      case "publish":
        updateData = { status: "PUBLISHED", publishedAt: new Date() };
        break;
      case "draft":
        updateData = { status: "DRAFT" };
        break;
      case "archive":
        updateData = { status: "ARCHIVED" };
        break;
      case "feature":
        updateData = { featured: true };
        break;
      case "unfeature":
        updateData = { featured: false };
        break;
      case "delete":
        await prisma.blogPostTag.deleteMany({ where: { postId: { in: postIds } } });
        await prisma.comment.deleteMany({ where: { postId: { in: postIds } } });
        await prisma.blogPost.deleteMany({ where: { id: { in: postIds } } });
        await logAdminAction({
          action: "BULK_ACTION",
          entity: "BlogPost",
          details: { action: "delete", count: postIds.length },
        });
        return NextResponse.json({ success: true });
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    await prisma.blogPost.updateMany({
      where: { id: { in: postIds } },
      data: updateData,
    });

    await logAdminAction({
      action: "BULK_ACTION",
      entity: "BlogPost",
      details: { action, count: postIds.length },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[ADMIN_BLOG_PATCH]", error);
    return NextResponse.json({ error: "Failed to perform action" }, { status: 500 });
  }
}
