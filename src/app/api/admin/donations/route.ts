import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/admin/donations — List all donations with stats
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (
      !session?.user ||
      !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const method = searchParams.get("method") || "";

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { paymentId: { contains: search, mode: "insensitive" } },
        { donorName: { contains: search, mode: "insensitive" } },
        { donorEmail: { contains: search, mode: "insensitive" } },
        { user: { firstName: { contains: search, mode: "insensitive" } } },
        { user: { lastName: { contains: search, mode: "insensitive" } } },
        { user: { email: { contains: search, mode: "insensitive" } } },
      ];
    }
    if (status) where.status = status;
    if (method) where.paymentMethod = method;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [donations, total, totalSum, monthSum, lastMonthSum, recurringCount, paidCount, pendingCount, failedCount] =
      await Promise.all([
        prisma.donation.findMany({
          where,
          select: {
            id: true,
            amount: true,
            currency: true,
            paymentMethod: true,
            paymentId: true,
            status: true,
            isRecurring: true,
            anonymous: true,
            donorName: true,
            donorEmail: true,
            message: true,
            createdAt: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.donation.count({ where }),
        prisma.donation.aggregate({
          _sum: { amount: true },
          where: { status: "PAID" },
        }),
        prisma.donation.aggregate({
          _sum: { amount: true },
          where: { status: "PAID", createdAt: { gte: startOfMonth } },
        }),
        prisma.donation.aggregate({
          _sum: { amount: true },
          where: { status: "PAID", createdAt: { gte: startOfLastMonth, lt: startOfMonth } },
        }),
        prisma.donation.count({ where: { isRecurring: true } }),
        prisma.donation.count({ where: { status: "PAID" } }),
        prisma.donation.count({ where: { status: "PENDING" } }),
        prisma.donation.count({ where: { status: "FAILED" } }),
      ]);

    return NextResponse.json({
      donations,
      stats: {
        total: Number(totalSum._sum.amount || 0),
        thisMonth: Number(monthSum._sum.amount || 0),
        lastMonth: Number(lastMonthSum._sum.amount || 0),
        recurringDonors: recurringCount,
        count: total,
        paid: paidCount,
        pending: pendingCount,
        failed: failedCount,
      },
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[ADMIN_DONATIONS_GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch donations" },
      { status: 500 }
    );
  }
}
