import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { logAdminAction } from "@/lib/audit";

// GET /api/admin/courses — List courses with stats, filtering, sorting
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
    const level = searchParams.get("level") || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = (searchParams.get("sortOrder") || "desc") as "asc" | "desc";

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { instructor: { contains: search, mode: "insensitive" } },
        { category: { contains: search, mode: "insensitive" } },
      ];
    }
    if (status) where.status = status;
    if (level) where.level = level;

    const orderBy: Record<string, string> = {};
    orderBy[sortBy] = sortOrder;

    const [courses, total, published, draft, archived, allEnrollments] = await Promise.all([
      prisma.course.findMany({
        where,
        select: {
          id: true,
          title: true,
          slug: true,
          coverImage: true,
          instructor: true,
          duration: true,
          level: true,
          category: true,
          price: true,
          isFree: true,
          featured: true,
          status: true,
          maxStudents: true,
          enrollmentCount: true,
          startDate: true,
          viewCount: true,
          sortOrder: true,
          createdAt: true,
          _count: { select: { enrollments: true } },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.course.count({ where }),
      prisma.course.count({ where: { status: "PUBLISHED" } }),
      prisma.course.count({ where: { status: "DRAFT" } }),
      prisma.course.count({ where: { status: "ARCHIVED" } }),
      prisma.courseEnrollment.aggregate({
        _count: true,
        _sum: { paidAmount: true },
      }),
    ]);

    const totalAll = published + draft + archived;

    return NextResponse.json({
      courses,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      stats: {
        total: totalAll,
        published,
        draft,
        archived,
        totalEnrollments: allEnrollments._count || 0,
        totalRevenue: Number(allEnrollments._sum?.paidAmount || 0),
      },
    });
  } catch (error) {
    console.error("[ADMIN_COURSES_GET]", error);
    return NextResponse.json({ error: "Failed to fetch courses" }, { status: 500 });
  }
}

// POST /api/admin/courses — Create a new course
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      title, description, summary, coverImage, instructor, duration,
      level, category, price, isFree, featured, status: courseStatus,
      maxStudents, startDate, endDate, syllabus, prerequisites,
      learningOutcomes, sortOrder,
    } = body;

    if (!title || !description) {
      return NextResponse.json(
        { error: "Title and description are required" },
        { status: 400 }
      );
    }

    const baseSlug = body.slug ? slugify(body.slug) : slugify(title);
    const existing = await prisma.course.findUnique({ where: { slug: baseSlug } });
    const finalSlug = existing ? `${baseSlug}-${Date.now().toString(36)}` : baseSlug;

    const course = await prisma.course.create({
      data: {
        title,
        slug: finalSlug,
        description,
        summary: summary || null,
        coverImage: coverImage || null,
        instructor: instructor || null,
        duration: duration || null,
        level: level || "BEGINNER",
        category: category || null,
        price: price || 0,
        isFree: isFree ?? true,
        featured: featured || false,
        status: courseStatus || "DRAFT",
        maxStudents: maxStudents ? parseInt(String(maxStudents)) : null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        syllabus: syllabus || null,
        prerequisites: prerequisites || null,
        learningOutcomes: learningOutcomes || null,
        sortOrder: sortOrder ? parseInt(String(sortOrder)) : 0,
      },
    });

    await logAdminAction({
      action: "CREATE",
      entity: "Course",
      entityId: course.id,
      details: { title, slug: finalSlug, level },
    });

    return NextResponse.json({ course }, { status: 201 });
  } catch (error) {
    console.error("[ADMIN_COURSES_POST]", error);
    return NextResponse.json({ error: "Failed to create course" }, { status: 500 });
  }
}
