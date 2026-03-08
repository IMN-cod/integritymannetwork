import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const profileUpdateSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters").optional(),
  lastName: z.string().min(2, "Last name must be at least 2 characters").optional(),
  displayName: z.string().min(2).max(50).optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  bio: z.string().max(500).optional().nullable(),
  avatar: z.string().url().optional().nullable(),
  // Notification preferences stored as JSON
  notifyCommunity: z.boolean().optional(),
  notifyBlog: z.boolean().optional(),
  notifyEvents: z.boolean().optional(),
  notifyOrders: z.boolean().optional(),
  notifyPromotions: z.boolean().optional(),
});

// GET /api/user/profile — Get current user profile
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        displayName: true,
        avatar: true,
        phone: true,
        bio: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        // Check if user has a password (for showing password change form)
        password: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get notification preferences from SiteSetting (user-specific keys)
    const prefKeys = [
      `user_${user.id}_notifyBlog`,
      `user_${user.id}_notifyCommunity`,
      `user_${user.id}_notifyEvents`,
      `user_${user.id}_notifyOrders`,
      `user_${user.id}_notifyPromotions`,
    ];

    const prefs = await prisma.siteSetting.findMany({
      where: { key: { in: prefKeys } },
    });

    const prefsMap: Record<string, boolean> = {};
    for (const p of prefs) {
      const shortKey = p.key.replace(`user_${user.id}_`, "");
      prefsMap[shortKey] = p.value === "true";
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        displayName: user.displayName,
        avatar: user.avatar,
        phone: user.phone,
        bio: user.bio,
        role: user.role,
        hasPassword: !!user.password,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      preferences: {
        notifyCommunity: prefsMap.notifyCommunity ?? true,
        notifyBlog: prefsMap.notifyBlog ?? true,
        notifyEvents: prefsMap.notifyEvents ?? true,
        notifyOrders: prefsMap.notifyOrders ?? true,
        notifyPromotions: prefsMap.notifyPromotions ?? false,
      },
    });
  } catch (error) {
    console.error("[USER_PROFILE_GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

// PATCH /api/user/profile — Update current user profile
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validation = profileUpdateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Separate notification preferences from profile data
    const {
      notifyCommunity,
      notifyBlog,
      notifyEvents,
      notifyOrders,
      notifyPromotions,
      ...profileData
    } = data;

    // Update user profile
    const updateData: Record<string, unknown> = {};
    if (profileData.firstName !== undefined) updateData.firstName = profileData.firstName;
    if (profileData.lastName !== undefined) updateData.lastName = profileData.lastName;
    if (profileData.displayName !== undefined) updateData.displayName = profileData.displayName;
    if (profileData.phone !== undefined) updateData.phone = profileData.phone;
    if (profileData.bio !== undefined) updateData.bio = profileData.bio;
    if (profileData.avatar !== undefined) updateData.avatar = profileData.avatar;

    let updatedUser = null;
    if (Object.keys(updateData).length > 0) {
      updatedUser = await prisma.user.update({
        where: { id: session.user.id },
        data: updateData,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          displayName: true,
          avatar: true,
          phone: true,
          bio: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    }

    // Update notification preferences
    const prefUpdates: { key: string; value: string }[] = [];
    if (notifyCommunity !== undefined) prefUpdates.push({ key: `user_${session.user.id}_notifyCommunity`, value: String(notifyCommunity) });
    if (notifyBlog !== undefined) prefUpdates.push({ key: `user_${session.user.id}_notifyBlog`, value: String(notifyBlog) });
    if (notifyEvents !== undefined) prefUpdates.push({ key: `user_${session.user.id}_notifyEvents`, value: String(notifyEvents) });
    if (notifyOrders !== undefined) prefUpdates.push({ key: `user_${session.user.id}_notifyOrders`, value: String(notifyOrders) });
    if (notifyPromotions !== undefined) prefUpdates.push({ key: `user_${session.user.id}_notifyPromotions`, value: String(notifyPromotions) });

    if (prefUpdates.length > 0) {
      await Promise.all(
        prefUpdates.map((p) =>
          prisma.siteSetting.upsert({
            where: { key: p.key },
            update: { value: p.value },
            create: { key: p.key, value: p.value, type: "boolean" },
          })
        )
      );
    }

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    console.error("[USER_PROFILE_PATCH]", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
