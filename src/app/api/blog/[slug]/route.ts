import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// ───────────────────────────────────────
// GET /api/blog/[slug] — Public: fetch single post
// ───────────────────────────────────────

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const post = await prisma.blogPost.findUnique({
      where: { slug },
      include: {
        author: { select: { firstName: true, lastName: true, displayName: true, avatar: true, role: true } },
        category: { select: { name: true, slug: true } },
        tags: { include: { tag: true } },
        comments: {
          where: { parentId: null },
          include: {
            user: { select: { firstName: true, lastName: true, avatar: true } },
            replies: {
              include: {
                user: { select: { firstName: true, lastName: true, avatar: true } },
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json(post);
  } catch (error) {
    console.error("[BLOG_SLUG_GET_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to fetch post" },
      { status: 500 }
    );
  }
}

// ───────────────────────────────────────
// PUT /api/blog/[slug] — Admin: update post
// ───────────────────────────────────────

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth();
    if (
      !session?.user ||
      !["ADMIN", "SUPER_ADMIN", "MODERATOR"].includes(session.user.role)
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = await params;
    const body = await req.json();

    const existingPost = await prisma.blogPost.findUnique({
      where: { slug },
    });

    if (!existingPost) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const post = await prisma.blogPost.update({
      where: { slug },
      data: {
        ...body,
        ...(body.published && !existingPost.publishedAt
          ? { publishedAt: new Date() }
          : {}),
      },
    });

    return NextResponse.json(post);
  } catch (error) {
    console.error("[BLOG_SLUG_PUT_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to update post" },
      { status: 500 }
    );
  }
}

// ───────────────────────────────────────
// DELETE /api/blog/[slug] — Admin: delete post
// ───────────────────────────────────────

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth();
    if (
      !session?.user ||
      !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = await params;

    await prisma.blogPost.delete({ where: { slug } });

    return NextResponse.json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error("[BLOG_SLUG_DELETE_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to delete post" },
      { status: 500 }
    );
  }
}
