import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/community/members — get online/active community members
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const search = url.searchParams.get("search") || "";

    // "Active" = users who sent messages in last 30 minutes
    const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000);

    const recentSenders = await prisma.chatMessage.findMany({
      where: { createdAt: { gte: thirtyMinAgo } },
      select: { userId: true },
      distinct: ["userId"],
    });
    const onlineIds = new Set(recentSenders.map((s) => s.userId));

    // Get members (for search or listing)
    const where = search
      ? {
          isActive: true,
          OR: [
            { firstName: { contains: search, mode: "insensitive" as const } },
            { lastName: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : { isActive: true };

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        avatar: true,
        role: true,
        bio: true,
      },
      take: 50,
      orderBy: { firstName: "asc" },
    });

    return NextResponse.json({
      members: users.map((u) => ({
        id: u.id,
        name: `${u.firstName} ${u.lastName}`,
        avatar: u.avatar,
        role: u.role,
        bio: u.bio,
        isOnline: onlineIds.has(u.id),
      })),
    });
  } catch (error) {
    console.error("Members error:", error);
    return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 });
  }
}
