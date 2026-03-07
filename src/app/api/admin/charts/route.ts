import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/admin/charts — Time-series data for dashboard charts
export async function GET() {
  try {
    const session = await auth();
    if (
      !session?.user ||
      !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const months: { label: string; start: Date; end: Date }[] = [];

    // Generate last 6 months
    for (let i = 5; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);
      const label = start.toLocaleDateString("en-US", { month: "short" });
      months.push({ label, start, end });
    }

    // Run all monthly queries in parallel
    const [
      monthlyRevenue,
      monthlyDonations,
      monthlyUsers,
      monthlyOrders,
      // Content breakdown
      totalPosts,
      publishedPosts,
      draftPosts,
      totalEvents,
      upcomingEvents,
      pastEvents,
      totalProducts,
      activeProducts,
      inactiveProducts,
      // Top donors
      topDonors,
      // Recent orders
      recentOrders,
      // Daily signups last 14 days
      dailySignups,
    ] = await Promise.all([
      // Monthly revenue (6 months)
      Promise.all(
        months.map((m) =>
          prisma.order.aggregate({
            _sum: { total: true },
            where: {
              paymentStatus: "PAID",
              createdAt: { gte: m.start, lte: m.end },
            },
          })
        )
      ),
      // Monthly donations (6 months)
      Promise.all(
        months.map((m) =>
          prisma.donation.aggregate({
            _sum: { amount: true },
            where: {
              status: "PAID",
              createdAt: { gte: m.start, lte: m.end },
            },
          })
        )
      ),
      // Monthly new users (6 months)
      Promise.all(
        months.map((m) =>
          prisma.user.count({
            where: { createdAt: { gte: m.start, lte: m.end } },
          })
        )
      ),
      // Monthly orders (6 months)
      Promise.all(
        months.map((m) =>
          prisma.order.count({
            where: { createdAt: { gte: m.start, lte: m.end } },
          })
        )
      ),
      // Content breakdown
      prisma.blogPost.count(),
      prisma.blogPost.count({ where: { status: "PUBLISHED" } }),
      prisma.blogPost.count({ where: { status: "DRAFT" } }),
      prisma.event.count(),
      prisma.event.count({ where: { startDate: { gte: now } } }),
      prisma.event.count({ where: { startDate: { lt: now } } }),
      prisma.product.count(),
      prisma.product.count({ where: { isActive: true } }),
      prisma.product.count({ where: { isActive: false } }),
      // Top donors (top 5)
      prisma.donation.groupBy({
        by: ["userId"],
        _sum: { amount: true },
        _count: true,
        where: { status: "PAID", userId: { not: null } },
        orderBy: { _sum: { amount: "desc" } },
        take: 5,
      }),
      // Recent orders (last 5)
      prisma.order.findMany({
        select: {
          id: true,
          orderNumber: true,
          total: true,
          paymentStatus: true,
          createdAt: true,
          user: { select: { firstName: true, lastName: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      // Daily signups last 14 days
      Promise.all(
        Array.from({ length: 14 }, (_, i) => {
          const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 13 + i);
          const dayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 13 + i, 23, 59, 59, 999);
          return prisma.user.count({
            where: { createdAt: { gte: dayStart, lte: dayEnd } },
          });
        })
      ),
    ]);

    // Resolve top donor user info
    const donorUserIds = topDonors
      .map((d) => d.userId)
      .filter((id): id is string => id !== null);
    const donorUsers = donorUserIds.length
      ? await prisma.user.findMany({
          where: { id: { in: donorUserIds } },
          select: { id: true, firstName: true, lastName: true, email: true },
        })
      : [];
    const donorMap = new Map(donorUsers.map((u) => [u.id, u]));

    // Build response
    const revenueChart = months.map((m, i) => ({
      month: m.label,
      revenue: Number(monthlyRevenue[i]._sum.total || 0) / 100,
      donations: Number(monthlyDonations[i]._sum.amount || 0) / 100,
    }));

    const growthChart = months.map((m, i) => ({
      month: m.label,
      users: monthlyUsers[i],
      orders: monthlyOrders[i],
    }));

    const dailySignupsChart = Array.from({ length: 14 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 13 + i);
      return {
        day: d.toLocaleDateString("en-US", { weekday: "short", day: "numeric" }),
        signups: dailySignups[i],
      };
    });

    const contentBreakdown = [
      { name: "Published", value: publishedPosts, color: "#f97316" },
      { name: "Drafts", value: draftPosts, color: "#d1d5db" },
    ];

    const eventBreakdown = [
      { name: "Upcoming", value: upcomingEvents, color: "#f97316" },
      { name: "Past", value: pastEvents, color: "#d1d5db" },
    ];

    const productBreakdown = [
      { name: "Active", value: activeProducts, color: "#22c55e" },
      { name: "Inactive", value: inactiveProducts, color: "#d1d5db" },
    ];

    const topDonorsData = topDonors.map((d) => {
      const user = d.userId ? donorMap.get(d.userId) : null;
      return {
        name: user ? `${user.firstName} ${user.lastName}` : "Anonymous",
        email: user?.email || "",
        total: Number(d._sum.amount || 0) / 100,
        count: d._count,
      };
    });

    const recentOrdersData = recentOrders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      total: Number(o.total) / 100,
      status: o.paymentStatus,
      date: o.createdAt.toISOString(),
      customer: o.user
        ? `${o.user.firstName} ${o.user.lastName}`
        : "Guest",
    }));

    return NextResponse.json({
      revenueChart,
      growthChart,
      dailySignupsChart,
      contentBreakdown,
      eventBreakdown,
      productBreakdown,
      topDonors: topDonorsData,
      recentOrders: recentOrdersData,
      totals: {
        posts: totalPosts,
        events: totalEvents,
        products: totalProducts,
      },
    });
  } catch (error) {
    console.error("[ADMIN_CHARTS_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to fetch chart data" },
      { status: 500 }
    );
  }
}
