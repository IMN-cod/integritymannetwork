import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/admin/events/[id]/registrations — List registrations for an event
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
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const search = searchParams.get("search") || "";
    const statusFilter = searchParams.get("status") || "";

    const where: Record<string, unknown> = { eventId: id };

    if (search) {
      where.OR = [
        { guestName: { contains: search, mode: "insensitive" } },
        { guestEmail: { contains: search, mode: "insensitive" } },
        { user: { firstName: { contains: search, mode: "insensitive" } } },
        { user: { lastName: { contains: search, mode: "insensitive" } } },
        { user: { email: { contains: search, mode: "insensitive" } } },
      ];
    }
    if (statusFilter) {
      where.status = statusFilter;
    }

    const [registrations, total, event] = await Promise.all([
      prisma.eventRegistration.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatar: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.eventRegistration.count({ where }),
      prisma.event.findUnique({
        where: { id },
        select: {
          id: true,
          title: true,
          slug: true,
          capacity: true,
          price: true,
          isFree: true,
          startDate: true,
          status: true,
        },
      }),
    ]);

    // Compute stats for this event
    const [registered, attended, cancelled, waitlisted, revenue] = await Promise.all([
      prisma.eventRegistration.count({ where: { eventId: id, status: "REGISTERED" } }),
      prisma.eventRegistration.count({ where: { eventId: id, status: "ATTENDED" } }),
      prisma.eventRegistration.count({ where: { eventId: id, status: "CANCELLED" } }),
      prisma.eventRegistration.count({ where: { eventId: id, status: "WAITLISTED" } }),
      prisma.eventRegistration.aggregate({
        where: { eventId: id, status: { not: "CANCELLED" } },
        _sum: { paidAmount: true },
      }),
    ]);

    return NextResponse.json({
      registrations,
      event,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      stats: {
        total,
        registered,
        attended,
        cancelled,
        waitlisted,
        revenue: Number(revenue._sum?.paidAmount || 0),
      },
    });
  } catch (error) {
    console.error("[ADMIN_EVENT_REGISTRATIONS_GET]", error);
    return NextResponse.json({ error: "Failed to fetch registrations" }, { status: 500 });
  }
}

// PATCH /api/admin/events/[id]/registrations — Update registration status or check-in
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { registrationId, registrationIds, action } = body;

    // Single update
    if (registrationId && action) {
      const data: Record<string, unknown> = {};
      if (action === "checkin") {
        data.status = "ATTENDED";
        data.checkInAt = new Date();
      } else if (action === "cancel") {
        data.status = "CANCELLED";
      } else if (action === "register") {
        data.status = "REGISTERED";
        data.checkInAt = null;
      } else if (action === "waitlist") {
        data.status = "WAITLISTED";
      }

      const reg = await prisma.eventRegistration.update({
        where: { id: registrationId },
        data,
      });

      return NextResponse.json({ registration: reg });
    }

    // Bulk update
    if (registrationIds?.length && action) {
      const data: Record<string, unknown> = {};
      if (action === "checkin") {
        data.status = "ATTENDED";
        data.checkInAt = new Date();
      } else if (action === "cancel") {
        data.status = "CANCELLED";
      }

      await prisma.eventRegistration.updateMany({
        where: { id: { in: registrationIds } },
        data,
      });

      return NextResponse.json({ success: true, count: registrationIds.length });
    }

    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  } catch (error) {
    console.error("[ADMIN_EVENT_REGISTRATIONS_PATCH]", error);
    return NextResponse.json({ error: "Failed to update registration" }, { status: 500 });
  }
}

// DELETE /api/admin/events/[id]/registrations — Delete a registration
export async function DELETE(
  req: NextRequest,
) {
  try {
    const session = await auth();
    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { registrationId } = await req.json();
    if (!registrationId) {
      return NextResponse.json({ error: "registrationId required" }, { status: 400 });
    }

    await prisma.eventRegistration.delete({ where: { id: registrationId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[ADMIN_EVENT_REGISTRATIONS_DELETE]", error);
    return NextResponse.json({ error: "Failed to delete registration" }, { status: 500 });
  }
}
