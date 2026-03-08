import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/events/[slug] — Get single event
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const event = await prisma.event.findUnique({
      where: { slug },
      include: {
        _count: { select: { registrations: true } },
      },
    });

    if (!event || event.status === "CANCELLED") {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Increment view count
    await prisma.event.update({
      where: { id: event.id },
      data: { viewCount: { increment: 1 } },
    });

    // Check remaining capacity
    const registeredCount = await prisma.eventRegistration.count({
      where: { eventId: event.id, status: { not: "CANCELLED" } },
    });

    const spotsRemaining = event.capacity ? Math.max(0, event.capacity - registeredCount) : null;

    return NextResponse.json({
      event: {
        ...event,
        spotsRemaining,
        registeredCount,
      },
    });
  } catch (error) {
    console.error("[EVENT_DETAIL_GET]", error);
    return NextResponse.json({ error: "Failed to fetch event" }, { status: 500 });
  }
}
