import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { logAdminAction } from "@/lib/audit";

// GET /api/admin/events/[id] — Get single event
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
    const event = await prisma.event.findUnique({
      where: { id },
      include: { _count: { select: { registrations: true } } },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json({ event });
  } catch (error) {
    console.error("[ADMIN_EVENT_GET]", error);
    return NextResponse.json({ error: "Failed to fetch event" }, { status: 500 });
  }
}

// PUT /api/admin/events/[id] — Update event
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.event.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Handle slug uniqueness
    let finalSlug = body.slug ? slugify(body.slug) : existing.slug;
    if (finalSlug !== existing.slug) {
      const slugTaken = await prisma.event.findFirst({
        where: { slug: finalSlug, NOT: { id } },
      });
      if (slugTaken) {
        finalSlug = `${finalSlug}-${Date.now().toString(36)}`;
      }
    }

    const event = await prisma.event.update({
      where: { id },
      data: {
        title: body.title ?? existing.title,
        slug: finalSlug,
        description: body.description ?? existing.description,
        summary: body.summary !== undefined ? body.summary : existing.summary,
        coverImage: body.coverImage !== undefined ? body.coverImage : existing.coverImage,
        type: body.type ?? existing.type,
        status: body.status ?? existing.status,
        featured: body.featured !== undefined ? body.featured : existing.featured,
        location: body.location !== undefined ? body.location : existing.location,
        locationUrl: body.locationUrl !== undefined ? body.locationUrl : existing.locationUrl,
        venue: body.venue !== undefined ? body.venue : existing.venue,
        address: body.address !== undefined ? body.address : existing.address,
        startDate: body.startDate ? new Date(body.startDate) : existing.startDate,
        endDate: body.endDate ? new Date(body.endDate) : body.endDate === null ? null : existing.endDate,
        capacity: body.capacity !== undefined ? (body.capacity ? parseInt(String(body.capacity)) : null) : existing.capacity,
        maxPerPerson: body.maxPerPerson !== undefined ? parseInt(String(body.maxPerPerson)) : existing.maxPerPerson,
        price: body.price !== undefined ? body.price : existing.price,
        isFree: body.isFree !== undefined ? body.isFree : existing.isFree,
        organizer: body.organizer !== undefined ? body.organizer : existing.organizer,
        contactEmail: body.contactEmail !== undefined ? body.contactEmail : existing.contactEmail,
        contactPhone: body.contactPhone !== undefined ? body.contactPhone : existing.contactPhone,
        schedule: body.schedule !== undefined ? body.schedule : existing.schedule,
      },
    });

    await logAdminAction({
      action: "UPDATE",
      entity: "Event",
      entityId: id,
      details: { title: event.title },
    });

    return NextResponse.json({ event });
  } catch (error) {
    console.error("[ADMIN_EVENT_PUT]", error);
    return NextResponse.json({ error: "Failed to update event" }, { status: 500 });
  }
}

// DELETE /api/admin/events/[id] — Delete event + registrations
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Delete registrations first, then event
    await prisma.eventRegistration.deleteMany({ where: { eventId: id } });
    await prisma.event.delete({ where: { id } });

    await logAdminAction({
      action: "DELETE",
      entity: "Event",
      entityId: id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[ADMIN_EVENT_DELETE]", error);
    return NextResponse.json({ error: "Failed to delete event" }, { status: 500 });
  }
}
