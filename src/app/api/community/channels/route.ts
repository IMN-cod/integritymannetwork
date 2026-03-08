import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/community/channels — list channels the user can see
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const channels = await prisma.chatChannel.findMany({
      where: {
        OR: [
          { type: "PUBLIC" },
          { members: { some: { userId: session.user.id } } },
        ],
      },
      include: {
        _count: { select: { members: true, messages: true } },
        members: {
          where: { userId: session.user.id },
          select: { role: true, mutedUntil: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // Get unread counts — messages after user's last visit (simplified: count messages in last 24h)
    const oneDayAgo = new Date(Date.now() - 86400000);
    const unreadCounts = await Promise.all(
      channels.map(async (ch) => {
        const count = await prisma.chatMessage.count({
          where: {
            channelId: ch.id,
            createdAt: { gte: oneDayAgo },
            userId: { not: session.user.id },
          },
        });
        return { channelId: ch.id, unread: count };
      })
    );

    const unreadMap = Object.fromEntries(unreadCounts.map((u) => [u.channelId, u.unread]));

    return NextResponse.json({
      channels: channels.map((ch) => ({
        id: ch.id,
        name: ch.name,
        slug: ch.slug,
        description: ch.description,
        type: ch.type,
        memberCount: ch._count.members,
        messageCount: ch._count.messages,
        unread: unreadMap[ch.id] || 0,
        userRole: ch.members[0]?.role || null,
        isMuted: ch.members[0]?.mutedUntil ? ch.members[0].mutedUntil > new Date() : false,
      })),
    });
  } catch (error) {
    console.error("Channels list error:", error);
    return NextResponse.json({ error: "Failed to fetch channels" }, { status: 500 });
  }
}

// POST /api/community/channels — create a channel (admin only)
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== "ADMIN" && user?.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { name, description, type } = await req.json();

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const slug = name
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const channel = await prisma.chatChannel.create({
      data: {
        name,
        slug,
        description: description || null,
        type: type || "PUBLIC",
        members: {
          create: { userId: session.user.id, role: "ADMIN" },
        },
      },
    });

    return NextResponse.json({ channel });
  } catch (error) {
    console.error("Channel create error:", error);
    return NextResponse.json({ error: "Failed to create channel" }, { status: 500 });
  }
}
