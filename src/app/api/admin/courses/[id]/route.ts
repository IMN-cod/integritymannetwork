import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { logAdminAction } from "@/lib/audit";

// GET /api/admin/courses/[id] — Get single course
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

    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        enrollments: {
          select: {
            id: true,
            guestName: true,
            guestEmail: true,
            guestPhone: true,
            status: true,
            paidAmount: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
          take: 50,
        },
        _count: { select: { enrollments: true } },
      },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    return NextResponse.json({ course });
  } catch (error) {
    console.error("[ADMIN_COURSE_GET]", error);
    return NextResponse.json({ error: "Failed to fetch course" }, { status: 500 });
  }
}

// PATCH /api/admin/courses/[id] — Update course
export async function PATCH(
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

    const existing = await prisma.course.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const data: Record<string, unknown> = {};

    if (body.title !== undefined) data.title = body.title;
    if (body.description !== undefined) data.description = body.description;
    if (body.summary !== undefined) data.summary = body.summary || null;
    if (body.coverImage !== undefined) data.coverImage = body.coverImage || null;
    if (body.instructor !== undefined) data.instructor = body.instructor || null;
    if (body.duration !== undefined) data.duration = body.duration || null;
    if (body.level !== undefined) data.level = body.level;
    if (body.category !== undefined) data.category = body.category || null;
    if (body.price !== undefined) data.price = body.price;
    if (body.isFree !== undefined) data.isFree = body.isFree;
    if (body.featured !== undefined) data.featured = body.featured;
    if (body.status !== undefined) data.status = body.status;
    if (body.maxStudents !== undefined) data.maxStudents = body.maxStudents ? parseInt(String(body.maxStudents)) : null;
    if (body.startDate !== undefined) data.startDate = body.startDate ? new Date(body.startDate) : null;
    if (body.endDate !== undefined) data.endDate = body.endDate ? new Date(body.endDate) : null;
    if (body.syllabus !== undefined) data.syllabus = body.syllabus || null;
    if (body.prerequisites !== undefined) data.prerequisites = body.prerequisites || null;
    if (body.learningOutcomes !== undefined) data.learningOutcomes = body.learningOutcomes || null;
    if (body.sortOrder !== undefined) data.sortOrder = parseInt(String(body.sortOrder));

    if (body.slug !== undefined && body.slug !== existing.slug) {
      const newSlug = slugify(body.slug);
      const slugConflict = await prisma.course.findFirst({
        where: { slug: newSlug, id: { not: id } },
      });
      data.slug = slugConflict ? `${newSlug}-${Date.now().toString(36)}` : newSlug;
    }

    const course = await prisma.course.update({ where: { id }, data });

    await logAdminAction({
      action: "UPDATE",
      entity: "Course",
      entityId: id,
      details: { changes: Object.keys(data) },
    });

    return NextResponse.json({ course });
  } catch (error) {
    console.error("[ADMIN_COURSE_PATCH]", error);
    return NextResponse.json({ error: "Failed to update course" }, { status: 500 });
  }
}

// DELETE /api/admin/courses/[id] — Delete course
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

    const course = await prisma.course.findUnique({ where: { id } });
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    await prisma.course.delete({ where: { id } });

    await logAdminAction({
      action: "DELETE",
      entity: "Course",
      entityId: id,
      details: { title: course.title },
    });

    return NextResponse.json({ message: "Course deleted" });
  } catch (error) {
    console.error("[ADMIN_COURSE_DELETE]", error);
    return NextResponse.json({ error: "Failed to delete course" }, { status: 500 });
  }
}
