import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAdminAction } from "@/lib/audit";

// GET /api/admin/blog/[id] — Get a single post by ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const post = await prisma.blogPost.findUnique({
      where: { id },
      include: {
        author: { select: { firstName: true, lastName: true, avatar: true } },
        category: { select: { id: true, name: true, slug: true } },
        tags: { include: { tag: { select: { id: true, name: true, slug: true } } } },
        _count: { select: { comments: true } },
      },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json({ post });
  } catch (error) {
    console.error("[ADMIN_BLOG_ID_GET]", error);
    return NextResponse.json({ error: "Failed to fetch post" }, { status: 500 });
  }
}

// PUT /api/admin/blog/[id] — Update a post
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.blogPost.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Build update data
    const data: Record<string, unknown> = {};
    if (body.title !== undefined) data.title = body.title;
    if (body.slug !== undefined) data.slug = body.slug;
    if (body.content !== undefined) data.content = body.content;
    if (body.excerpt !== undefined) data.excerpt = body.excerpt || null;
    if (body.coverImage !== undefined) data.coverImage = body.coverImage || null;
    if (body.categoryId !== undefined) data.categoryId = body.categoryId || null;
    if (body.featured !== undefined) data.featured = body.featured;
    if (body.metaDescription !== undefined) data.metaDescription = body.metaDescription || null;
    if (body.readingTime !== undefined) data.readingTime = body.readingTime;
    if (body.scheduledAt !== undefined) data.scheduledAt = body.scheduledAt ? new Date(body.scheduledAt) : null;
    // SEO fields
    if (body.seoTitle !== undefined) data.seoTitle = body.seoTitle || null;
    if (body.focusKeyword !== undefined) data.focusKeyword = body.focusKeyword || null;
    if (body.canonicalUrl !== undefined) data.canonicalUrl = body.canonicalUrl || null;
    if (body.ogImage !== undefined) data.ogImage = body.ogImage || null;
    if (body.ogTitle !== undefined) data.ogTitle = body.ogTitle || null;
    if (body.ogDescription !== undefined) data.ogDescription = body.ogDescription || null;
    if (body.twitterImage !== undefined) data.twitterImage = body.twitterImage || null;
    if (body.noIndex !== undefined) data.noIndex = body.noIndex;
    if (body.noFollow !== undefined) data.noFollow = body.noFollow;
    if (body.seoScore !== undefined) data.seoScore = body.seoScore;

    if (body.status !== undefined) {
      data.status = body.status;
      if (body.status === "PUBLISHED" && !existing.publishedAt) {
        data.publishedAt = new Date();
      }
    }

    // Handle tags update
    if (body.tagIds !== undefined) {
      // Delete existing tags, then re-create
      await prisma.blogPostTag.deleteMany({ where: { postId: id } });
      if (body.tagIds.length > 0) {
        await prisma.blogPostTag.createMany({
          data: body.tagIds.map((tagId: string) => ({ postId: id, tagId })),
        });
      }
    }

    const post = await prisma.blogPost.update({
      where: { id },
      data,
      include: {
        author: { select: { firstName: true, lastName: true } },
        category: { select: { name: true, slug: true } },
        tags: { include: { tag: true } },
      },
    });

    await logAdminAction({
      action: "UPDATE",
      entity: "BlogPost",
      entityId: id,
      details: { title: post.title, status: post.status },
    });

    return NextResponse.json({ post });
  } catch (error) {
    console.error("[ADMIN_BLOG_ID_PUT]", error);
    return NextResponse.json({ error: "Failed to update post" }, { status: 500 });
  }
}

// DELETE /api/admin/blog/[id] — Delete a post
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Delete related tags first
    await prisma.blogPostTag.deleteMany({ where: { postId: id } });
    await prisma.comment.deleteMany({ where: { postId: id } });
    await prisma.blogPost.delete({ where: { id } });

    await logAdminAction({
      action: "DELETE",
      entity: "BlogPost",
      entityId: id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[ADMIN_BLOG_ID_DELETE]", error);
    return NextResponse.json({ error: "Failed to delete post" }, { status: 500 });
  }
}
