import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAdminAction } from "@/lib/audit";

// ──────────────────────────────────────────────────────────
// GET  /api/admin/chat — list all conversations (admin view)
// POST /api/admin/chat — admin sends a DM to a user
// ──────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });
    if (admin?.role !== "ADMIN" && admin?.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const url = new URL(req.url);
    const filter = url.searchParams.get("filter") || "all"; // all | mine | unread
    const search = url.searchParams.get("search") || "";

    // Get conversations involving this admin, or all if super admin
    const where: Record<string, unknown> = {};

    if (filter === "mine") {
      where.OR = [{ user1Id: session.user.id }, { user2Id: session.user.id }];
    } else if (filter === "unread") {
      where.messages = { some: { isRead: false } };
    }

    const conversations = await prisma.conversation.findMany({
      where,
      include: {
        user1: { select: { id: true, firstName: true, lastName: true, avatar: true, role: true, email: true } },
        user2: { select: { id: true, firstName: true, lastName: true, avatar: true, role: true, email: true } },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { content: true, createdAt: true, isRead: true, senderId: true, isBot: true },
        },
      },
      orderBy: { lastMessageAt: "desc" },
      take: 100,
    });

    // Search filter
    let filtered = conversations;
    if (search) {
      const s = search.toLowerCase();
      filtered = conversations.filter((c) => {
        const name1 = `${c.user1.firstName} ${c.user1.lastName}`.toLowerCase();
        const name2 = `${c.user2.firstName} ${c.user2.lastName}`.toLowerCase();
        return name1.includes(s) || name2.includes(s) || c.user1.email.includes(s) || c.user2.email.includes(s);
      });
    }

    // Unread counts
    const unreadCounts = await Promise.all(
      filtered.map(async (c) => {
        const count = await prisma.directMessage.count({
          where: { conversationId: c.id, isRead: false },
        });
        return { id: c.id, count };
      })
    );
    const unreadMap = Object.fromEntries(unreadCounts.map((u) => [u.id, u.count]));

    // Bot responses
    const botResponses = await prisma.botResponse.findMany({
      orderBy: { priority: "desc" },
    });

    // Stats
    const totalConversations = await prisma.conversation.count();
    const totalMessages = await prisma.directMessage.count();
    const totalUnread = await prisma.directMessage.count({ where: { isRead: false } });

    return NextResponse.json({
      conversations: filtered.map((c) => ({
        id: c.id,
        user1: { id: c.user1.id, name: `${c.user1.firstName} ${c.user1.lastName}`, avatar: c.user1.avatar, role: c.user1.role, email: c.user1.email },
        user2: { id: c.user2.id, name: `${c.user2.firstName} ${c.user2.lastName}`, avatar: c.user2.avatar, role: c.user2.role, email: c.user2.email },
        lastMessage: c.messages[0] || null,
        unread: unreadMap[c.id] || 0,
        lastMessageAt: c.lastMessageAt,
      })),
      botResponses,
      stats: { totalConversations, totalMessages, totalUnread },
    });
  } catch (error) {
    console.error("Admin chat GET:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });
    if (admin?.role !== "ADMIN" && admin?.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { action } = body;

    // ── Send DM to user ──
    if (action === "send") {
      const { userId, content } = body;
      if (!userId || !content?.trim()) {
        return NextResponse.json({ error: "User and message required" }, { status: 400 });
      }

      const [u1, u2] = [session.user.id, userId].sort();
      let conversation = await prisma.conversation.findUnique({
        where: { user1Id_user2Id: { user1Id: u1, user2Id: u2 } },
      });
      if (!conversation) {
        conversation = await prisma.conversation.create({
          data: { user1Id: u1, user2Id: u2 },
        });
      }

      const message = await prisma.directMessage.create({
        data: {
          conversationId: conversation.id,
          senderId: session.user.id,
          receiverId: userId,
          content: content.trim(),
        },
      });

      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { lastMessageAt: new Date() },
      });

      await logAdminAction({ action: "SEND_MESSAGE", entity: "DirectMessage", entityId: message.id, details: { recipientId: userId, content: content.trim().slice(0, 100) } });

      return NextResponse.json({ message, conversationId: conversation.id });
    }

    // ── Create/update bot response ──
    if (action === "bot_create" || action === "bot_update") {
      const { id, trigger, response, category, isActive, priority } = body;

      if (!trigger || !response) {
        return NextResponse.json({ error: "Trigger and response required" }, { status: 400 });
      }

      if (action === "bot_update" && id) {
        const updated = await prisma.botResponse.update({
          where: { id },
          data: { trigger, response, category: category || null, isActive: isActive ?? true, priority: priority ?? 0 },
        });
        await logAdminAction({ action: "BOT_UPDATE", entity: "BotResponse", entityId: id, details: { trigger, isActive } });
        return NextResponse.json({ botResponse: updated });
      }

      const created = await prisma.botResponse.create({
        data: { trigger, response, category: category || null, isActive: isActive ?? true, priority: priority ?? 0 },
      });
      await logAdminAction({ action: "BOT_CREATE", entity: "BotResponse", entityId: created.id, details: { trigger, category } });
      return NextResponse.json({ botResponse: created });
    }

    // ── Delete bot response ──
    if (action === "bot_delete") {
      const { id } = body;
      if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
      await prisma.botResponse.delete({ where: { id } });
      await logAdminAction({ action: "BOT_DELETE", entity: "BotResponse", entityId: id });
      return NextResponse.json({ success: true });
    }

    // ── Broadcast message to all users ──
    if (action === "broadcast") {
      const { content } = body;
      if (!content?.trim()) {
        return NextResponse.json({ error: "Content required" }, { status: 400 });
      }

      // Get all active users (except admin)
      const users = await prisma.user.findMany({
        where: { isActive: true, id: { not: session.user.id } },
        select: { id: true },
      });

      let sent = 0;
      for (const user of users) {
        const [u1, u2] = [session.user.id, user.id].sort();
        let conv = await prisma.conversation.findUnique({
          where: { user1Id_user2Id: { user1Id: u1, user2Id: u2 } },
        });
        if (!conv) {
          conv = await prisma.conversation.create({ data: { user1Id: u1, user2Id: u2 } });
        }

        await prisma.directMessage.create({
          data: {
            conversationId: conv.id,
            senderId: session.user.id,
            receiverId: user.id,
            content: content.trim(),
          },
        });
        await prisma.conversation.update({ where: { id: conv.id }, data: { lastMessageAt: new Date() } });
        sent++;
      }

      await logAdminAction({ action: "BROADCAST", entity: "DirectMessage", details: { recipientCount: sent, contentPreview: content.trim().slice(0, 100) } });

      return NextResponse.json({ success: true, sent });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Admin chat POST:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
