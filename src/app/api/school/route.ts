import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/school — Public: list published courses
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const search = searchParams.get("search") || "";
    const level = searchParams.get("level") || "";
    const category = searchParams.get("category") || "";

    const where: Record<string, unknown> = {
      status: "PUBLISHED",
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { summary: { contains: search, mode: "insensitive" } },
        { instructor: { contains: search, mode: "insensitive" } },
        { category: { contains: search, mode: "insensitive" } },
      ];
    }

    if (level) {
      where.level = level;
    }

    if (category) {
      where.category = category;
    }

    const [courses, total, featured] = await Promise.all([
      prisma.course.findMany({
        where,
        select: {
          id: true,
          title: true,
          slug: true,
          summary: true,
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
          endDate: true,
          learningOutcomes: true,
        },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.course.count({ where }),
      prisma.course.findMany({
        where: { featured: true, status: "PUBLISHED" },
        select: {
          id: true,
          title: true,
          slug: true,
          summary: true,
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
          endDate: true,
          learningOutcomes: true,
        },
        orderBy: { sortOrder: "asc" },
        take: 3,
      }),
    ]);

    return NextResponse.json({
      courses,
      featured,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[SCHOOL_GET_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to fetch courses" },
      { status: 500 }
    );
  }
}
