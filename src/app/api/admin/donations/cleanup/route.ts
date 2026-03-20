import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// DELETE /api/admin/donations/cleanup — Remove stale PENDING/FAILED donations
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "PENDING";
    const olderThanHours = parseInt(searchParams.get("olderThanHours") || "1");

    if (!["PENDING", "FAILED"].includes(status)) {
      return NextResponse.json({ error: "Can only clean up PENDING or FAILED donations" }, { status: 400 });
    }

    const cutoff = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);

    const result = await prisma.donation.deleteMany({
      where: {
        status: status as "PENDING" | "FAILED",
        createdAt: { lt: cutoff },
      },
    });

    return NextResponse.json({
      deleted: result.count,
      message: `Deleted ${result.count} ${status.toLowerCase()} donations older than ${olderThanHours}h`,
    });
  } catch (error) {
    console.error("[ADMIN_DONATIONS_CLEANUP]", error);
    return NextResponse.json({ error: "Cleanup failed" }, { status: 500 });
  }
}
