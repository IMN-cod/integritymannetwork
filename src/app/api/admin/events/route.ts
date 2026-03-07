import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { logAdminAction } from "@/lib/audit";

// GET /api/admin/events — List all events
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (
      !session?.user ||
      !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { location: { contains: search, mode: "insensitive" } },
      ];
    }

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        select: {
          id: true,
          title: true,
          slug: true,
          type: true,
          location: true,
          startDate: true,
          endDate: true,
          capacity: true,
          price: true,
          isFree: true,
          status: true,
          createdAt: true,
          _count: {
            select: { registrations: true },
          },
        },
        orderBy: { startDate: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.event.count({ where }),
    ]);

    return NextResponse.json({
      events,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[ADMIN_EVENTS_GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}

// POST /api/admin/events — Create a new event
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (
      !session?.user ||
      !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      title,
      description,
      summary,
      coverImage,
      type,
      location,
      locationUrl,
      startDate,
      endDate,
      capacity,
      price,
      isFree,
    } = body;

    if (!title || !description || !type || !startDate) {
      return NextResponse.json(
        { error: "Title, description, type, and start date are required" },
        { status: 400 }
      );
    }

    const slug = slugify(title);
    const existing = await prisma.event.findUnique({ where: { slug } });
    const finalSlug = existing ? `${slug}-${Date.now().toString(36)}` : slug;

    const event = await prisma.event.create({
      data: {
        title,
        slug: finalSlug,
        description,
        summary: summary || null,
        coverImage: coverImage || null,
        type,
        location: location || null,
        locationUrl: locationUrl || null,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        capacity: capacity ? parseInt(capacity) : null,
        price: price || 0,
        isFree: isFree ?? true,
        status: "UPCOMING",
      },
    });

    await logAdminAction({
      action: "CREATE",
      entity: "Event",
      entityId: event.id,
      details: { title, slug: finalSlug, type, startDate },
    });

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    console.error("[ADMIN_EVENTS_POST]", error);
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/events — Update an event
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (
      !session?.user ||
      !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, ...updates } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: "Event ID is required" },
        { status: 400 }
      );
    }

    const data: Record<string, unknown> = {};
    if (updates.title !== undefined) {
      data.title = updates.title;
      data.slug = slugify(updates.title);
    }
    if (updates.description !== undefined) data.description = updates.description;
    if (updates.summary !== undefined) data.summary = updates.summary;
    if (updates.coverImage !== undefined) data.coverImage = updates.coverImage;
    if (updates.type !== undefined) data.type = updates.type;
    if (updates.location !== undefined) data.location = updates.location;
    if (updates.locationUrl !== undefined) data.locationUrl = updates.locationUrl;
    if (updates.startDate !== undefined) data.startDate = new Date(updates.startDate);
    if (updates.endDate !== undefined) data.endDate = new Date(updates.endDate);
    if (updates.capacity !== undefined) data.capacity = parseInt(updates.capacity);
    if (updates.price !== undefined) data.price = updates.price;
    if (updates.isFree !== undefined) data.isFree = updates.isFree;
    if (updates.status !== undefined) data.status = updates.status;

    const event = await prisma.event.update({
      where: { id },
      data,
    });

    await logAdminAction({
      action: "UPDATE",
      entity: "Event",
      entityId: id,
      details: data,
    });

    return NextResponse.json({ event });
  } catch (error) {
    console.error("[ADMIN_EVENTS_PATCH]", error);
    return NextResponse.json(
      { error: "Failed to update event" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/events — Delete an event
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (
      !session?.user ||
      !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: "Event ID is required" },
        { status: 400 }
      );
    }

    await prisma.event.delete({ where: { id } });

    await logAdminAction({
      action: "DELETE",
      entity: "Event",
      entityId: id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[ADMIN_EVENTS_DELETE]", error);
    return NextResponse.json(
      { error: "Failed to delete event" },
      { status: 500 }
    );
  }
}
