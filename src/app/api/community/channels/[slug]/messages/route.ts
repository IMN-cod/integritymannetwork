import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/community/channels/[slug]/messages — get channel messages
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = await params;
    const url = new URL(req.url);
    const cursor = url.searchParams.get("cursor");
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 100);

    const channel = await prisma.chatChannel.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        type: true,
        _count: { select: { members: true } },
      },
    });

    if (!channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }

    // Auto-join public channels
    if (channel.type === "PUBLIC") {
      const existing = await prisma.channelMember.findUnique({
        where: { channelId_userId: { channelId: channel.id, userId: session.user.id } },
      });
      if (!existing) {
        await prisma.channelMember.create({
          data: { channelId: channel.id, userId: session.user.id },
        });
      }
    }

    const messages = await prisma.chatMessage.findMany({
      where: {
        channelId: channel.id,
        isDeleted: false,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = messages.length > limit;
    const items = (hasMore ? messages.slice(0, limit) : messages).reverse();

    // Get online members (users who have sent messages in last 15 min)
    const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000);
    const recentActive = await prisma.chatMessage.findMany({
      where: {
        channelId: channel.id,
        createdAt: { gte: fifteenMinAgo },
      },
      select: {
        userId: true,
        user: {
          select: { id: true, firstName: true, lastName: true, avatar: true, role: true },
        },
      },
      distinct: ["userId"],
    });

    // Also get channel members
    const members = await prisma.channelMember.findMany({
      where: { channelId: channel.id },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, avatar: true, role: true },
        },
      },
      take: 50,
    });

    return NextResponse.json({
      channel,
      messages: items.map((m) => ({
        id: m.id,
        content: m.content,
        type: m.type,
        mediaUrl: m.mediaUrl,
        isEdited: m.isEdited,
        parentId: m.parentId,
        createdAt: m.createdAt,
        user: {
          id: m.user.id,
          name: `${m.user.firstName} ${m.user.lastName}`,
          avatar: m.user.avatar,
          role: m.user.role,
        },
      })),
      hasMore,
      nextCursor: hasMore ? messages[limit - 1]?.id : null,
      onlineUsers: recentActive.map((r) => ({
        id: r.user.id,
        name: `${r.user.firstName} ${r.user.lastName}`,
        avatar: r.user.avatar,
        role: r.user.role,
      })),
      members: members.map((m) => ({
        id: m.user.id,
        name: `${m.user.firstName} ${m.user.lastName}`,
        avatar: m.user.avatar,
        role: m.user.role,
        channelRole: m.role,
      })),
    });
  } catch (error) {
    console.error("Channel messages error:", error);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}

// POST /api/community/channels/[slug]/messages — send a message
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = await params;
    const { content, type, mediaUrl, parentId } = await req.json();

    if (!content?.trim()) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    const channel = await prisma.chatChannel.findUnique({
      where: { slug },
      select: { id: true, type: true },
    });

    if (!channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }

    // Check if user is a member (or auto-join public)
    let member = await prisma.channelMember.findUnique({
      where: { channelId_userId: { channelId: channel.id, userId: session.user.id } },
    });

    if (!member && channel.type === "PUBLIC") {
      member = await prisma.channelMember.create({
        data: { channelId: channel.id, userId: session.user.id },
      });
    }

    if (!member) {
      return NextResponse.json({ error: "You are not a member of this channel" }, { status: 403 });
    }

    // Check if muted
    if (member.mutedUntil && member.mutedUntil > new Date()) {
      return NextResponse.json({ error: "You are muted in this channel" }, { status: 403 });
    }

    const message = await prisma.chatMessage.create({
      data: {
        channelId: channel.id,
        userId: session.user.id,
        content: content.trim(),
        type: type || "TEXT",
        mediaUrl: mediaUrl || null,
        parentId: parentId || null,
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, avatar: true, role: true },
        },
      },
    });

    return NextResponse.json({
      message: {
        id: message.id,
        content: message.content,
        type: message.type,
        mediaUrl: message.mediaUrl,
        isEdited: message.isEdited,
        parentId: message.parentId,
        createdAt: message.createdAt,
        user: {
          id: message.user.id,
          name: `${message.user.firstName} ${message.user.lastName}`,
          avatar: message.user.avatar,
          role: message.user.role,
        },
      },
    });
  } catch (error) {
    console.error("Send message error:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
