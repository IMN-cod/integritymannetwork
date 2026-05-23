import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ShippingMethod {
  id: string;
  name: string;
  description: string;
  carrier?: string;        // e.g. "GIG Logistics", "DHL Express"
  price: number;
  estimatedDays: string;
  processingDays?: string; // e.g. "1-2 business days"
  enabled: boolean;
  codAvailable?: boolean;  // cash on delivery
}

export interface ShippingZone {
  id: string;
  name: string;            // "Greater Accra", "Other Regions", "International"
  description: string;     // Coverage detail shown to admin
  enabled: boolean;
  extraFee: number;        // Surcharge added on top of method base price
}

export interface ShippingClassConfig {
  id: string;              // "STANDARD" | "BULKY" | "FRAGILE"
  name: string;
  description: string;
  extraFee: number;        // Surcharge for this class on top of method price
  freeShippingEligible: boolean; // Whether free-shipping threshold applies
}

export interface ShippingConfig {
  methods: ShippingMethod[];
  zones: ShippingZone[];
  classes: ShippingClassConfig[];
  freeShippingEnabled: boolean;
  freeShippingThreshold: number;
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

export const DEFAULT_SHIPPING_CONFIG: ShippingConfig = {
  methods: [
    {
      id: "standard",
      name: "Standard Delivery",
      description: "Reliable delivery across Ghana",
      carrier: "GIG Logistics",
      price: 35,
      estimatedDays: "5-7 business days",
      processingDays: "1-2 business days",
      enabled: true,
      codAvailable: false,
    },
  ],
  zones: [
    {
      id: "accra",
      name: "Greater Accra",
      description: "Accra, Tema, Accra Metropolis & nearby districts",
      enabled: true,
      extraFee: 0,
    },
    {
      id: "other-ghana",
      name: "Other Regions",
      description: "Kumasi, Takoradi, Cape Coast, Tamale & all other Ghana regions",
      enabled: true,
      extraFee: 20,
    },
    {
      id: "international",
      name: "International",
      description: "Outside Ghana — contact us for rates",
      enabled: false,
      extraFee: 200,
    },
  ],
  classes: [
    {
      id: "STANDARD",
      name: "Standard",
      description: "Regular products — normal packaging",
      extraFee: 0,
      freeShippingEligible: true,
    },
    {
      id: "BULKY",
      name: "Bulky / Oversized",
      description: "Large or heavy items requiring extra vehicle space",
      extraFee: 50,
      freeShippingEligible: false,
    },
    {
      id: "FRAGILE",
      name: "Fragile",
      description: "Delicate items requiring protective packaging & special handling",
      extraFee: 20,
      freeShippingEligible: true,
    },
  ],
  freeShippingEnabled: true,
  freeShippingThreshold: 2000,
};

// ─── GET /api/store/shipping — public, enabled methods + config ───────────────

export async function GET() {
  try {
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
          // Always fall back to defaults for new fields if config was saved before they existed
          zones: parsed.zones ?? DEFAULT_SHIPPING_CONFIG.zones,
          classes: parsed.classes ?? DEFAULT_SHIPPING_CONFIG.classes,
        };
      } catch {
        config = DEFAULT_SHIPPING_CONFIG;
      }
    }

    return NextResponse.json({
      methods: config.methods.filter((m) => m.enabled),
      zones: config.zones.filter((z) => z.enabled),
      classes: config.classes,
      freeShippingEnabled: config.freeShippingEnabled,
      freeShippingThreshold: config.freeShippingThreshold,
    });
  } catch (error) {
    console.error("[STORE_SHIPPING_GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch shipping options" },
      { status: 500 }
    );
  }
}
