import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logAdminAction } from "@/lib/audit";

// ── GET: List live chat sessions for admin ──
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const filter = req.nextUrl.searchParams.get("filter") || "active";
  const search = req.nextUrl.searchParams.get("search") || "";

  const where: Record<string, unknown> = {};

  if (filter === "waiting") {
    where.status = "WAITING";
  } else if (filter === "active") {
    where.status = { in: ["WAITING", "ACTIVE", "BOT"] };
  } else if (filter === "mine") {
    where.assignedAdminId = session.user.id;
    where.status = { in: ["ACTIVE", "WAITING"] };
  } else if (filter === "closed") {
    where.status = "CLOSED";
  }

  if (search) {
    where.OR = [
      { visitorName: { contains: search, mode: "insensitive" } },
      { visitorEmail: { contains: search, mode: "insensitive" } },
    ];
  }

  const [sessions, stats] = await Promise.all([
    prisma.liveChatSession.findMany({
      where,
      include: {
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
        assignedAdmin: { select: { id: true, firstName: true, lastName: true, displayName: true, avatar: true } },
        _count: { select: { messages: true } },
      },
      orderBy: [
        { status: "asc" }, // WAITING first
        { lastActivity: "desc" },
      ],
      take: 50,
    }),
    Promise.all([
      prisma.liveChatSession.count({ where: { status: "WAITING" } }),
      prisma.liveChatSession.count({ where: { status: "ACTIVE" } }),
      prisma.liveChatSession.count({ where: { status: { in: ["WAITING", "ACTIVE", "BOT"] } } }),
    ]),
  ]);

  return NextResponse.json({
    sessions,
    stats: {
      waiting: stats[0],
      active: stats[1],
      total: stats[2],
    },
  });
}

// ── POST: Admin actions on live chat ──
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { action } = body;

  // ── Claim a chat session ──
  if (action === "claim") {
    const { sessionId } = body;
    if (!sessionId) return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });

    const chatSession = await prisma.liveChatSession.findUnique({ where: { id: sessionId } });
    if (!chatSession) return NextResponse.json({ error: "Session not found" }, { status: 404 });

    const updated = await prisma.liveChatSession.update({
      where: { id: sessionId },
      data: { assignedAdminId: session.user.id, status: "ACTIVE" },
    });

    // Send system message
    await prisma.liveChatMessage.create({
      data: {
        sessionId,
        content: `${session.user.name || "An admin"} has joined the chat. How can we help you?`,
        senderType: "BOT",
      },
    });

    await logAdminAction({
      action: "CLAIM",
      entity: "LiveChatSession",
      entityId: sessionId,
      details: { visitorName: chatSession.visitorName },
    });

    return NextResponse.json({ session: updated });
  }

  // ── Send a message ──
  if (action === "message") {
    const { sessionId, content } = body;
    if (!sessionId || !content?.trim()) {
      return NextResponse.json({ error: "Missing sessionId or content" }, { status: 400 });
    }

    const chatSession = await prisma.liveChatSession.findUnique({ where: { id: sessionId } });
    if (!chatSession) return NextResponse.json({ error: "Session not found" }, { status: 404 });

    // Auto-claim if not already assigned
    if (!chatSession.assignedAdminId) {
      await prisma.liveChatSession.update({
        where: { id: sessionId },
        data: { assignedAdminId: session.user.id, status: "ACTIVE" },
      });
    }

    const message = await prisma.liveChatMessage.create({
      data: {
        sessionId,
        content: content.trim(),
        senderType: "ADMIN",
        senderId: session.user.id,
      },
    });

    await prisma.liveChatSession.update({
      where: { id: sessionId },
      data: { lastActivity: new Date(), status: "ACTIVE" },
    });

    return NextResponse.json({ message });
  }

  // ── Close a chat session ──
  if (action === "close") {
    const { sessionId } = body;
    if (!sessionId) return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });

    await prisma.liveChatMessage.create({
      data: {
        sessionId,
        content: "This chat has been closed. Thank you for contacting The Integrity Man Network!",
        senderType: "BOT",
      },
    });

    const updated = await prisma.liveChatSession.update({
      where: { id: sessionId },
      data: { status: "CLOSED" },
    });

    await logAdminAction({
      action: "CLOSE",
      entity: "LiveChatSession",
      entityId: sessionId,
    });

    return NextResponse.json({ session: updated });
  }

  // ── Get messages for a specific session ──
  if (action === "messages") {
    const { sessionId } = body;
    if (!sessionId) return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });

    const chatSession = await prisma.liveChatSession.findUnique({
      where: { id: sessionId },
      include: {
        messages: { orderBy: { createdAt: "asc" } },
        assignedAdmin: { select: { id: true, firstName: true, lastName: true, displayName: true, avatar: true } },
      },
    });

    if (!chatSession) return NextResponse.json({ error: "Session not found" }, { status: 404 });

    return NextResponse.json({ session: chatSession });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
