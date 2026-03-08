import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ───────────────────────────────────────
// GET /api/events — Public: list published events
// ───────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const search = searchParams.get("search") || "";
    const type = searchParams.get("type") || "";
    const filter = searchParams.get("filter") || ""; // upcoming | past | all

    const where: Record<string, unknown> = {
      status: { not: "CANCELLED" },
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { location: { contains: search, mode: "insensitive" } },
        { venue: { contains: search, mode: "insensitive" } },
        { summary: { contains: search, mode: "insensitive" } },
      ];
    }

    if (type) {
      where.type = type;
    }

    if (filter === "upcoming") {
      where.startDate = { gte: new Date() };
    } else if (filter === "past") {
      where.startDate = { lt: new Date() };
    }

    const [events, total, featured] = await Promise.all([
      prisma.event.findMany({
        where,
        select: {
          id: true,
          title: true,
          slug: true,
          summary: true,
          coverImage: true,
          type: true,
          location: true,
          venue: true,
          startDate: true,
          endDate: true,
          capacity: true,
          price: true,
          isFree: true,
          featured: true,
          status: true,
          organizer: true,
          _count: { select: { registrations: true } },
        },
        orderBy: filter === "past" ? { startDate: "desc" } : { startDate: "asc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.event.count({ where }),
      prisma.event.findMany({
        where: { featured: true, status: { not: "CANCELLED" }, startDate: { gte: new Date() } },
        select: {
          id: true,
          title: true,
          slug: true,
          summary: true,
          coverImage: true,
          type: true,
          location: true,
          venue: true,
          startDate: true,
          endDate: true,
          price: true,
          isFree: true,
          featured: true,
          status: true,
        },
        orderBy: { startDate: "asc" },
        take: 3,
      }),
    ]);

    return NextResponse.json({
      events,
      featured,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[EVENTS_GET_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}
