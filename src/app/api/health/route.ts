import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    const queuedEmail = await prisma.emailOutbox.count({
      where: { status: { in: ["PENDING", "FAILED", "SENDING"] } },
    });

    return NextResponse.json({
      status: "ok",
      database: "ok",
      emailQueue: queuedEmail > 0 ? "pending" : "clear",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[HEALTH_CHECK]", error);
    return NextResponse.json(
      { status: "unhealthy", database: "unavailable" },
      { status: 503 }
    );
  }
}
