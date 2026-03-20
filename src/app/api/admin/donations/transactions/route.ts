import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || "";

// GET /api/admin/donations/transactions — Fetch recent Paystack transactions
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
    const perPage = searchParams.get("perPage") || "50";
    const page = searchParams.get("page") || "1";
    const status = searchParams.get("status") || "";

    const params = new URLSearchParams({ perPage, page });
    if (status) params.set("status", status);

    const response = await fetch(
      `https://api.paystack.co/transaction?${params}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const data = await response.json();

    if (!data.status) {
      return NextResponse.json({ error: data.message || "Failed to fetch transactions" }, { status: 500 });
    }

    return NextResponse.json({
      transactions: data.data,
      meta: data.meta,
    });
  } catch (error) {
    console.error("[ADMIN_PAYSTACK_TRANSACTIONS]", error);
    return NextResponse.json({ error: "Failed to fetch Paystack transactions" }, { status: 500 });
  }
}
