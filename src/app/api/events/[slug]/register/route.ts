import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { sendEmail, eventRegistrationEmail } from "@/lib/email";
import { z } from "zod";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

const registerBodySchema = z.object({
  guestName: z.string().min(2).max(200).optional(),
  guestEmail: z.string().email().max(254).optional(),
  guestPhone: z.string().max(30).optional(),
  ticketCount: z.union([z.number(), z.string()]).optional(),
  ticketType: z.string().max(50).optional(),
  notes: z.string().max(1000).optional(),
});

// POST /api/events/[slug]/register — Register for an event (guest or logged-in)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const rl = rateLimit(req, { key: "events:register", limit: 10, windowMs: 60 * 60 * 1000 });
    if (!rl.ok) return rateLimitResponse(rl);

    const { slug } = await params;
    const session = await auth();
    const raw = await req.json();
    const parsed = registerBodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }
    const { guestName, guestEmail, guestPhone, ticketCount, ticketType, notes } = parsed.data;

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

    // Validate ticket count — explicit parseInt to guarantee integer
    const count = Math.min(Math.max(1, parseInt(String(ticketCount), 10) || 1), event.maxPerPerson);

    // Check capacity
    if (event.capacity) {
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

    // For logged-in users, populate guest fields from session so admin always sees details
    const registrantName = guestName || session?.user?.name || null;
    const registrantEmail = guestEmail || session?.user?.email || null;

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
        guestName: registrantName,
        guestEmail: registrantEmail,
        guestPhone: guestPhone || null,
        ticketCount: count,
        ticketType: ticketType || "General",
        notes: notes || null,
        paidAmount,
        status: "REGISTERED",
      },
    });

    // Send confirmation email (non-blocking)
    const recipientEmail = registrantEmail || (userId ? (await prisma.user.findUnique({ where: { id: userId }, select: { email: true } }))?.email : null);
    const attendeeName = registrantName || "Attendee";
    if (recipientEmail) {
      const eventDate = event.startDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
      sendEmail({
        to: recipientEmail,
        subject: `Registration Confirmed: ${event.title}`,
        html: eventRegistrationEmail({
          eventTitle: event.title,
          attendeeName,
          ticketCount: count,
          eventDate,
          eventLocation: event.location,
          eventVenue: event.venue,
        }),
      }).catch(() => {});
    }

    // Notify admins about the registration
    const admins = await prisma.user.findMany({
      where: { role: { in: ["ADMIN", "SUPER_ADMIN"] }, isActive: true },
      select: { id: true },
    });
    if (admins.length > 0) {
      await prisma.notification.createMany({
        data: admins.map((admin) => ({
          userId: admin.id,
          title: "New Event Registration",
          message: `${attendeeName} registered for ${event.title} (${count} ticket${count > 1 ? "s" : ""}).`,
          type: "EVENT_REGISTRATION",
          link: `/admin/events/${event.id}/registrations`,
        })),
      });
    }

    return NextResponse.json({
      registration,
      message: "Successfully registered! We look forward to seeing you.",
    }, { status: 201 });
  } catch (error) {
    console.error("[EVENT_REGISTER_POST]", error);
    return NextResponse.json({ error: "Failed to register for event" }, { status: 500 });
  }
}
