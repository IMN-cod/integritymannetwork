"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  ShoppingBag,
  Shield,
  Lock,
  CreditCard,
  ChevronLeft,
  Check,
  Truck,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCartStore } from "@/stores";
import { formatCurrency } from "@/lib/utils";

type Step = "shipping" | "payment" | "review";

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
  const { items, subtotal, totalItems, clearCart } = useCartStore();
  const [step, setStep] = useState<Step>("shipping");
  const [paymentMethod, setPaymentMethod] = useState<
    "PAYSTACK" | "STRIPE" | "PAYPAL"
  >("PAYSTACK");
  const [placing, setPlacing] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  const [shipping, setShipping] = useState<ShippingInfo>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    country: "Ghana",
  });

  const shippingCost = subtotal() > 50000 ? 0 : 3500;
  const total = subtotal() + shippingCost;

  /* ─── Handlers ─── */
  const updateShipping = (field: keyof ShippingInfo, value: string) => {
    setShipping((prev) => ({ ...prev, [field]: value }));
  };

  const validateShipping = (): boolean => {
    const required: (keyof ShippingInfo)[] = [
      "firstName",
      "lastName",
      "email",
      "phone",
      "address",
      "city",
      "state",
      "country",
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
          items: items.map((item) => ({
            productId: item.id,
            variantId: item.variant || undefined,
            quantity: item.quantity,
            price: item.salePrice ?? item.price,
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          setOrderError("Please sign in to place an order.");
          return;
        }
        setOrderError(data.error || "Failed to create order. Please try again.");
        return;
      }

      // Clear cart
      clearCart();

      // Redirect to payment gateway
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

  /* ─── Empty cart ─── */
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <ShoppingBag className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white font-display mb-2">
            Your Cart is Empty
          </h1>
          <p className="text-zinc-500 mb-6">
            Add items to your cart to proceed to checkout.
          </p>
          <Button asChild>
            <Link href="/store">Browse Store</Link>
          </Button>
        </div>
      </div>
    );
  }

  const steps: { key: Step; label: string; icon: typeof Truck }[] = [
    { key: "shipping", label: "Shipping", icon: Truck },
    { key: "payment", label: "Payment", icon: CreditCard },
    { key: "review", label: "Review", icon: Check },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 py-12">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link
            href="/store"
            className="text-zinc-500 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold text-white font-display">
            Checkout
          </h1>
          <div className="flex items-center gap-1 ml-auto text-xs text-zinc-500">
            <Lock className="w-3.5 h-3.5" />
            Secure Checkout
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-3 mb-10">
          {steps.map((s, idx) => {
            const isActive = s.key === step;
            const stepIndex = steps.findIndex((x) => x.key === step);
            const isDone = idx < stepIndex;
            return (
              <div key={s.key} className="flex items-center gap-3">
                <button
                  onClick={() => {
                    if (isDone) setStep(s.key);
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-all ${
                    isActive
                      ? "bg-orange-500/10 border border-orange-500/30 text-orange-500"
                      : isDone
                      ? "bg-green-500/10 border border-green-500/30 text-green-400 cursor-pointer hover:bg-green-500/15"
                      : "bg-zinc-800/30 border border-zinc-800/50 text-zinc-500 cursor-default"
                  }`}
                >
                  {isDone ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <s.icon className="w-4 h-4" />
                  )}
                  {s.label}
                </button>
                {idx < steps.length - 1 && (
                  <div className="w-8 h-px bg-zinc-800" />
                )}
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Sections */}
          <div className="lg:col-span-2 space-y-6">
            {/* SHIPPING */}
            {step === "shipping" && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-zinc-900/50 rounded-xl border border-zinc-800/50 p-6 space-y-5"
              >
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Truck className="w-5 h-5 text-orange-500" />
                  Shipping Information
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1.5">
                      First Name *
                    </label>
                    <Input
                      placeholder="John"
                      value={shipping.firstName}
                      onChange={(e) =>
                        updateShipping("firstName", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1.5">
                      Last Name *
                    </label>
                    <Input
                      placeholder="Doe"
                      value={shipping.lastName}
                      onChange={(e) =>
                        updateShipping("lastName", e.target.value)
                      }
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-zinc-400 mb-1.5">
                    Email *
                  </label>
                  <Input
                    type="email"
                    placeholder="john@example.com"
                    value={shipping.email}
                    onChange={(e) => updateShipping("email", e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm text-zinc-400 mb-1.5">
                    Phone *
                  </label>
                  <Input
                    type="tel"
                    placeholder="+233 20 123 4567"
                    value={shipping.phone}
                    onChange={(e) => updateShipping("phone", e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm text-zinc-400 mb-1.5">
                    Address *
                  </label>
                  <Input
                    placeholder="123 Main Street"
                    value={shipping.address}
                    onChange={(e) => updateShipping("address", e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1.5">
                      City *
                    </label>
                    <Input
                      placeholder="Accra"
                      value={shipping.city}
                      onChange={(e) => updateShipping("city", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1.5">
                      Region *
                    </label>
                    <Input
                      placeholder="Greater Accra"
                      value={shipping.state}
                      onChange={(e) => updateShipping("state", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1.5">
                      Country *
                    </label>
                    <Input
                      placeholder="Ghana"
                      value={shipping.country}
                      onChange={(e) =>
                        updateShipping("country", e.target.value)
                      }
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    onClick={() => {
                      if (validateShipping()) {
                        setStep("payment");
                      }
                    }}
                    disabled={!validateShipping()}
                  >
                    Continue to Payment
                  </Button>
                </div>
              </motion.div>
            )}

            {/* PAYMENT */}
            {step === "payment" && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-zinc-900/50 rounded-xl border border-zinc-800/50 p-6 space-y-5"
              >
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-orange-500" />
                  Payment Method
                </h2>

                <div className="space-y-3">
                  {[
                    {
                      id: "PAYSTACK" as const,
                      label: "Paystack",
                      desc: "Pay with card, bank transfer, mobile money, or USSD",
                    },
                    {
                      id: "STRIPE" as const,
                      label: "Stripe",
                      desc: "International card payments (Visa, Mastercard)",
                    },
                    {
                      id: "PAYPAL" as const,
                      label: "PayPal",
                      desc: "Pay with your PayPal account",
                    },
                  ].map((method) => (
                    <label
                      key={method.id}
                      className={`flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-all ${
                        paymentMethod === method.id
                          ? "border-orange-500/30 bg-orange-500/5"
                          : "border-zinc-800/50 bg-zinc-800/20 hover:border-zinc-700/50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        value={method.id}
                        checked={paymentMethod === method.id}
                        onChange={() => setPaymentMethod(method.id)}
                        className="w-4 h-4 text-orange-500 bg-zinc-800 border-zinc-600 focus:ring-orange-500/20"
                      />
                      <div>
                        <p className="text-sm font-medium text-white">
                          {method.label}
                        </p>
                        <p className="text-xs text-zinc-500">{method.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>

                <div className="flex justify-between pt-2">
                  <Button variant="ghost" onClick={() => setStep("shipping")}>
                    Back
                  </Button>
                  <Button onClick={() => setStep("review")}>
                    Review Order
                  </Button>
                </div>
              </motion.div>
            )}

            {/* REVIEW */}
            {step === "review" && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-zinc-900/50 rounded-xl border border-zinc-800/50 p-6 space-y-5"
              >
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Check className="w-5 h-5 text-orange-500" />
                  Order Review
                </h2>

                {/* Shipping summary */}
                <div className="p-4 rounded-lg bg-zinc-800/20 border border-zinc-800/30 space-y-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                      Shipping To
                    </h3>
                    <button
                      onClick={() => setStep("shipping")}
                      className="text-[10px] text-orange-500 hover:text-orange-400 transition-colors"
                    >
                      Edit
                    </button>
                  </div>
                  <p className="text-sm text-white">
                    {shipping.firstName} {shipping.lastName}
                  </p>
                  <p className="text-xs text-zinc-500">{shipping.email}</p>
                  <p className="text-xs text-zinc-500">{shipping.phone}</p>
                  <p className="text-xs text-zinc-500">
                    {shipping.address}, {shipping.city}, {shipping.state},{" "}
                    {shipping.country}
                  </p>
                </div>

                {/* Payment method summary */}
                <div className="p-4 rounded-lg bg-zinc-800/20 border border-zinc-800/30">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                      Payment
                    </h3>
                    <button
                      onClick={() => setStep("payment")}
                      className="text-[10px] text-orange-500 hover:text-orange-400 transition-colors"
                    >
                      Edit
                    </button>
                  </div>
                  <p className="text-sm text-white">
                    {paymentMethod === "PAYSTACK"
                      ? "Paystack"
                      : paymentMethod === "STRIPE"
                      ? "Stripe"
                      : "PayPal"}
                  </p>
                </div>

                {/* Order items */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    Items ({totalItems()})
                  </h3>
                  {items.map((item) => (
                    <div
                      key={`${item.id}-${item.variant}`}
                      className="flex items-center justify-between py-3 border-b border-zinc-800/30 last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-zinc-800/50 border border-zinc-700/30 flex items-center justify-center shrink-0 overflow-hidden relative">
                          {item.image ? (
                            <Image
                              src={item.image}
                              alt={item.name}
                              fill
                              className="object-cover"
                              sizes="48px"
                            />
                          ) : (
                            <ShoppingBag className="w-4 h-4 text-zinc-600" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">
                            {item.name}
                          </p>
                          <p className="text-xs text-zinc-500">
                            Qty: {item.quantity}
                            {item.variant && ` · ${item.variant}`}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-white font-medium">
                        {formatCurrency(
                          (item.salePrice ?? item.price) * item.quantity
                        )}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="space-y-2 pt-3 border-t border-zinc-800/50">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Subtotal</span>
                    <span className="text-white">
                      {formatCurrency(subtotal())}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Shipping</span>
                    <span className="text-white">
                      {shippingCost === 0
                        ? "Free"
                        : formatCurrency(shippingCost)}
                    </span>
                  </div>
                  <div className="flex justify-between text-base font-bold pt-2 border-t border-zinc-800/50">
                    <span className="text-white">Total</span>
                    <span className="text-orange-500">
                      {formatCurrency(total)}
                    </span>
                  </div>
                </div>

                {/* Error message */}
                {orderError && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <p className="text-sm text-red-400">{orderError}</p>
                  </div>
                )}

                <div className="flex justify-between pt-2">
                  <Button variant="ghost" onClick={() => setStep("payment")}>
                    Back
                  </Button>
                  <Button
                    className="gap-2"
                    onClick={handlePlaceOrder}
                    disabled={placing}
                  >
                    {placing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        Place Order — {formatCurrency(total)}
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-zinc-900/50 rounded-xl border border-zinc-800/50 p-6 sticky top-24">
              <h3 className="text-sm font-semibold text-white mb-4">
                Order Summary
              </h3>

              <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
                {items.map((item) => (
                  <div
                    key={`${item.id}-${item.variant}`}
                    className="flex items-center gap-3"
                  >
                    <div className="w-10 h-10 rounded-md bg-zinc-800/50 border border-zinc-700/50 flex items-center justify-center shrink-0 overflow-hidden relative">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                          sizes="40px"
                        />
                      ) : (
                        <ShoppingBag className="w-4 h-4 text-zinc-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-white truncate">
                        {item.name}
                      </p>
                      <p className="text-[10px] text-zinc-500">
                        {item.quantity} × {formatCurrency(item.salePrice ?? item.price)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2 pt-4 border-t border-zinc-800/50">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Subtotal</span>
                  <span className="text-white">
                    {formatCurrency(subtotal())}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Shipping</span>
                  <span className="text-white">
                    {shippingCost === 0 ? "Free" : formatCurrency(shippingCost)}
                  </span>
                </div>
                <div className="flex justify-between text-base font-bold pt-2 border-t border-zinc-800/50">
                  <span className="text-white">Total</span>
                  <span className="text-orange-500">
                    {formatCurrency(total)}
                  </span>
                </div>
              </div>

              {/* Trust badges */}
              <div className="mt-6 pt-4 border-t border-zinc-800/50 space-y-2">
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  <Shield className="w-3.5 h-3.5 text-green-400" />
                  Secure checkout — SSL encrypted
                </div>
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  <Truck className="w-3.5 h-3.5 text-green-400" />
                  Free shipping over GH₵500
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
