import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAdminAction } from "@/lib/audit";

const MASKED_SECRET = "••••••••";
const SECRET_KEYS = new Set([
  "smtpPassword",
  "paystackPublicKey",
  "paystackSecretKey",
  "stripeSecretKey",
  "paypalSecretKey",
]);

// GET /api/admin/settings — Get all site settings
export async function GET() {
  try {
    const session = await auth();
    if (
      !session?.user ||
      !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const settings = await prisma.siteSetting.findMany();

    // Convert to key-value map
    const settingsMap: Record<string, string> = {};
    for (const s of settings) {
      settingsMap[s.key] = SECRET_KEYS.has(s.key) && s.value
        ? MASKED_SECRET
        : s.value;
    }
    if (process.env.PAYSTACK_PUBLIC_KEY) settingsMap.paystackPublicKey = MASKED_SECRET;
    if (process.env.PAYSTACK_SECRET_KEY) settingsMap.paystackSecretKey = MASKED_SECRET;

    return NextResponse.json({ settings: settingsMap });
  } catch (error) {
    console.error("[ADMIN_SETTINGS_GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/settings — Update site settings (batch upsert)
export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (
      !session?.user ||
      !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { settings } = await req.json();

    if (!settings || typeof settings !== "object") {
      return NextResponse.json(
        { error: "Settings object is required" },
        { status: 400 }
      );
    }

    const entries = Object.entries(settings);
    if (entries.length > 200) {
      return NextResponse.json({ error: "Too many settings" }, { status: 400 });
    }
    const invalid = entries.find(
      ([key, value]) =>
        !/^[A-Za-z][A-Za-z0-9_-]{0,99}$/.test(key) ||
        String(value).length > 1_000_000
    );
    if (invalid) {
      return NextResponse.json({ error: "Invalid setting key or value" }, { status: 400 });
    }

    // A masked value means the existing secret was left unchanged.
    const writableEntries = entries.filter(
      ([key, value]) => !(SECRET_KEYS.has(key) && value === MASKED_SECRET)
    );
    const upserts = writableEntries.map(([key, value]) =>
      prisma.siteSetting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value), type: typeof value },
      })
    );

    await Promise.all(upserts);

    await logAdminAction({
      action: "SETTINGS_UPDATE",
      entity: "SiteSetting",
      details: { keys: writableEntries.map(([key]) => key) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[ADMIN_SETTINGS_PUT]", error);
    return NextResponse.json(
      { error: "Failed to save settings" },
      { status: 500 }
    );
  }
}
