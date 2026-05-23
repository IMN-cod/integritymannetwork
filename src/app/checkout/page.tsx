"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  ShoppingBag, Shield, Lock, CreditCard, ChevronLeft,
  Check, Truck, Loader2, AlertCircle, Tag, X, UserCircle, PackageCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCartStore } from "@/stores";
import { formatCurrency } from "@/lib/utils";
import { useSession } from "next-auth/react";
import type { ShippingMethod } from "@/app/api/store/shipping/route";

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

  // ── Shipping methods ───────────────────────────────────────────────
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [freeShippingEnabled, setFreeShippingEnabled] = useState(true);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(2000);
  const [selectedMethodId, setSelectedMethodId] = useState<string | null>(null);
  const [methodsLoading, setMethodsLoading] = useState(true);

  const fetchShippingMethods = useCallback(async () => {
    try {
      const res = await fetch("/api/store/shipping");
      if (!res.ok) throw new Error();
      const data = await res.json();
      const methods: ShippingMethod[] = data.methods || [];
      setShippingMethods(methods);
      setFreeShippingEnabled(data.freeShippingEnabled ?? true);
      setFreeShippingThreshold(data.freeShippingThreshold ?? 2000);
      if (methods.length > 0 && !selectedMethodId) {
        setSelectedMethodId(methods[0].id);
      }
    } catch {
      // Fallback to a single standard method
      const fallback: ShippingMethod = { id: "standard", name: "Standard Delivery", description: "", price: 35, estimatedDays: "5-7 business days", enabled: true };
      setShippingMethods([fallback]);
      setSelectedMethodId("standard");
    } finally {
      setMethodsLoading(false);
    }
  }, [selectedMethodId]);

  useEffect(() => { fetchShippingMethods(); }, [fetchShippingMethods]);

  const selectedMethod = shippingMethods.find((m) => m.id === selectedMethodId) ?? shippingMethods[0] ?? null;

  // ── Cost calculation ───────────────────────────────────────────────
  const sub = checkoutList.reduce((s, item) => s + (item.salePrice ?? item.price) * item.quantity, 0);
  const discount = (sub * discountPercent) / 100;
  const afterDiscount = sub - discount;
  const isFreeShipping = freeShippingEnabled && afterDiscount >= freeShippingThreshold;
  const shipCost = isFreeShipping ? 0 : (selectedMethod?.price ?? 0);
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
            {isFreeShipping ? "Free" : selectedMethod ? formatCurrency(selectedMethod.price) : "—"}
          </span>
        </div>
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
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Truck className="w-5 h-5 text-orange-500" />Shipping Address
                </h2>

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
                  <Input placeholder="123 Main Street" value={shipping.address} onChange={(e) => updateShipping("address", e.target.value)} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1.5">City *</label>
                    <Input placeholder="Accra" value={shipping.city} onChange={(e) => updateShipping("city", e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1.5">Region *</label>
                    <Input placeholder="Greater Accra" value={shipping.state} onChange={(e) => updateShipping("state", e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1.5">Country *</label>
                    <Input placeholder="Ghana" value={shipping.country} onChange={(e) => updateShipping("country", e.target.value)} />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button onClick={() => { if (validateShipping()) setStep("delivery"); }} disabled={!validateShipping()}>
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
