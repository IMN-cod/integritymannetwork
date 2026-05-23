"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  ShoppingBag, Shield, Lock, CreditCard, ChevronLeft,
  Check, Truck, Loader2, AlertCircle, Tag, X, UserCircle, PackageCheck,
  MapPin, Navigation, ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCartStore } from "@/stores";
import { formatCurrency } from "@/lib/utils";
import { useSession } from "next-auth/react";
import type { ShippingMethod, ShippingZone, ShippingClassConfig } from "@/app/api/store/shipping/route";

// ── Ghana location data ───────────────────────────────────────────────────────
const GHANA_REGIONS = [
  "Greater Accra", "Ashanti", "Western", "Central", "Eastern",
  "Northern", "Upper East", "Upper West", "Volta", "Oti",
  "Western North", "Savannah", "North East", "Bono", "Bono East", "Ahafo",
];

const GHANA_CITIES: Record<string, string[]> = {
  "Greater Accra": [
    "Accra", "Tema", "Madina", "Adenta", "Kasoa", "Ashaiman", "Dome", "Teshie",
    "Nungua", "East Legon", "Spintex", "Labadi", "Achimota", "Dansoman",
    "Kaneshie", "Lapaz", "Abeka", "Darkuman", "Ablekuma", "Weija",
    "Adabraka", "Osu", "Labone", "Airport Residential", "Cantonments",
  ],
  "Ashanti": [
    "Kumasi", "Obuasi", "Ejisu", "Juaben", "Mampong", "Konongo", "Bekwai",
    "Asokwa", "Nhyiaeso", "Bantama", "Adum", "Suame", "Asante Mampong", "Agogo",
  ],
  "Western": [
    "Sekondi-Takoradi", "Takoradi", "Sekondi", "Tarkwa", "Axim",
    "Half Assini", "Prestea", "Bogoso", "Nkroful",
  ],
  "Central": [
    "Cape Coast", "Mankessim", "Saltpond", "Winneba", "Swedru",
    "Agona Swedru", "Elmina", "Assin Fosu", "Dunkwa-on-Offin",
  ],
  "Eastern": [
    "Koforidua", "Akosombo", "Nkawkaw", "Asamankese", "Oda",
    "Suhum", "Akyem Oda", "Aburi", "Nsawam", "Bunso",
  ],
  "Northern": [
    "Tamale", "Yendi", "Savelugu", "Damongo", "Bimbilla", "Kumbungu", "Tolon", "Gushegu",
  ],
  "Upper East": ["Bolgatanga", "Bawku", "Navrongo", "Zebilla", "Sandema", "Paga"],
  "Upper West": ["Wa", "Lawra", "Tumu", "Jirapa", "Nandom", "Daffiama"],
  "Volta": ["Ho", "Hohoe", "Keta", "Anloga", "Kpando", "Aflao", "Sogakope", "Dzodze", "Akatsi"],
  "Oti": ["Dambai", "Kete-Krachi", "Nkwanta", "Oti Damanko"],
  "Western North": ["Sefwi Wiawso", "Bibiani", "Juaboso", "Bodi", "Enchi"],
  "Savannah": ["Damongo", "Buipe", "Sawla", "Salaga", "Bole"],
  "North East": ["Nalerigu", "Gambaga", "Walewale", "Bunkpurugu", "Chereponi"],
  "Bono": ["Sunyani", "Berekum", "Dormaa Ahenkro", "Wenchi", "Sampa"],
  "Bono East": ["Techiman", "Kintampo", "Atebubu", "Nkoranza", "Yeji"],
  "Ahafo": ["Goaso", "Hwidiem", "Kukuom", "Mim", "Asutifi"],
};

const COUNTRIES = [
  "Ghana",
  "Nigeria", "Ivory Coast", "Togo", "Benin", "Burkina Faso",
  "Senegal", "Sierra Leone", "Liberia", "Guinea",
  "United Kingdom", "United States", "Canada", "Germany",
  "France", "Netherlands", "Italy", "Spain", "Portugal",
  "South Africa", "Kenya", "Ethiopia", "Rwanda", "Uganda", "Tanzania",
  "United Arab Emirates", "Saudi Arabia", "China", "India", "Australia",
  "Other",
];

// ── Zone auto-guesser ─────────────────────────────────────────────────────────
function guessZoneFromShipping(country: string, region: string, zones: import("@/app/api/store/shipping/route").ShippingZone[]): string | null {
  if (!zones.length) return null;
  const c = country.toLowerCase().trim();
  const r = region.toLowerCase().trim();

  if (c !== "ghana") {
    const match = zones.find((z) =>
      z.name.toLowerCase().includes("international") || z.id.toLowerCase().includes("international")
    );
    return match?.id ?? zones.reduce((a, b) => (a.extraFee >= b.extraFee ? a : b)).id;
  }

  if (r.includes("accra")) {
    const match =
      zones.find((z) => z.name.toLowerCase().includes("accra") || z.id.toLowerCase().includes("accra")) ??
      zones.reduce((a, b) => (a.extraFee <= b.extraFee ? a : b));
    return match?.id ?? null;
  }

  const match =
    zones.find((z) =>
      z.name.toLowerCase().includes("other") ||
      z.name.toLowerCase().includes("region") ||
      z.id.toLowerCase().includes("other")
    ) ??
    zones.find((z) => !z.name.toLowerCase().includes("international") && !z.id.toLowerCase().includes("accra"));
  return match?.id ?? zones[0]?.id ?? null;
}

// ── Reusable dropdown component styled for dark checkout theme ────────────────
function SelectField({
  label, value, onChange, options, placeholder, required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm text-zinc-400 mb-1.5">{label}{required && " *"}</label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-10 rounded-md border border-zinc-700/60 bg-zinc-900 text-sm pl-3 pr-8 text-white focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500/50 appearance-none cursor-pointer disabled:opacity-50"
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
      </div>
    </div>
  );
}

type Step = "shipping" | "delivery" | "payment" | "review";

interface ShippingInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
}

export default function CheckoutPage() {
  const { data: session, status: sessionStatus } = useSession();
  const isGuest = sessionStatus !== "loading" && !session?.user;

  const {
    items, clearCart,
    discountCode, discountPercent,
    applyDiscount, removeDiscount, checkoutItems,
  } = useCartStore();

  const checkoutList = checkoutItems();

  const [step, setStep] = useState<Step>("shipping");
  const [paymentMethod, setPaymentMethod] = useState<"PAYSTACK" | "STRIPE" | "PAYPAL">("PAYSTACK");
  const [placing, setPlacing] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  const [coupon, setCoupon] = useState("");
  const [couponError, setCouponError] = useState("");

  const [shipping, setShipping] = useState<ShippingInfo>({
    firstName: "", lastName: "", email: "", phone: "",
    address: "", city: "", state: "", country: "Ghana",
  });

  // ── Shipping methods / zones / classes ────────────────────────────
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [shippingZones, setShippingZones] = useState<ShippingZone[]>([]);
  const [shippingClasses, setShippingClasses] = useState<ShippingClassConfig[]>([]);
  const [freeShippingEnabled, setFreeShippingEnabled] = useState(true);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(2000);
  const [selectedMethodId, setSelectedMethodId] = useState<string | null>(null);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [methodsLoading, setMethodsLoading] = useState(true);

  // ── Per-product shipping classes (for class surcharge display) ────
  type ProductShippingData = { shippingClass: string; freeShipping: boolean; handlingFee: number; isDigital: boolean };
  const [productShipping, setProductShipping] = useState<Map<string, ProductShippingData>>(new Map());
  const [productShippingLoaded, setProductShippingLoaded] = useState(false);

  // ── Location detection ────────────────────────────────────────────
  const [locationLoading, setLocationLoading] = useState(false);
  const [detectedLocation, setDetectedLocation] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    async function loadShipping() {
      try {
        const res = await fetch("/api/store/shipping");
        if (!res.ok) throw new Error();
        const data = await res.json();
        const methods: ShippingMethod[] = data.methods || [];
        const zones: ShippingZone[] = data.zones || [];
        const classes: ShippingClassConfig[] = data.classes || [];
        setShippingMethods(methods);
        setShippingZones(zones);
        setShippingClasses(classes);
        setFreeShippingEnabled(data.freeShippingEnabled ?? true);
        setFreeShippingThreshold(data.freeShippingThreshold ?? 2000);
        // Only set defaults on first load — functional update won't override a user selection
        if (methods.length > 0) setSelectedMethodId((prev) => prev ?? methods[0].id);
        if (zones.length > 0) setSelectedZoneId((prev) => prev ?? zones[0].id);
      } catch {
        const fallback: ShippingMethod = {
          id: "standard", name: "Standard Delivery", description: "",
          price: 35, estimatedDays: "5-7 business days", enabled: true,
        };
        setShippingMethods([fallback]);
        setSelectedMethodId("standard");
      } finally {
        setMethodsLoading(false);
      }
    }
    loadShipping();
  }, []); // Runs once on mount — no re-fetch on method/zone selection

  // Load per-product shipping data so class surcharges are shown accurately
  useEffect(() => {
    const ids = [...new Set(checkoutList.map((i) => i.id))];
    if (ids.length === 0) { setProductShippingLoaded(true); return; }
    fetch(`/api/store/cart-shipping?ids=${ids.join(",")}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        const map = new Map<string, ProductShippingData>();
        for (const p of data.products ?? []) map.set(p.id, p);
        setProductShipping(map);
      })
      .catch(() => { /* server still applies correct surcharges even if client can't show them */ })
      .finally(() => setProductShippingLoaded(true));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Geolocation auto-detect ───────────────────────────────────────
  const detectLocation = async () => {
    setLocationError(null);
    if (!navigator.geolocation) {
      setLocationError("Your browser doesn't support location detection. Please fill in your address manually.");
      return;
    }

    // Check permission state BEFORE calling getCurrentPosition so we can show
    // a helpful guide instead of silently failing when the user previously denied.
    if ("permissions" in navigator) {
      try {
        const perm = await navigator.permissions.query({ name: "geolocation" });
        if (perm.state === "denied") {
          setLocationError(
            "Location is blocked for this site. To allow it: click the lock icon (🔒) in your browser address bar → Site settings → Location → Allow, then click Detect Location again."
          );
          return;
        }
      } catch { /* permissions API unsupported — proceed and let getCurrentPosition handle it */ }
    }

    setLocationLoading(true);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 })
      );
      const { latitude, longitude } = pos.coords;
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
        { headers: { "User-Agent": "IntegrityManNetwork/1.0 (integritymannetwork.com)" } }
      );
      const data = await res.json();
      const addr = data.address ?? {};

      const rawCity = addr.city || addr.town || addr.village || addr.suburb || addr.neighbourhood || "";
      const rawState = (addr.state ?? "").replace(/ Region$/i, "").replace(/ Province$/i, "");
      const rawCountry = addr.country ?? "Ghana";

      const country = COUNTRIES.find((c) => c.toLowerCase() === rawCountry.toLowerCase()) ?? rawCountry;
      let region = rawState;
      let city = rawCity;

      if (country === "Ghana") {
        const matchedRegion = GHANA_REGIONS.find(
          (r) => r.toLowerCase() === rawState.toLowerCase() || rawState.toLowerCase().includes(r.toLowerCase())
        );
        if (matchedRegion) {
          region = matchedRegion;
          const matchedCity = (GHANA_CITIES[matchedRegion] ?? []).find(
            (c) => c.toLowerCase() === rawCity.toLowerCase() || rawCity.toLowerCase().includes(c.toLowerCase())
          );
          if (matchedCity) city = matchedCity;
        }
      }

      setShipping((prev) => ({ ...prev, country, state: region, city }));
      setDetectedLocation(`${city}${region ? `, ${region}` : ""}${country !== "Ghana" ? `, ${country}` : ""}`);
    } catch (err) {
      const gErr = err as { code?: number };
      if (gErr?.code === 1) {
        setLocationError(
          "Location access was denied. Click the lock icon (🔒) in your address bar → Site settings → Location → Allow, then try again."
        );
      } else {
        setLocationError("Could not detect your location. Please select your region and city from the dropdowns below.");
      }
    } finally {
      setLocationLoading(false);
    }
  };

  const selectedMethod = shippingMethods.find((m) => m.id === selectedMethodId) ?? shippingMethods[0] ?? null;

  // ── Cost calculation ───────────────────────────────────────────────
  const sub = checkoutList.reduce((s, item) => s + (item.salePrice ?? item.price) * item.quantity, 0);
  const discount = (sub * discountPercent) / 100;
  const afterDiscount = sub - discount;

  // Zone surcharge — from the zone the customer selects in the delivery step
  const selectedZone = shippingZones.find((z) => z.id === selectedZoneId) ?? null;
  const zoneSurcharge = selectedZone?.extraFee ?? 0;

  // Collect physical (non-digital, non-individually-free) cart products
  const cartPhysical = checkoutList
    .map((item) => productShipping.get(item.id))
    .filter((p): p is ProductShippingData => !!p && !p.isDigital && !p.freeShipping);

  // Highest class surcharge in the cart
  const classSurcharge = cartPhysical.reduce((max, p) => {
    const cls = shippingClasses.find((c) => c.id === p.shippingClass);
    return Math.max(max, cls?.extraFee ?? 0);
  }, 0);

  // Per-product handling fees summed across quantities
  const totalHandlingFee = checkoutList.reduce((sum, item) => {
    const p = productShipping.get(item.id);
    return sum + (p?.handlingFee ?? 0) * item.quantity;
  }, 0);

  // If all items are digital or individually marked free, the whole order ships free
  const allItemsFree =
    productShippingLoaded &&
    checkoutList.length > 0 &&
    checkoutList.every((item) => {
      const p = productShipping.get(item.id);
      return p?.isDigital || p?.freeShipping;
    });

  // Any non-eligible class (e.g. BULKY) blocks the free-shipping threshold from applying
  const hasIneligibleClass = cartPhysical.some((p) => {
    const cls = shippingClasses.find((c) => c.id === p.shippingClass);
    return cls ? !cls.freeShippingEligible : false;
  });

  const isFreeShipping =
    allItemsFree ||
    (!hasIneligibleClass && freeShippingEnabled && afterDiscount >= freeShippingThreshold);

  // Handling fees apply even on free shipping; zone + class surcharges only apply when not free
  const shipCost = isFreeShipping
    ? totalHandlingFee
    : (selectedMethod?.price ?? 0) + zoneSurcharge + classSurcharge + totalHandlingFee;

  const grandTotal = afterDiscount + shipCost;

  // ── Actions ────────────────────────────────────────────────────────
  const handleApplyCoupon = () => {
    const code = coupon.trim();
    if (!code) return;
    const ok = applyDiscount(code);
    if (ok) { setCoupon(""); setCouponError(""); }
    else setCouponError("Invalid promo code. Try TIMN10.");
  };

  const updateShipping = (field: keyof ShippingInfo, value: string) =>
    setShipping((prev) => ({ ...prev, [field]: value }));

  const validateShipping = (): boolean => {
    const required: (keyof ShippingInfo)[] = [
      "firstName", "lastName", "email", "phone", "address", "city", "state", "country",
    ];
    return required.every((field) => shipping[field].trim().length > 0);
  };

  const handlePlaceOrder = async () => {
    setPlacing(true);
    setOrderError(null);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shipping,
          paymentMethod,
          discountCode: discountCode ?? undefined,
          discountPercent: discountPercent || undefined,
          shippingMethodId: selectedMethod?.id ?? "standard",
          shippingMethodName: selectedMethod?.name ?? "Standard Delivery",
          shippingZoneId: selectedZoneId ?? undefined,
          items: checkoutList.map((item) => ({
            productId: item.id,
            variantId: item.variant || undefined,
            quantity: item.quantity,
            price: item.salePrice ?? item.price,
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) { setOrderError("__AUTH__"); return; }
        setOrderError(data.error || "Something went wrong with your order. Please check your details and try again.");
        return;
      }

      clearCart();
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        window.location.href = `/dashboard?order=success&ref=${data.order?.orderNumber}`;
      }
    } catch {
      setOrderError("Something went wrong. Please try again.");
    } finally {
      setPlacing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <ShoppingBag className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white font-display mb-2">Your Cart is Empty</h1>
          <p className="text-zinc-500 mb-6">Add items to your cart to proceed to checkout.</p>
          <Button asChild><Link href="/store">Browse Store</Link></Button>
        </div>
      </div>
    );
  }

  const steps: { key: Step; label: string; icon: typeof Truck }[] = [
    { key: "shipping", label: "Address", icon: Truck },
    { key: "delivery", label: "Delivery", icon: PackageCheck },
    { key: "payment", label: "Payment", icon: CreditCard },
    { key: "review", label: "Review", icon: Check },
  ];

  /* ─── Shared order summary sidebar ─────────────────────────────── */
  const OrderSummary = () => (
    <div className="bg-zinc-900/50 rounded-xl border border-zinc-800/50 p-6 sticky top-24">
      <h3 className="text-sm font-semibold text-white mb-4">Order Summary</h3>

      <div className="space-y-3 mb-4 max-h-52 overflow-y-auto pr-1">
        {checkoutList.map((item) => (
          <div key={`${item.id}-${item.variant}`} className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-zinc-800/50 border border-zinc-700/50 flex items-center justify-center shrink-0 overflow-hidden relative">
              {item.image ? (
                <Image src={item.image} alt={item.name} fill className="object-cover" sizes="40px" />
              ) : (
                <ShoppingBag className="w-4 h-4 text-zinc-600" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">{item.name}</p>
              <p className="text-[10px] text-zinc-500">
                {item.quantity} × {formatCurrency(item.salePrice ?? item.price)}
              </p>
            </div>
            <p className="text-xs font-semibold text-white shrink-0">
              {formatCurrency((item.salePrice ?? item.price) * item.quantity)}
            </p>
          </div>
        ))}
      </div>

      {/* Promo code */}
      <div className="mb-4">
        {discountCode ? (
          <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
            <span className="text-xs text-orange-400 font-medium flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" /><strong>{discountCode}</strong> ({discountPercent}% off)
            </span>
            <button onClick={removeDiscount} className="text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="space-y-1.5">
            <div className="flex gap-2">
              <Input
                placeholder="Promo code"
                value={coupon}
                onChange={(e) => { setCoupon(e.target.value); setCouponError(""); }}
                onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
                className="flex-1 h-8 text-xs bg-zinc-900 border-zinc-700/60 placeholder:text-zinc-600"
              />
              <Button variant="outline" size="sm" className="border-zinc-700 text-zinc-400 hover:text-white text-xs cursor-pointer h-8 px-3" onClick={handleApplyCoupon}>
                Apply
              </Button>
            </div>
            {couponError && <p className="text-[11px] text-red-400">{couponError}</p>}
          </div>
        )}
      </div>

      <div className="space-y-2 pt-4 border-t border-zinc-800/50">
        <div className="flex justify-between text-sm">
          <span className="text-zinc-400">Subtotal</span>
          <span className="text-white">{formatCurrency(sub)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-emerald-400">Discount ({discountPercent}%)</span>
            <span className="text-emerald-400">-{formatCurrency(discount)}</span>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span className="text-zinc-400">
            Shipping{selectedMethod && !isFreeShipping ? ` · ${selectedMethod.name}` : ""}
          </span>
          <span className={isFreeShipping ? "text-emerald-400 font-medium" : "text-white"}>
            {isFreeShipping
              ? (totalHandlingFee > 0 ? formatCurrency(totalHandlingFee) : "Free")
              : selectedMethod ? formatCurrency(shipCost) : "—"}
          </span>
        </div>
        {/* Surcharge breakdown */}
        {!isFreeShipping && (zoneSurcharge > 0 || classSurcharge > 0 || totalHandlingFee > 0) && (
          <div className="space-y-0.5 pl-2">
            <div className="flex justify-between text-xs text-zinc-500">
              <span>Base rate</span>
              <span>{formatCurrency(selectedMethod?.price ?? 0)}</span>
            </div>
            {zoneSurcharge > 0 && (
              <div className="flex justify-between text-xs text-zinc-500">
                <span>Zone ({selectedZone?.name})</span>
                <span>+{formatCurrency(zoneSurcharge)}</span>
              </div>
            )}
            {classSurcharge > 0 && (
              <div className="flex justify-between text-xs text-zinc-500">
                <span>Item type surcharge</span>
                <span>+{formatCurrency(classSurcharge)}</span>
              </div>
            )}
            {totalHandlingFee > 0 && (
              <div className="flex justify-between text-xs text-zinc-500">
                <span>Handling fee</span>
                <span>+{formatCurrency(totalHandlingFee)}</span>
              </div>
            )}
          </div>
        )}
        {isFreeShipping && (
          <p className="text-[10px] text-emerald-500/70">
            Free shipping applied (order ≥ {formatCurrency(freeShippingThreshold)})
          </p>
        )}
        <div className="flex justify-between text-base font-bold pt-2 border-t border-zinc-800/50">
          <span className="text-white">Total</span>
          <span className="text-orange-500">{formatCurrency(grandTotal)}</span>
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-zinc-800/50">
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <Shield className="w-3.5 h-3.5 text-green-400" />IMN Secure Pay — 256-bit SSL encrypted
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-950 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link href="/store" className="text-zinc-500 hover:text-white transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold text-white font-display">Checkout</h1>
          <div className="flex items-center gap-1 ml-auto text-xs text-zinc-500">
            <Lock className="w-3.5 h-3.5" />Secure Checkout
          </div>
        </div>

        {/* Guest warning */}
        {isGuest && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 flex flex-col sm:flex-row sm:items-center gap-4"
          >
            <div className="flex items-start gap-3 flex-1">
              <UserCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-300">Sign in required to place an order</p>
                <p className="text-xs text-amber-400/80 mt-0.5">
                  You need an account to complete checkout. Create one now — it only takes a moment, and your cart will be saved.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 sm:ml-auto">
              <Button asChild size="sm" variant="outline" className="border-amber-500/40 text-amber-300 hover:bg-amber-500/10 hover:text-amber-200 text-xs">
                <Link href={`/auth/login?redirect=/checkout`}>Sign In</Link>
              </Button>
              <Button asChild size="sm" className="bg-amber-500 hover:bg-amber-400 text-black text-xs font-semibold">
                <Link href={`/auth/register?redirect=/checkout`}>Create Account</Link>
              </Button>
            </div>
          </motion.div>
        )}

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-1 sm:gap-2 mb-10 flex-wrap">
          {steps.map((s, idx) => {
            const isActive = s.key === step;
            const stepIndex = steps.findIndex((x) => x.key === step);
            const isDone = idx < stepIndex;
            return (
              <div key={s.key} className="flex items-center gap-1 sm:gap-2">
                <button
                  onClick={() => { if (isDone) setStep(s.key); }}
                  className={`flex items-center gap-1.5 px-2.5 sm:px-4 py-2 rounded-full text-[11px] sm:text-sm transition-all ${
                    isActive
                      ? "bg-orange-500/10 border border-orange-500/30 text-orange-500"
                      : isDone
                      ? "bg-green-500/10 border border-green-500/30 text-green-400 cursor-pointer hover:bg-green-500/15"
                      : "bg-zinc-800/30 border border-zinc-800/50 text-zinc-500 cursor-default"
                  }`}
                >
                  {isDone ? <Check className="w-3.5 h-3.5" /> : <s.icon className="w-3.5 h-3.5" />}
                  {s.label}
                </button>
                {idx < steps.length - 1 && <div className="w-4 sm:w-6 h-px bg-zinc-800" />}
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">

            {/* ── STEP 1: SHIPPING ADDRESS ── */}
            {step === "shipping" && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-zinc-900/50 rounded-xl border border-zinc-800/50 p-6 space-y-5"
              >
                <div className="flex items-center gap-2">
                  <Truck className="w-5 h-5 text-orange-500 shrink-0" />
                  <h2 className="text-lg font-bold text-white">Shipping Address</h2>
                </div>

                {/* Location auto-detect banner */}
                <div className={`rounded-lg border p-3 space-y-2 ${locationError ? "bg-red-500/5 border-red-500/25" : "bg-zinc-800/40 border-zinc-700/40"}`}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <MapPin className={`w-3.5 h-3.5 shrink-0 ${locationError ? "text-red-400" : "text-orange-400"}`} />
                      {locationError ? (
                        <p className="text-xs text-red-300">{locationError}</p>
                      ) : detectedLocation ? (
                        <p className="text-xs text-zinc-300 truncate">
                          Detected: <span className="text-orange-400 font-medium">{detectedLocation}</span>
                          <span className="text-zinc-500 ml-1">— confirm or change below</span>
                        </p>
                      ) : (
                        <p className="text-xs text-zinc-400">Let us find your location automatically</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {locationError && (
                        <button
                          type="button"
                          onClick={() => setLocationError(null)}
                          className="text-zinc-500 hover:text-zinc-300 transition-colors"
                          aria-label="Dismiss error"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={detectLocation}
                        disabled={locationLoading}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-orange-500/30 text-orange-400 hover:bg-orange-500/10 text-xs font-medium transition-colors disabled:opacity-50"
                      >
                        {locationLoading ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Navigation className="w-3 h-3" />
                        )}
                        {locationLoading ? "Detecting…" : detectedLocation ? "Re-detect" : "Detect Location"}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1.5">First Name *</label>
                    <Input placeholder="John" value={shipping.firstName} onChange={(e) => updateShipping("firstName", e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1.5">Last Name *</label>
                    <Input placeholder="Doe" value={shipping.lastName} onChange={(e) => updateShipping("lastName", e.target.value)} />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-zinc-400 mb-1.5">Email *</label>
                  <Input type="email" placeholder="john@example.com" value={shipping.email} onChange={(e) => updateShipping("email", e.target.value)} />
                </div>

                <div>
                  <label className="block text-sm text-zinc-400 mb-1.5">Phone *</label>
                  <Input type="tel" placeholder="+233 20 123 4567" value={shipping.phone} onChange={(e) => updateShipping("phone", e.target.value)} />
                </div>

                <div>
                  <label className="block text-sm text-zinc-400 mb-1.5">Address *</label>
                  <Input placeholder="House / Flat no., Street, Area" value={shipping.address} onChange={(e) => updateShipping("address", e.target.value)} />
                </div>

                {/* Country */}
                <SelectField
                  label="Country"
                  value={shipping.country}
                  onChange={(v) => {
                    updateShipping("country", v);
                    // Reset region + city when country changes
                    updateShipping("state", "");
                    updateShipping("city", "");
                  }}
                  options={COUNTRIES}
                  required
                />

                {/* Region */}
                {shipping.country === "Ghana" ? (
                  <SelectField
                    label="Region"
                    value={shipping.state}
                    onChange={(v) => {
                      updateShipping("state", v);
                      updateShipping("city", ""); // reset city when region changes
                    }}
                    options={GHANA_REGIONS}
                    placeholder="Select region…"
                    required
                  />
                ) : (
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1.5">Region / State *</label>
                    <Input placeholder="e.g. Lagos State" value={shipping.state} onChange={(e) => updateShipping("state", e.target.value)} />
                  </div>
                )}

                {/* City */}
                {shipping.country === "Ghana" && shipping.state && GHANA_CITIES[shipping.state] ? (
                  <SelectField
                    label="City / District"
                    value={shipping.city}
                    onChange={(v) => updateShipping("city", v)}
                    options={GHANA_CITIES[shipping.state]}
                    placeholder="Select city…"
                    required
                  />
                ) : shipping.country === "Ghana" && !shipping.state ? (
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1.5">City / District *</label>
                    <Input placeholder="Select a region first" value={shipping.city} disabled className="opacity-50" />
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1.5">City *</label>
                    <Input placeholder="e.g. Lagos" value={shipping.city} onChange={(e) => updateShipping("city", e.target.value)} />
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <Button
                    onClick={() => {
                      if (!validateShipping()) return;
                      // Auto-suggest the best zone based on entered country + region
                      const guessed = guessZoneFromShipping(shipping.country, shipping.state, shippingZones);
                      if (guessed) setSelectedZoneId(guessed);
                      setStep("delivery");
                    }}
                    disabled={!validateShipping()}
                  >
                    Continue to Delivery
                  </Button>
                </div>
              </motion.div>
            )}

            {/* ── STEP 2: DELIVERY METHOD ── */}
            {step === "delivery" && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-zinc-900/50 rounded-xl border border-zinc-800/50 p-6 space-y-5"
              >
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <PackageCheck className="w-5 h-5 text-orange-500" />Delivery Method
                </h2>

                {methodsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
                  </div>
                ) : shippingMethods.length === 0 ? (
                  <p className="text-sm text-zinc-500 py-4">No delivery methods available. Please contact support.</p>
                ) : (
                  <div className="space-y-3">
                    {shippingMethods.map((method) => {
                      const effectivePrice = isFreeShipping ? 0 : method.price;
                      const isSelected = selectedMethodId === method.id;
                      return (
                        <label
                          key={method.id}
                          className={`flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-all ${
                            isSelected
                              ? "border-orange-500/30 bg-orange-500/5"
                              : "border-zinc-800/50 bg-zinc-800/20 hover:border-zinc-700/50"
                          }`}
                        >
                          <input
                            type="radio"
                            name="delivery"
                            value={method.id}
                            checked={isSelected}
                            onChange={() => setSelectedMethodId(method.id)}
                            className="w-4 h-4 accent-orange-500 shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white">{method.name}</p>
                            {method.description && <p className="text-xs text-zinc-500 mt-0.5">{method.description}</p>}
                            <p className="text-xs text-zinc-500 mt-0.5">{method.estimatedDays}</p>
                          </div>
                          <div className="text-right shrink-0">
                            {isFreeShipping ? (
                              <>
                                <p className="text-sm font-semibold text-emerald-400">Free</p>
                                <p className="text-[10px] text-zinc-600 line-through">{formatCurrency(method.price)}</p>
                              </>
                            ) : (
                              <p className="text-sm font-semibold text-white">{effectivePrice === 0 ? "Free" : formatCurrency(effectivePrice)}</p>
                            )}
                          </div>
                        </label>
                      );
                    })}

                    {/* Zone selector */}
                    {shippingZones.length > 0 && (
                      <div className="mt-2 space-y-2">
                        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Delivery Zone</p>
                        {shippingZones.map((zone) => (
                          <label
                            key={zone.id}
                            className={`flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-all ${
                              selectedZoneId === zone.id
                                ? "border-orange-500/30 bg-orange-500/5"
                                : "border-zinc-800/50 bg-zinc-800/20 hover:border-zinc-700/50"
                            }`}
                          >
                            <input
                              type="radio"
                              name="zone"
                              value={zone.id}
                              checked={selectedZoneId === zone.id}
                              onChange={() => setSelectedZoneId(zone.id)}
                              className="w-4 h-4 accent-orange-500 shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white">{zone.name}</p>
                              {zone.description && (
                                <p className="text-xs text-zinc-500 mt-0.5">{zone.description}</p>
                              )}
                            </div>
                            <div className="text-right shrink-0">
                              {zone.extraFee === 0 ? (
                                <p className="text-sm text-emerald-400 font-medium">No extra charge</p>
                              ) : (
                                <p className="text-sm font-semibold text-white">+{formatCurrency(zone.extraFee)}</p>
                              )}
                            </div>
                          </label>
                        ))}
                      </div>
                    )}

                    {/* Free shipping notice */}
                    {freeShippingEnabled && !isFreeShipping && (
                      <div className="p-3 rounded-lg bg-zinc-800/30 border border-zinc-700/30 text-xs text-zinc-400">
                        Add {formatCurrency(freeShippingThreshold - afterDiscount)} more to qualify for free shipping.
                      </div>
                    )}
                    {isFreeShipping && (
                      <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-center gap-2">
                        <Check className="w-3.5 h-3.5" />
                        Free shipping applied to your order!
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-between pt-2">
                  <Button variant="ghost" onClick={() => setStep("shipping")}>Back</Button>
                  <Button onClick={() => setStep("payment")} disabled={!selectedMethodId}>
                    Continue to Payment
                  </Button>
                </div>
              </motion.div>
            )}

            {/* ── STEP 3: PAYMENT ── */}
            {step === "payment" && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-zinc-900/50 rounded-xl border border-zinc-800/50 p-6 space-y-5"
              >
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-orange-500" />Payment Method
                </h2>

                <div className="space-y-3">
                  <label
                    className="flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-all border-orange-500/30 bg-orange-500/5"
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="PAYSTACK"
                      checked={paymentMethod === "PAYSTACK"}
                      onChange={() => setPaymentMethod("PAYSTACK")}
                      className="w-4 h-4 accent-orange-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-white">IMN Secure Pay</p>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-400 font-semibold border border-orange-500/20">Recommended</span>
                      </div>
                      <p className="text-xs text-zinc-500 mt-0.5">Card · Mobile Money (MTN, Vodafone, AirtelTigo) · Bank Transfer · USSD</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Shield className="w-3.5 h-3.5 text-green-400" />
                      <span className="text-[10px] text-green-400 font-medium">Secured</span>
                    </div>
                  </label>
                </div>

                <div className="flex justify-between pt-2">
                  <Button variant="ghost" onClick={() => setStep("delivery")}>Back</Button>
                  <Button onClick={() => setStep("review")}>Review Order</Button>
                </div>
              </motion.div>
            )}

            {/* ── STEP 4: REVIEW ── */}
            {step === "review" && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-zinc-900/50 rounded-xl border border-zinc-800/50 p-6 space-y-5"
              >
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Check className="w-5 h-5 text-orange-500" />Order Review
                </h2>

                {/* Shipping address summary */}
                <div className="p-4 rounded-lg bg-zinc-800/20 border border-zinc-800/30 space-y-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Shipping To</h3>
                    <button onClick={() => setStep("shipping")} className="text-[10px] text-orange-500 hover:text-orange-400 transition-colors cursor-pointer">Edit</button>
                  </div>
                  <p className="text-sm text-white">{shipping.firstName} {shipping.lastName}</p>
                  <p className="text-xs text-zinc-500">{shipping.email}</p>
                  <p className="text-xs text-zinc-500">{shipping.phone}</p>
                  <p className="text-xs text-zinc-500">{shipping.address}, {shipping.city}, {shipping.state}, {shipping.country}</p>
                </div>

                {/* Delivery method summary */}
                <div className="p-4 rounded-lg bg-zinc-800/20 border border-zinc-800/30">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Delivery Method</h3>
                    <button onClick={() => setStep("delivery")} className="text-[10px] text-orange-500 hover:text-orange-400 transition-colors cursor-pointer">Edit</button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-white">{selectedMethod?.name ?? "Standard Delivery"}</p>
                      {selectedMethod?.estimatedDays && (
                        <p className="text-xs text-zinc-500">{selectedMethod.estimatedDays}</p>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-white">
                      {isFreeShipping ? <span className="text-emerald-400">Free</span> : formatCurrency(shipCost)}
                    </p>
                  </div>
                </div>

                {/* Payment summary */}
                <div className="p-4 rounded-lg bg-zinc-800/20 border border-zinc-800/30">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Payment</h3>
                    <button onClick={() => setStep("payment")} className="text-[10px] text-orange-500 hover:text-orange-400 transition-colors cursor-pointer">Edit</button>
                  </div>
                  <p className="text-sm text-white">IMN Secure Pay</p>
                  <p className="text-xs text-zinc-500">Card · Mobile Money · Bank Transfer · USSD</p>
                </div>

                {/* Order items */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    Items ({checkoutList.reduce((s, i) => s + i.quantity, 0)})
                  </h3>
                  {checkoutList.map((item) => (
                    <div key={`${item.id}-${item.variant}`} className="flex items-center justify-between py-3 border-b border-zinc-800/30 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-zinc-800/50 border border-zinc-700/30 flex items-center justify-center shrink-0 overflow-hidden relative">
                          {item.image ? (
                            <Image src={item.image} alt={item.name} fill className="object-cover" sizes="48px" />
                          ) : (
                            <ShoppingBag className="w-4 h-4 text-zinc-600" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{item.name}</p>
                          <p className="text-xs text-zinc-500">Qty: {item.quantity}{item.variant && ` · ${item.variant}`}</p>
                        </div>
                      </div>
                      <p className="text-sm text-white font-medium">
                        {formatCurrency((item.salePrice ?? item.price) * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="space-y-2 pt-3 border-t border-zinc-800/50">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Subtotal</span>
                    <span className="text-white">{formatCurrency(sub)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-emerald-400">Discount ({discountPercent}%)</span>
                      <span className="text-emerald-400">-{formatCurrency(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Shipping · {selectedMethod?.name}</span>
                    <span className={isFreeShipping ? "text-emerald-400 font-medium" : "text-white"}>
                      {isFreeShipping ? "Free" : formatCurrency(shipCost)}
                    </span>
                  </div>
                  <div className="flex justify-between text-base font-bold pt-2 border-t border-zinc-800/50">
                    <span className="text-white">Total</span>
                    <span className="text-orange-500">{formatCurrency(grandTotal)}</span>
                  </div>
                </div>

                {orderError && (
                  <div className={`p-4 rounded-lg border flex items-start gap-3 ${
                    orderError === "__AUTH__"
                      ? "bg-amber-500/10 border-amber-500/30"
                      : "bg-red-500/10 border-red-500/20"
                  }`}>
                    {orderError === "__AUTH__" ? (
                      <UserCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    )}
                    {orderError === "__AUTH__" ? (
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-amber-300">You need to sign in to place this order</p>
                        <p className="text-xs text-amber-400/80 mt-1">
                          Your cart is saved — sign in or create a free account and you will be brought right back here.
                        </p>
                        <div className="flex gap-2 mt-3">
                          <Button asChild size="sm" variant="outline" className="border-amber-500/40 text-amber-300 hover:bg-amber-500/10 hover:text-amber-200 text-xs">
                            <Link href="/auth/login?redirect=/checkout">Sign In</Link>
                          </Button>
                          <Button asChild size="sm" className="bg-amber-500 hover:bg-amber-400 text-black text-xs font-semibold">
                            <Link href="/auth/register?redirect=/checkout">Create Account</Link>
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-red-400">{orderError}</p>
                    )}
                  </div>
                )}

                <div className="flex justify-between pt-2">
                  <Button variant="ghost" onClick={() => setStep("payment")}>Back</Button>
                  <Button className="gap-2" onClick={handlePlaceOrder} disabled={placing}>
                    {placing ? (
                      <><Loader2 className="w-4 h-4 animate-spin" />Processing...</>
                    ) : (
                      <><Lock className="w-4 h-4" />Place Order — {formatCurrency(grandTotal)}</>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <OrderSummary />
          </div>
        </div>
      </div>
    </div>
  );
}
