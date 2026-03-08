import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/admin/audit-log — Paginated, filterable audit log with stats
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
    const limit = parseInt(searchParams.get("limit") || "25");
    const action = searchParams.get("action") || "";
    const entity = searchParams.get("entity") || "";
    const adminId = searchParams.get("adminId") || "";
    const from = searchParams.get("from") || "";
    const to = searchParams.get("to") || "";
    const search = searchParams.get("search") || "";
    const view = searchParams.get("view") || "audit"; // audit | logins | stats
    const format = searchParams.get("format") || "json"; // json | csv

    // ══════════════════════════════════════════
    // LOGIN ATTEMPTS VIEW
    // ══════════════════════════════════════════
    if (view === "logins") {
      const loginWhere: Record<string, unknown> = {};
      if (search) {
        loginWhere.email = { contains: search, mode: "insensitive" };
      }
      if (from || to) {
        loginWhere.createdAt = {};
        if (from) (loginWhere.createdAt as Record<string, unknown>).gte = new Date(from);
        if (to) (loginWhere.createdAt as Record<string, unknown>).lte = new Date(to + "T23:59:59Z");
      }
      if (action === "success") loginWhere.success = true;
      if (action === "failed") loginWhere.success = false;

      const [logins, loginTotal] = await Promise.all([
        prisma.loginAttempt.findMany({
          where: loginWhere,
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.loginAttempt.count({ where: loginWhere }),
      ]);

      return NextResponse.json({
        logins,
        pagination: {
          page,
          limit,
          total: loginTotal,
          pages: Math.ceil(loginTotal / limit),
        },
      });
    }

    // ══════════════════════════════════════════
    // STATS VIEW
    // ══════════════════════════════════════════
    if (view === "stats") {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      const [
        totalLogs,
        todayLogs,
        weekLogs,
        monthLogs,
        actionBreakdown,
        entityBreakdown,
        topAdmins,
        recentLogins,
        failedLogins24h,
        totalLogins,
        successLogins,
        dailyActivity,
      ] = await Promise.all([
        prisma.adminAuditLog.count(),
        prisma.adminAuditLog.count({ where: { createdAt: { gte: today } } }),
        prisma.adminAuditLog.count({ where: { createdAt: { gte: weekAgo } } }),
        prisma.adminAuditLog.count({ where: { createdAt: { gte: monthAgo } } }),

        // Action breakdown
        prisma.adminAuditLog.groupBy({
          by: ["action"],
          _count: true,
          orderBy: { _count: { action: "desc" } },
        }),

        // Entity breakdown
        prisma.adminAuditLog.groupBy({
          by: ["entity"],
          _count: true,
          orderBy: { _count: { entity: "desc" } },
        }),

        // Top admins by activity
        prisma.adminAuditLog.groupBy({
          by: ["adminId"],
          _count: true,
          orderBy: { _count: { adminId: "desc" } },
          take: 10,
        }),

        // Recent login attempts
        prisma.loginAttempt.findMany({
          orderBy: { createdAt: "desc" },
          take: 10,
        }),

        // Failed logins in last 24h
        prisma.loginAttempt.count({
          where: { success: false, createdAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) } },
        }),

        // Total & successful logins
        prisma.loginAttempt.count(),
        prisma.loginAttempt.count({ where: { success: true } }),

        // Daily activity for the last 30 days
        prisma.$queryRaw<Array<{ date: string; count: bigint }>>`
          SELECT DATE("createdAt") as date, COUNT(*)::bigint as count
          FROM "AdminAuditLog"
          WHERE "createdAt" >= ${monthAgo}
          GROUP BY DATE("createdAt")
          ORDER BY date ASC
        `,
      ]);

      // Fetch admin names for top admins
      const adminIds = topAdmins.map((a) => a.adminId);
      const admins = await prisma.user.findMany({
        where: { id: { in: adminIds } },
        select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
      });
      const adminMap = Object.fromEntries(admins.map((a) => [a.id, a]));

      return NextResponse.json({
        stats: {
          totalLogs,
          todayLogs,
          weekLogs,
          monthLogs,
          failedLogins24h,
          totalLogins,
          successLogins,
          failedLogins: totalLogins - successLogins,
          actionBreakdown: actionBreakdown.map((a) => ({
            action: a.action,
            count: a._count,
          })),
          entityBreakdown: entityBreakdown.map((e) => ({
            entity: e.entity,
            count: e._count,
          })),
          topAdmins: topAdmins.map((a) => ({
            admin: adminMap[a.adminId] || { id: a.adminId, firstName: "Unknown", lastName: "", email: "" },
            count: a._count,
          })),
          recentLogins,
          dailyActivity: dailyActivity.map((d) => ({
            date: d.date,
            count: Number(d.count),
          })),
        },
      });
    }

    // ══════════════════════════════════════════
    // AUDIT LOGS VIEW (default)
    // ══════════════════════════════════════════
    const where: Record<string, unknown> = {};

    if (action) where.action = action;
    if (entity) where.entity = entity;
    if (adminId) where.adminId = adminId;

    if (from || to) {
      where.createdAt = {};
      if (from) (where.createdAt as Record<string, unknown>).gte = new Date(from);
      if (to) (where.createdAt as Record<string, unknown>).lte = new Date(to + "T23:59:59Z");
    }

    if (search) {
      where.OR = [
        { entity: { contains: search, mode: "insensitive" } },
        { entityId: { contains: search, mode: "insensitive" } },
        { admin: { firstName: { contains: search, mode: "insensitive" } } },
        { admin: { lastName: { contains: search, mode: "insensitive" } } },
        { admin: { email: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [logs, total] = await Promise.all([
      prisma.adminAuditLog.findMany({
        where,
        include: {
          admin: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatar: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.adminAuditLog.count({ where }),
    ]);

    // ── CSV EXPORT ──
    if (format === "csv") {
      const allLogs = await prisma.adminAuditLog.findMany({
        where,
        include: {
          admin: {
            select: { firstName: true, lastName: true, email: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 10000,
      });

      const csvHeader = "Date,Action,Entity,Entity ID,Admin,Admin Email,IP,Details\n";
      const csvRows = allLogs.map((l) => {
        const date = new Date(l.createdAt).toISOString();
        const details = l.details ? JSON.stringify(l.details).replace(/"/g, '""') : "";
        return `"${date}","${l.action}","${l.entity}","${l.entityId || ""}","${l.admin.firstName} ${l.admin.lastName}","${l.admin.email}","${l.ip || ""}","${details}"`;
      });

      const csv = csvHeader + csvRows.join("\n");
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="audit-log-${new Date().toISOString().split("T")[0]}.csv"`,
        },
      });
    }

    // ── Fetch list of admins for filter dropdown ──
    const adminList = await prisma.user.findMany({
      where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } },
      select: { id: true, firstName: true, lastName: true, email: true },
      orderBy: { firstName: "asc" },
    });

    return NextResponse.json({
      logs,
      adminList,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[ADMIN_AUDIT_LOG_GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch audit logs" },
      { status: 500 }
    );
  }
}
