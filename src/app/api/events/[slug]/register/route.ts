import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// POST /api/events/[slug]/register — Register for an event (guest or logged-in)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const session = await auth();
    const body = await req.json();

    const { guestName, guestEmail, guestPhone, ticketCount = 1, ticketType, notes } = body;

    // Find the event
    const event = await prisma.event.findUnique({ where: { slug } });
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Check event is bookable
    if (event.status === "CANCELLED") {
      return NextResponse.json({ error: "This event has been cancelled" }, { status: 400 });
    }
    if (event.status === "COMPLETED") {
      return NextResponse.json({ error: "This event has already ended" }, { status: 400 });
    }

    // Validate ticket count
    const count = Math.min(Math.max(1, ticketCount), event.maxPerPerson);

    // Check capacity
    if (event.capacity) {
      const registeredCount = await prisma.eventRegistration.count({
        where: { eventId: event.id, status: { not: "CANCELLED" } },
      });

      // Sum tickets (not just counts)
      const ticketSum = await prisma.eventRegistration.aggregate({
        where: { eventId: event.id, status: { not: "CANCELLED" } },
        _sum: { ticketCount: true },
      });
      const totalTickets = ticketSum._sum?.ticketCount || 0;

      if (totalTickets + count > event.capacity) {
        const remaining = Math.max(0, event.capacity - totalTickets);
        if (remaining === 0) {
          return NextResponse.json({ error: "This event is fully booked" }, { status: 400 });
        }
        return NextResponse.json({
          error: `Only ${remaining} spot${remaining === 1 ? "" : "s"} remaining`,
        }, { status: 400 });
      }
    }

    // Require either session or guest info
    const userId = session?.user?.id || null;
    if (!userId && (!guestName || !guestEmail)) {
      return NextResponse.json({
        error: "Please provide your name and email to register",
      }, { status: 400 });
    }

    // Check for duplicate registration (same user or same email)
    if (userId) {
      const existing = await prisma.eventRegistration.findFirst({
        where: { eventId: event.id, userId, status: { not: "CANCELLED" } },
      });
      if (existing) {
        return NextResponse.json({ error: "You are already registered for this event" }, { status: 400 });
      }
    } else if (guestEmail) {
      const existing = await prisma.eventRegistration.findFirst({
        where: { eventId: event.id, guestEmail, status: { not: "CANCELLED" } },
      });
      if (existing) {
        return NextResponse.json({ error: "This email is already registered for this event" }, { status: 400 });
      }
    }

    // Calculate paid amount
    const paidAmount = event.isFree ? 0 : Number(event.price || 0) * count;

    const registration = await prisma.eventRegistration.create({
      data: {
        eventId: event.id,
        userId,
        guestName: guestName || null,
        guestEmail: guestEmail || null,
        guestPhone: guestPhone || null,
        ticketCount: count,
        ticketType: ticketType || "General",
        notes: notes || null,
        paidAmount,
        status: "REGISTERED",
      },
    });

    return NextResponse.json({
      registration,
      message: "Successfully registered! We look forward to seeing you.",
    }, { status: 201 });
  } catch (error) {
    console.error("[EVENT_REGISTER_POST]", error);
    return NextResponse.json({ error: "Failed to register for event" }, { status: 500 });
  }
}
