import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAdminAction } from "@/lib/audit";

// PATCH /api/admin/courses/bulk — Bulk actions on courses
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { action, courseIds } = await req.json();

    if (!action || !courseIds?.length) {
      return NextResponse.json({ error: "Action and course IDs are required" }, { status: 400 });
    }

    let result;

    switch (action) {
      case "publish":
        result = await prisma.course.updateMany({
          where: { id: { in: courseIds } },
          data: { status: "PUBLISHED" },
        });
        break;
      case "draft":
        result = await prisma.course.updateMany({
          where: { id: { in: courseIds } },
          data: { status: "DRAFT" },
        });
        break;
      case "archive":
        result = await prisma.course.updateMany({
          where: { id: { in: courseIds } },
          data: { status: "ARCHIVED" },
        });
        break;
      case "feature":
        result = await prisma.course.updateMany({
          where: { id: { in: courseIds } },
          data: { featured: true },
        });
        break;
      case "unfeature":
        result = await prisma.course.updateMany({
          where: { id: { in: courseIds } },
          data: { featured: false },
        });
        break;
      case "delete":
        result = await prisma.course.deleteMany({
          where: { id: { in: courseIds } },
        });
        break;
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    await logAdminAction({
      action: "BULK_ACTION",
      entity: "Course",
      details: { action, count: courseIds.length, courseIds },
    });

    return NextResponse.json({ success: true, count: result.count });
  } catch (error) {
    console.error("[ADMIN_COURSES_BULK]", error);
    return NextResponse.json({ error: "Failed to perform bulk action" }, { status: 500 });
  }
}
