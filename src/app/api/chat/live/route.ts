import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// ── GET: Retrieve session & messages by token ──
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "Missing session token" }, { status: 400 });
  }

  const session = await prisma.liveChatSession.findUnique({
    where: { sessionToken: token },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
      assignedAdmin: { select: { firstName: true, lastName: true, displayName: true, avatar: true } },
    },
  });

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  return NextResponse.json({ session });
}

// ── POST: Start session or send message ──
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action } = body;

  // ── Start a new chat session ──
  if (action === "start") {
    const authSession = await auth();
    const userId = authSession?.user?.id || null;

    const session = await prisma.liveChatSession.create({
      data: {
        userId,
        status: "BOT",
      },
      include: { messages: true },
    });

    // Send initial bot greeting
    await prisma.liveChatMessage.create({
      data: {
        sessionId: session.id,
        content: "Welcome to The Integrity Man Network! 👋 I'm here to help connect you with our team. What's your name?",
        senderType: "BOT",
      },
    });

    return NextResponse.json({
      sessionToken: session.sessionToken,
      sessionId: session.id,
    }, { status: 201 });
  }

  // ── Send a message in an existing session ──
  if (action === "message") {
    const { token, content } = body;
    if (!token || !content?.trim()) {
      return NextResponse.json({ error: "Missing token or content" }, { status: 400 });
    }

    const session = await prisma.liveChatSession.findUnique({
      where: { sessionToken: token },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (session.status === "CLOSED") {
      return NextResponse.json({ error: "This chat session has ended" }, { status: 400 });
    }

    // Save visitor message
    await prisma.liveChatMessage.create({
      data: {
        sessionId: session.id,
        content: content.trim(),
        senderType: "VISITOR",
      },
    });

    // Update last activity
    await prisma.liveChatSession.update({
      where: { id: session.id },
      data: { lastActivity: new Date() },
    });

    // Handle bot flow
    if (session.status === "BOT") {
      const visitorMessages = session.messages.filter((m: { senderType: string }) => m.senderType === "VISITOR");
      const step = visitorMessages.length; // 0-indexed (before adding current)

      let botReply = "";
      const updates: Record<string, string> = {};

      if (step === 0) {
        // Just got their name
        updates.visitorName = content.trim();
        botReply = `Nice to meet you, ${content.trim()}! What's your email address so our team can follow up with you?`;
      } else if (step === 1) {
        // Just got their email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(content.trim())) {
          botReply = "That doesn't look like a valid email. Could you try again?";
        } else {
          updates.visitorEmail = content.trim();
          botReply = "Great! How can we help you today? Please describe your question or concern and an admin will be with you shortly.";
        }
      } else if (step === 2) {
        // Got their question — escalate to admin
        botReply = "Thank you! I've notified our team. An admin will be with you shortly. Feel free to add more details while you wait.";

        await prisma.liveChatSession.update({
          where: { id: session.id },
          data: { ...updates, status: "WAITING" },
        });

        // Notify admins
        const admins = await prisma.user.findMany({
          where: { role: { in: ["ADMIN", "SUPER_ADMIN"] }, isActive: true },
          select: { id: true },
        });
        if (admins.length > 0) {
          await prisma.notification.createMany({
            data: admins.map(a => ({
              userId: a.id,
              title: "New Live Chat",
              message: `${session.visitorName || "A visitor"} is waiting for support.`,
              type: "LIVE_CHAT",
              link: "/admin/chat",
            })),
          });
        }

        // Save bot reply and return early (status already updated)
        await prisma.liveChatMessage.create({
          data: { sessionId: session.id, content: botReply, senderType: "BOT" },
        });

        const updated = await prisma.liveChatSession.findUnique({
          where: { id: session.id },
          include: {
            messages: { orderBy: { createdAt: "asc" } },
            assignedAdmin: { select: { firstName: true, lastName: true, displayName: true, avatar: true } },
          },
        });

        return NextResponse.json({ session: updated });
      }

      // Update session with collected info (for steps 0 and 1)
      if (Object.keys(updates).length > 0) {
        await prisma.liveChatSession.update({
          where: { id: session.id },
          data: updates,
        });
      }

      if (botReply) {
        await prisma.liveChatMessage.create({
          data: { sessionId: session.id, content: botReply, senderType: "BOT" },
        });
      }
    }

    // Return updated session
    const updated = await prisma.liveChatSession.findUnique({
      where: { id: session.id },
      include: {
        messages: { orderBy: { createdAt: "asc" } },
        assignedAdmin: { select: { firstName: true, lastName: true, displayName: true, avatar: true } },
      },
    });

    return NextResponse.json({ session: updated });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
