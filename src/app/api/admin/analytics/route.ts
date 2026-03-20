import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/admin/analytics — Comprehensive analytics with geo data
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const range = searchParams.get("range") || "12"; // months
    const monthCount = Math.min(parseInt(range) || 12, 24);

    const now = new Date();

    // ── Generate month ranges ──
    const months: { label: string; shortLabel: string; start: Date; end: Date }[] = [];
    for (let i = monthCount - 1; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);
      months.push({
        label: start.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
        shortLabel: start.toLocaleDateString("en-US", { month: "short" }),
        start,
        end,
      });
    }

    // ── Generate day ranges (last 30 days) ──
    const days: { label: string; start: Date; end: Date }[] = [];
    for (let i = 29; i >= 0; i--) {
      const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const dayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i, 23, 59, 59, 999);
      days.push({
        label: dayStart.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        start: dayStart,
        end: dayEnd,
      });
    }

    // ── Generate hourly slots (for heatmap) ──
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);

    // ═══════════════════════════════════════════
    // PARALLEL DATA FETCHES
    // ═══════════════════════════════════════════

    const [
      // Monthly series
      monthlyRevenue,
      monthlyDonations,
      monthlyUsers,
      monthlyOrders,
      monthlyEvents,
      monthlyBlogPosts,
      // Daily series (30 days)
      dailyRevenue,
      dailyUsers,
      dailyOrders,
      // Totals
      totalUsers,
      totalOrders,
      ,
      totalProducts,
      totalBlogPosts,
      totalEvents,
      totalMessages,
      // Current period
      revenueThisMonth,
      revenueLastMonth,
      ordersThisMonth,
      usersThisMonth,
      donationsThisMonth,
      // Geo: User addresses
      userAddresses,
      // Geo: Order shipping addresses
      allOrders,
      // Product analytics
      topProducts,
      productsByCategory,
      lowStockProducts,
      // Blog analytics
      topBlogPosts,
      blogByCategory,
      // Event analytics
      eventsByType,
      eventRegistrations,
      // Donation analytics
      donationsByCampaign,
      donationsByMethod,
      // Order status breakdown
      ordersByStatus,
      ordersByPayment,
      // User roles
      usersByRole,
      // Activity heatmap (last 7 days orders by hour)
      recentOrders7d,
      // Conversion data
      cartItems,
      completedOrders,
      // Top customers
      topCustomers,
      // Recent activity
      recentActivity,
    ] = await Promise.all([
      // Monthly revenue
      Promise.all(months.map((m) =>
        prisma.order.aggregate({
          _sum: { total: true },
          where: { paymentStatus: "PAID", createdAt: { gte: m.start, lte: m.end } },
        })
      )),
      // Monthly donations
      Promise.all(months.map((m) =>
        prisma.donation.aggregate({
          _sum: { amount: true },
          where: { status: "PAID", createdAt: { gte: m.start, lte: m.end } },
        })
      )),
      // Monthly new users
      Promise.all(months.map((m) =>
        prisma.user.count({ where: { createdAt: { gte: m.start, lte: m.end } } })
      )),
      // Monthly orders
      Promise.all(months.map((m) =>
        prisma.order.count({ where: { createdAt: { gte: m.start, lte: m.end } } })
      )),
      // Monthly events created
      Promise.all(months.map((m) =>
        prisma.event.count({ where: { createdAt: { gte: m.start, lte: m.end } } })
      )),
      // Monthly blog posts
      Promise.all(months.map((m) =>
        prisma.blogPost.count({ where: { createdAt: { gte: m.start, lte: m.end } } })
      )),
      // Daily revenue (30 days)
      Promise.all(days.map((d) =>
        prisma.order.aggregate({
          _sum: { total: true },
          where: { paymentStatus: "PAID", createdAt: { gte: d.start, lte: d.end } },
        })
      )),
      // Daily users (30 days)
      Promise.all(days.map((d) =>
        prisma.user.count({ where: { createdAt: { gte: d.start, lte: d.end } } })
      )),
      // Daily orders (30 days)
      Promise.all(days.map((d) =>
        prisma.order.count({ where: { createdAt: { gte: d.start, lte: d.end } } })
      )),
      // Totals
      prisma.user.count(),
      prisma.order.count(),
      prisma.donation.count(),
      prisma.product.count(),
      prisma.blogPost.count(),
      prisma.event.count(),
      prisma.contactMessage.count(),
      // Revenue this month
      prisma.order.aggregate({
        _sum: { total: true },
        _count: true,
        where: { paymentStatus: "PAID", createdAt: { gte: months[months.length - 1].start } },
      }),
      // Revenue last month
      prisma.order.aggregate({
        _sum: { total: true },
        where: {
          paymentStatus: "PAID",
          createdAt: { gte: months[months.length - 2]?.start || months[0].start, lte: months[months.length - 2]?.end || months[0].end },
        },
      }),
      // Orders this month
      prisma.order.count({ where: { createdAt: { gte: months[months.length - 1].start } } }),
      // Users this month
      prisma.user.count({ where: { createdAt: { gte: months[months.length - 1].start } } }),
      // Donations this month
      prisma.donation.aggregate({
        _sum: { amount: true },
        _count: true,
        where: { status: "PAID", createdAt: { gte: months[months.length - 1].start } },
      }),
      // Geo: User addresses (city/country)
      prisma.address.findMany({
        select: { city: true, state: true, country: true },
      }),
      // Geo: Order shipping addresses (JSON field)
      prisma.order.findMany({
        select: { shippingAddress: true, total: true, createdAt: true },
        where: { paymentStatus: "PAID" },
      }),
      // Top products by sales
      prisma.product.findMany({
        select: { id: true, name: true, salesCount: true, viewCount: true, price: true, stock: true, images: true },
        orderBy: { salesCount: "desc" },
        take: 10,
      }),
      // Products by category
      prisma.productCategory.findMany({
        select: { name: true, _count: { select: { products: true } } },
        orderBy: { name: "asc" },
      }),
      // Low stock products
      prisma.product.findMany({
        where: { isActive: true, stock: { lte: 5 } },
        select: { name: true, stock: true, lowStockAlert: true },
        orderBy: { stock: "asc" },
        take: 10,
      }),
      // Top blog posts by views
      prisma.blogPost.findMany({
        select: { id: true, title: true, viewCount: true, status: true, publishedAt: true },
        orderBy: { viewCount: "desc" },
        take: 10,
      }),
      // Blog posts by category
      prisma.blogCategory.findMany({
        select: { name: true, _count: { select: { posts: true } } },
      }),
      // Events by type
      prisma.event.groupBy({
        by: ["type"],
        _count: true,
      }),
      // Event registrations total
      prisma.eventRegistration.groupBy({
        by: ["status"],
        _count: true,
      }),
      // Donations by campaign
      prisma.donationCampaign.findMany({
        select: { title: true, goalAmount: true, _count: { select: { donations: true } }, donations: { where: { status: "PAID" }, select: { amount: true } } },
      }),
      // Donations by payment method
      prisma.donation.groupBy({
        by: ["paymentMethod"],
        _sum: { amount: true },
        _count: true,
        where: { status: "PAID" },
      }),
      // Order status breakdown
      prisma.order.groupBy({
        by: ["status"],
        _count: true,
      }),
      // Order payment breakdown
      prisma.order.groupBy({
        by: ["paymentMethod"],
        _sum: { total: true },
        _count: true,
      }),
      // User roles
      prisma.user.groupBy({
        by: ["role"],
        _count: true,
      }),
      // Recent 7 day orders (for heatmap)
      prisma.order.findMany({
        where: { createdAt: { gte: weekStart } },
        select: { createdAt: true },
      }),
      // Cart items (for conversion)
      prisma.cartItem.count(),
      // Completed orders (for conversion)
      prisma.order.count({ where: { paymentStatus: "PAID" } }),
      // Top customers
      prisma.order.groupBy({
        by: ["userId"],
        _sum: { total: true },
        _count: true,
        where: { paymentStatus: "PAID" },
        orderBy: { _sum: { total: "desc" } },
        take: 10,
      }),
      // Recent activity (last 20 orders)
      prisma.order.findMany({
        select: {
          id: true,
          orderNumber: true,
          total: true,
          paymentStatus: true,
          status: true,
          createdAt: true,
          user: { select: { firstName: true, lastName: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
    ]);

    // ═══════════════════════════════════════════
    // PROCESS GEO DATA
    // ═══════════════════════════════════════════

    // Aggregate geo from user addresses
    const geoCountryMap = new Map<string, number>();
    const geoCityMap = new Map<string, { count: number; country: string }>();
    const geoRegionMap = new Map<string, number>();

    for (const addr of userAddresses) {
      const country = addr.country || "Ghana";
      geoCountryMap.set(country, (geoCountryMap.get(country) || 0) + 1);

      const city = addr.city || "Unknown";
      const existing = geoCityMap.get(city);
      geoCityMap.set(city, { count: (existing?.count || 0) + 1, country });

      const state = addr.state || "Unknown";
      geoRegionMap.set(state, (geoRegionMap.get(state) || 0) + 1);
    }

    // Also aggregate from order shipping addresses
    for (const order of allOrders) {
      const addr = order.shippingAddress as Record<string, string> | null;
      if (addr) {
        const country = addr.country || addr.Country || "Ghana";
        geoCountryMap.set(country, (geoCountryMap.get(country) || 0) + 1);

        const city = addr.city || addr.City || "";
        if (city) {
          const existing = geoCityMap.get(city);
          geoCityMap.set(city, { count: (existing?.count || 0) + 1, country });
        }

        const state = addr.state || addr.State || addr.region || addr.Region || "";
        if (state) {
          geoRegionMap.set(state, (geoRegionMap.get(state) || 0) + 1);
        }
      }
    }

    const geoCountries = Array.from(geoCountryMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    const geoCities = Array.from(geoCityMap.entries())
      .map(([name, data]) => ({ name, count: data.count, country: data.country }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    const geoRegions = Array.from(geoRegionMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // Ghana regions with coordinates for map visualization
    const ghanaRegions = [
      { name: "Greater Accra", lat: 5.6037, lng: -0.1870 },
      { name: "Ashanti", lat: 6.6885, lng: -1.6244 },
      { name: "Western", lat: 5.0527, lng: -2.1270 },
      { name: "Eastern", lat: 6.2374, lng: -0.4502 },
      { name: "Central", lat: 5.1109, lng: -1.2466 },
      { name: "Volta", lat: 6.5781, lng: 0.4502 },
      { name: "Northern", lat: 9.4967, lng: -0.8547 },
      { name: "Upper East", lat: 10.7852, lng: -0.8547 },
      { name: "Upper West", lat: 10.2530, lng: -2.1410 },
      { name: "Brong-Ahafo", lat: 7.9527, lng: -1.5209 },
      { name: "Western North", lat: 6.3000, lng: -2.3500 },
      { name: "Ahafo", lat: 7.0000, lng: -2.3500 },
      { name: "Bono East", lat: 7.7500, lng: -1.0500 },
      { name: "Oti", lat: 7.9000, lng: 0.3000 },
      { name: "North East", lat: 10.5000, lng: -0.2500 },
      { name: "Savannah", lat: 8.8000, lng: -1.7000 },
    ];

    // Match geoRegions to Ghana region coords
    const geoRegionData = ghanaRegions.map((r) => {
      // Try to match region names flexibly
      const matchRegion = geoRegions.find((gr) =>
        gr.name.toLowerCase().includes(r.name.toLowerCase()) ||
        r.name.toLowerCase().includes(gr.name.toLowerCase())
      );
      return {
        ...r,
        count: matchRegion?.count || 0,
      };
    });

    // ═══════════════════════════════════════════
    // PROCESS HEATMAP DATA (day × hour)
    // ═══════════════════════════════════════════
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const heatmapData: { day: string; hour: number; value: number }[] = [];
    const heatmapMap = new Map<string, number>();

    for (const order of recentOrders7d) {
      const d = new Date(order.createdAt);
      const key = `${dayNames[d.getDay()]}-${d.getHours()}`;
      heatmapMap.set(key, (heatmapMap.get(key) || 0) + 1);
    }

    for (const day of dayNames) {
      for (let hour = 0; hour < 24; hour++) {
        heatmapData.push({
          day,
          hour,
          value: heatmapMap.get(`${day}-${hour}`) || 0,
        });
      }
    }

    // ═══════════════════════════════════════════
    // BUILD RESPONSE
    // ═══════════════════════════════════════════

    const calcChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    const revThisMonth = Number(revenueThisMonth._sum.total || 0);
    const revLastMonth = Number(revenueLastMonth._sum.total || 0);
    const donThisMonth = Number(donationsThisMonth._sum.amount || 0);

    // Resolve top customer names
    const customerUserIds = topCustomers.map((c) => c.userId);
    const customerUsers = customerUserIds.length
      ? await prisma.user.findMany({
          where: { id: { in: customerUserIds } },
          select: { id: true, firstName: true, lastName: true, email: true },
        })
      : [];
    const customerMap = new Map(customerUsers.map((u) => [u.id, u]));

    return NextResponse.json({
      // ── KPI Cards ──
      kpis: {
        totalRevenue: revThisMonth,
        revenueChange: calcChange(revThisMonth, revLastMonth),
        totalOrders: totalOrders,
        ordersThisMonth,
        totalUsers,
        usersThisMonth,
        totalDonations: donThisMonth,
        donationsCount: donationsThisMonth._count,
        totalProducts,
        totalBlogPosts,
        totalEvents,
        totalMessages,
        avgOrderValue: revenueThisMonth._count > 0 ? revThisMonth / revenueThisMonth._count : 0,
        conversionRate: cartItems > 0 ? Math.round((completedOrders / cartItems) * 100) : 0,
      },

      // ── Time Series ──
      revenueChart: months.map((m, i) => ({
        month: m.shortLabel,
        revenue: Number(monthlyRevenue[i]._sum.total || 0),
        donations: Number(monthlyDonations[i]._sum.amount || 0),
        orders: monthlyOrders[i],
      })),

      growthChart: months.map((m, i) => ({
        month: m.shortLabel,
        users: monthlyUsers[i],
        orders: monthlyOrders[i],
        events: monthlyEvents[i],
        posts: monthlyBlogPosts[i],
      })),

      dailyChart: days.map((d, i) => ({
        day: d.label,
        revenue: Number(dailyRevenue[i]._sum.total || 0),
        users: dailyUsers[i],
        orders: dailyOrders[i],
      })),

      // ── Geo Data ──
      geo: {
        countries: geoCountries,
        cities: geoCities,
        regions: geoRegionData,
      },

      // ── Breakdowns ──
      productPerformance: topProducts.map((p) => ({
        name: p.name,
        sales: p.salesCount,
        views: p.viewCount,
        revenue: Number(p.price) * p.salesCount,
        stock: p.stock,
        image: p.images[0] || null,
      })),

      productCategories: productsByCategory.map((c) => ({
        name: c.name,
        count: c._count.products,
      })),

      lowStock: lowStockProducts.map((p) => ({
        name: p.name,
        stock: p.stock,
        alert: p.lowStockAlert,
      })),

      blogPerformance: topBlogPosts.map((p) => ({
        title: p.title,
        views: p.viewCount,
        status: p.status,
        published: p.publishedAt?.toISOString() || null,
      })),

      blogCategories: blogByCategory.map((c) => ({
        name: c.name,
        count: c._count.posts,
      })),

      eventTypes: eventsByType.map((e) => ({
        type: e.type.replace(/_/g, " "),
        count: e._count,
      })),

      eventRegistrationStatus: eventRegistrations.map((r) => ({
        status: r.status,
        count: r._count,
      })),

      campaigns: donationsByCampaign.map((c) => ({
        title: c.title,
        goal: c.goalAmount ? Number(c.goalAmount) : null,
        raised: c.donations.reduce((sum, d) => sum + Number(d.amount), 0),
        count: c._count.donations,
      })),

      donationMethods: donationsByMethod.map((d) => ({
        method: d.paymentMethod,
        total: Number(d._sum.amount || 0),
        count: d._count,
      })),

      orderStatuses: ordersByStatus.map((o) => ({
        status: o.status,
        count: o._count,
      })),

      paymentMethods: ordersByPayment.map((o) => ({
        method: o.paymentMethod,
        total: Number(o._sum.total || 0),
        count: o._count,
      })),

      userRoles: usersByRole.map((u) => ({
        role: u.role,
        count: u._count,
      })),

      // ── Heatmap ──
      heatmap: heatmapData,

      // ── Funnel ──
      funnel: [
        { stage: "Site Visitors", value: totalUsers * 8 }, // estimate
        { stage: "Registered Users", value: totalUsers },
        { stage: "Cart Users", value: cartItems },
        { stage: "Orders Placed", value: totalOrders },
        { stage: "Paid Orders", value: completedOrders },
      ],

      // ── Top Customers ──
      topCustomers: topCustomers.map((c) => {
        const user = customerMap.get(c.userId);
        return {
          name: user ? `${user.firstName} ${user.lastName}` : "Unknown",
          email: user?.email || "",
          total: Number(c._sum.total || 0),
          orders: c._count,
        };
      }),

      // ── Recent Activity ──
      recentActivity: recentActivity.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        total: Number(o.total),
        paymentStatus: o.paymentStatus,
        status: o.status,
        date: o.createdAt.toISOString(),
        customer: o.user ? `${o.user.firstName} ${o.user.lastName}` : "Guest",
      })),
    });
  } catch (error) {
    console.error("[ANALYTICS_ERROR]", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
