import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAdminAction } from "@/lib/audit";

// PATCH /api/admin/events/bulk — Bulk actions on events
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { action, eventIds } = await req.json();

    if (!action || !eventIds?.length) {
      return NextResponse.json({ error: "Action and eventIds required" }, { status: 400 });
    }

    let result;

    switch (action) {
      case "upcoming":
        result = await prisma.event.updateMany({
          where: { id: { in: eventIds } },
          data: { status: "UPCOMING" },
        });
        break;
      case "ongoing":
        result = await prisma.event.updateMany({
          where: { id: { in: eventIds } },
          data: { status: "ONGOING" },
        });
        break;
      case "completed":
        result = await prisma.event.updateMany({
          where: { id: { in: eventIds } },
          data: { status: "COMPLETED" },
        });
        break;
      case "cancelled":
        result = await prisma.event.updateMany({
          where: { id: { in: eventIds } },
          data: { status: "CANCELLED" },
        });
        break;
      case "feature":
        result = await prisma.event.updateMany({
          where: { id: { in: eventIds } },
          data: { featured: true },
        });
        break;
      case "delete":
        await prisma.eventRegistration.deleteMany({
          where: { eventId: { in: eventIds } },
        });
        result = await prisma.event.deleteMany({
          where: { id: { in: eventIds } },
        });
        break;
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    await logAdminAction({
      action: "BULK_ACTION",
      entity: "Event",
      entityId: eventIds.join(","),
      details: { action, count: eventIds.length },
    });

    return NextResponse.json({ success: true, count: result?.count || 0 });
  } catch (error) {
    console.error("[ADMIN_EVENTS_BULK]", error);
    return NextResponse.json({ error: "Failed to perform bulk action" }, { status: 500 });
  }
}
