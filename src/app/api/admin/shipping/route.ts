import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { DEFAULT_SHIPPING_CONFIG, ShippingConfig } from "@/app/api/store/shipping/route";
import { logAdminAction } from "@/lib/audit";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes((session.user as { role?: string }).role ?? "")) {
    return null;
  }
  return session;
}

const shippingMethodSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  carrier: z.string().optional(),
  price: z.number().min(0),
  estimatedDays: z.string(),
  processingDays: z.string().optional(),
  enabled: z.boolean(),
  codAvailable: z.boolean().optional(),
});

const shippingZoneSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  enabled: z.boolean(),
  extraFee: z.number().min(0),
});

const shippingClassConfigSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  extraFee: z.number().min(0),
  freeShippingEligible: z.boolean(),
});

const shippingConfigSchema = z.object({
  methods: z.array(shippingMethodSchema),
  zones: z.array(shippingZoneSchema),
  classes: z.array(shippingClassConfigSchema),
  freeShippingEnabled: z.boolean(),
  freeShippingThreshold: z.number().min(0),
});

// GET /api/admin/shipping — returns full config including disabled methods
export async function GET() {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const setting = await prisma.siteSetting.findUnique({
      where: { key: "shippingConfig" },
    });

    let config: ShippingConfig = DEFAULT_SHIPPING_CONFIG;
    if (setting?.value) {
      try {
        const parsed = JSON.parse(setting.value) as Partial<ShippingConfig>;
        config = {
          ...DEFAULT_SHIPPING_CONFIG,
          ...parsed,
          zones: parsed.zones ?? DEFAULT_SHIPPING_CONFIG.zones,
          classes: parsed.classes ?? DEFAULT_SHIPPING_CONFIG.classes,
        };
      } catch {
        config = DEFAULT_SHIPPING_CONFIG;
      }
    }

    return NextResponse.json({ config });
  } catch (error) {
    console.error("[ADMIN_SHIPPING_GET]", error);
    return NextResponse.json({ error: "Failed to fetch shipping config" }, { status: 500 });
  }
}

// PUT /api/admin/shipping — save full config
export async function PUT(req: NextRequest) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const config = shippingConfigSchema.parse(body.config);

    await prisma.siteSetting.upsert({
      where: { key: "shippingConfig" },
      update: { value: JSON.stringify(config) },
      create: { key: "shippingConfig", value: JSON.stringify(config), type: "json" },
    });

    await logAdminAction({
      action: "SETTINGS_UPDATE",
      entity: "SiteSetting",
      details: {
        methodCount: config.methods.length,
        zoneCount: config.zones.length,
        freeShippingThreshold: config.freeShippingThreshold,
      },
    });

    return NextResponse.json({ success: true, config });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid config", details: error.errors }, { status: 400 });
    }
    console.error("[ADMIN_SHIPPING_PUT]", error);
    return NextResponse.json({ error: "Failed to save shipping config" }, { status: 500 });
  }
}
