import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { logAdminAction } from "@/lib/audit";

// GET /api/admin/events — List events with stats, filtering, sorting
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
    const sortBy = searchParams.get("sortBy") || "startDate";
    const sortOrder = (searchParams.get("sortOrder") || "desc") as "asc" | "desc";

    // Build where clause
    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { location: { contains: search, mode: "insensitive" } },
        { venue: { contains: search, mode: "insensitive" } },
      ];
    }
    if (status) {
      where.status = status;
    }

    // Build orderBy
    const orderBy: Record<string, string> = {};
    orderBy[sortBy] = sortOrder;

    // Fetch events + counts in parallel
    const [events, total, upcoming, ongoing, completed, cancelled, allRegs] = await Promise.all([
      prisma.event.findMany({
        where,
        select: {
          id: true,
          title: true,
          slug: true,
          type: true,
          location: true,
          coverImage: true,
          startDate: true,
          endDate: true,
          capacity: true,
          price: true,
          isFree: true,
          featured: true,
          status: true,
          viewCount: true,
          createdAt: true,
          registrations: {
            where: { status: { not: "CANCELLED" } },
            select: { ticketCount: true },
          },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.event.count({ where }),
      prisma.event.count({ where: { status: "UPCOMING" } }),
      prisma.event.count({ where: { status: "ONGOING" } }),
      prisma.event.count({ where: { status: "COMPLETED" } }),
      prisma.event.count({ where: { status: "CANCELLED" } }),
      prisma.eventRegistration.aggregate({
        where: { status: { not: "CANCELLED" } },
        _sum: { paidAmount: true, ticketCount: true },
      }),
    ]);

    const totalAll = upcoming + ongoing + completed + cancelled;

    // Map events to include total ticket count instead of just registration row count
    const eventsWithTickets = events.map((e) => {
      const totalTickets = e.registrations.reduce((sum, r) => sum + r.ticketCount, 0);
      const { registrations: _, ...rest } = e;
      return { ...rest, _count: { registrations: totalTickets } };
    });

    return NextResponse.json({
      events: eventsWithTickets,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      stats: {
        total: totalAll,
        upcoming,
        ongoing,
        completed,
        cancelled,
        totalRegistrations: allRegs._sum?.ticketCount || 0,
        totalRevenue: Number(allRegs._sum?.paidAmount || 0),
      },
    });
  } catch (error) {
    console.error("[ADMIN_EVENTS_GET]", error);
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }
}

// POST /api/admin/events — Create a new event
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, description, summary, coverImage, type, status: eventStatus,
      location, locationUrl, venue, address, startDate, endDate,
      capacity, maxPerPerson, price, isFree, featured,
      organizer, contactEmail, contactPhone, schedule } = body;

    if (!title || !startDate) {
      return NextResponse.json({ error: "Title and start date are required" }, { status: 400 });
    }

    const baseSlug = body.slug ? slugify(body.slug) : slugify(title);
    const existing = await prisma.event.findUnique({ where: { slug: baseSlug } });
    const finalSlug = existing ? `${baseSlug}-${Date.now().toString(36)}` : baseSlug;

    const event = await prisma.event.create({
      data: {
        title,
        slug: finalSlug,
        description: description || "<p>Event details coming soon.</p>",
        summary: summary || null,
        coverImage: coverImage || null,
        type: type || "OTHER",
        status: eventStatus || "UPCOMING",
        featured: featured || false,
        location: location || null,
        locationUrl: locationUrl || null,
        venue: venue || null,
        address: address || null,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        capacity: capacity ? parseInt(String(capacity)) : null,
        maxPerPerson: maxPerPerson ? parseInt(String(maxPerPerson)) : 5,
        price: price || 0,
        isFree: isFree ?? true,
        organizer: organizer || null,
        contactEmail: contactEmail || null,
        contactPhone: contactPhone || null,
        schedule: schedule || null,
      },
    });

    await logAdminAction({
      action: "CREATE",
      entity: "Event",
      entityId: event.id,
      details: { title, slug: finalSlug, type },
    });

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    console.error("[ADMIN_EVENTS_POST]", error);
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
  }
}
