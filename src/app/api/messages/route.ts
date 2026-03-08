import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ───────────────────────────────────────────────────
// GET  /api/messages — list conversations
// POST /api/messages — start new conversation / send DM
// ───────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const conversationId = url.searchParams.get("conversationId");

    // If conversationId provided, return messages for that conversation
    if (conversationId) {
      const conv = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: {
          user1: { select: { id: true, firstName: true, lastName: true, avatar: true, role: true } },
          user2: { select: { id: true, firstName: true, lastName: true, avatar: true, role: true } },
        },
      });

      if (!conv || (conv.user1Id !== session.user.id && conv.user2Id !== session.user.id)) {
        return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
      }

      // Mark messages as read
      await prisma.directMessage.updateMany({
        where: { conversationId, receiverId: session.user.id, isRead: false },
        data: { isRead: true },
      });

      const cursor = url.searchParams.get("cursor");
      const limit = 50;

      const messages = await prisma.directMessage.findMany({
        where: { conversationId, isDeleted: false },
        include: {
          sender: { select: { id: true, firstName: true, lastName: true, avatar: true, role: true } },
        },
        orderBy: { createdAt: "desc" },
        take: limit + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      });

      const hasMore = messages.length > limit;
      const items = (hasMore ? messages.slice(0, limit) : messages).reverse();

      const otherUser = conv.user1Id === session.user.id ? conv.user2 : conv.user1;

      return NextResponse.json({
        conversation: {
          id: conv.id,
          otherUser: {
            id: otherUser.id,
            name: `${otherUser.firstName} ${otherUser.lastName}`,
            avatar: otherUser.avatar,
            role: otherUser.role,
          },
        },
        messages: items.map((m) => ({
          id: m.id,
          content: m.content,
          type: m.type,
          mediaUrl: m.mediaUrl,
          isRead: m.isRead,
          isEdited: m.isEdited,
          isBot: m.isBot,
          createdAt: m.createdAt,
          sender: {
            id: m.sender.id,
            name: `${m.sender.firstName} ${m.sender.lastName}`,
            avatar: m.sender.avatar,
            role: m.sender.role,
          },
          isMine: m.senderId === session.user.id,
        })),
        hasMore,
      });
    }

    // Return list of conversations
    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [{ user1Id: session.user.id }, { user2Id: session.user.id }],
      },
      include: {
        user1: { select: { id: true, firstName: true, lastName: true, avatar: true, role: true } },
        user2: { select: { id: true, firstName: true, lastName: true, avatar: true, role: true } },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { content: true, createdAt: true, isRead: true, senderId: true, isBot: true },
        },
      },
      orderBy: { lastMessageAt: "desc" },
    });

    // Unread counts
    const unreadCounts = await Promise.all(
      conversations.map(async (c) => {
        const count = await prisma.directMessage.count({
          where: { conversationId: c.id, receiverId: session.user.id, isRead: false },
        });
        return { id: c.id, count };
      })
    );
    const unreadMap = Object.fromEntries(unreadCounts.map((u) => [u.id, u.count]));

    return NextResponse.json({
      conversations: conversations.map((c) => {
        const otherUser = c.user1Id === session.user.id ? c.user2 : c.user1;
        const lastMsg = c.messages[0] || null;
        return {
          id: c.id,
          otherUser: {
            id: otherUser.id,
            name: `${otherUser.firstName} ${otherUser.lastName}`,
            avatar: otherUser.avatar,
            role: otherUser.role,
          },
          lastMessage: lastMsg
            ? {
                content: lastMsg.content,
                createdAt: lastMsg.createdAt,
                isRead: lastMsg.isRead,
                isMine: lastMsg.senderId === session.user.id,
                isBot: lastMsg.isBot,
              }
            : null,
          unread: unreadMap[c.id] || 0,
        };
      }),
    });
  } catch (error) {
    console.error("Messages GET error:", error);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { receiverId, content, type, mediaUrl } = await req.json();

    if (!receiverId || !content?.trim()) {
      return NextResponse.json({ error: "Receiver and content are required" }, { status: 400 });
    }

    if (receiverId === session.user.id) {
      return NextResponse.json({ error: "Cannot message yourself" }, { status: 400 });
    }

    // Find or create conversation (always store with lower ID as user1)
    const [u1, u2] = [session.user.id, receiverId].sort();

    let conversation = await prisma.conversation.findUnique({
      where: { user1Id_user2Id: { user1Id: u1, user2Id: u2 } },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: { user1Id: u1, user2Id: u2 },
      });
    }

    // Create the message
    const message = await prisma.directMessage.create({
      data: {
        conversationId: conversation.id,
        senderId: session.user.id,
        receiverId,
        content: content.trim(),
        type: type || "TEXT",
        mediaUrl: mediaUrl || null,
      },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, avatar: true, role: true } },
      },
    });

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: new Date() },
    });

    // Check for bot responses (if messaging the system/bot or keyword detected)
    let botReply = null;
    const lowerContent = content.toLowerCase().trim();

    const botResponses = await prisma.botResponse.findMany({
      where: { isActive: true },
      orderBy: { priority: "desc" },
    });

    for (const bot of botResponses) {
      const triggers = bot.trigger.toLowerCase().split(",").map((t: string) => t.trim());
      const matched = triggers.some((trigger: string) => {
        if (trigger.startsWith("/")) {
          // Regex pattern
          try {
            const regex = new RegExp(trigger.slice(1, -1), "i");
            return regex.test(lowerContent);
          } catch {
            return false;
          }
        }
        return lowerContent.includes(trigger);
      });

      if (matched) {
        // Create bot reply
        botReply = await prisma.directMessage.create({
          data: {
            conversationId: conversation.id,
            senderId: receiverId, // Reply comes "from" the other user
            receiverId: session.user.id,
            content: bot.response,
            isBot: true,
            isRead: false,
          },
        });

        await prisma.botResponse.update({
          where: { id: bot.id },
          data: { useCount: { increment: 1 } },
        });

        await prisma.conversation.update({
          where: { id: conversation.id },
          data: { lastMessageAt: new Date() },
        });

        break;
      }
    }

    return NextResponse.json({
      message: {
        id: message.id,
        content: message.content,
        type: message.type,
        createdAt: message.createdAt,
        isBot: false,
        sender: {
          id: message.sender.id,
          name: `${message.sender.firstName} ${message.sender.lastName}`,
          avatar: message.sender.avatar,
          role: message.sender.role,
        },
        isMine: true,
      },
      conversationId: conversation.id,
      botReply: botReply
        ? { id: botReply.id, content: botReply.content, createdAt: botReply.createdAt, isBot: true }
        : null,
    });
  } catch (error) {
    console.error("Messages POST error:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
