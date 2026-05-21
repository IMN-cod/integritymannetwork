"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, ShoppingBag, Plus, Minus, Trash2, ArrowRight, Truck,
  Tag, Check, Heart, ChevronRight,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useCartStore } from "@/stores";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency, cn } from "@/lib/utils";

const FREE_SHIPPING_THRESHOLD = 500;

// ─── Promo codes (demo — extend with API validation) ──────────────────────────
const PROMO_CODES: Record<string, number> = {
  TIMN10: 10,
  INTEGRITY15: 15,
  WELCOME20: 20,
};

export function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, subtotal, totalItems } = useCartStore();

  const [coupon, setCoupon] = useState("");
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  const [couponError, setCouponError] = useState("");

  const sub = subtotal();
  const discountPercent = appliedCode ? (PROMO_CODES[appliedCode] ?? 0) : 0;
  const discountAmount = (sub * discountPercent) / 100;
  const shippingCost = sub - discountAmount >= FREE_SHIPPING_THRESHOLD ? 0 : 35;
  const total = sub - discountAmount + shippingCost;
  const shippingProgress = Math.min(100, (sub / FREE_SHIPPING_THRESHOLD) * 100);
  const shippingRemaining = Math.max(0, FREE_SHIPPING_THRESHOLD - sub);

  const savings = items.reduce((acc, item) => {
    if (item.salePrice != null) return acc + (item.price - item.salePrice) * item.quantity;
    return acc;
  }, 0);

  const handleApplyCoupon = () => {
    const code = coupon.trim().toUpperCase();
    if (!code) return;
    if (PROMO_CODES[code] != null) {
      setAppliedCode(code);
      setCoupon("");
      setCouponError("");
    } else {
      setCouponError("Invalid promo code. Try TIMN10.");
      setAppliedCode(null);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={closeCart}
          />

          {/* Drawer */}
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 z-50 w-full max-w-md h-screen bg-zinc-950 border-l border-zinc-800/50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-800/50">
              <div className="flex items-center gap-3">
                <ShoppingBag className="w-5 h-5 text-orange-500" />
                <h2 className="text-lg font-bold text-white font-display">Your Cart</h2>
                <AnimatePresence mode="wait">
                  <motion.span
                    key={totalItems()}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                    className="text-xs text-zinc-500"
                  >
                    ({totalItems()} {totalItems() === 1 ? "item" : "items"})
                  </motion.span>
                </AnimatePresence>
              </div>
              <button
                onClick={closeCart}
                className="w-8 h-8 rounded-lg bg-zinc-800/50 hover:bg-zinc-700/50 flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Close cart"
              >
                <X className="w-4 h-4 text-zinc-400" />
              </button>
            </div>

            {/* Free shipping progress */}
            {items.length > 0 && (
              <div className="px-6 py-3 border-b border-zinc-800/40 bg-zinc-900/30">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-zinc-400">
                    {shippingRemaining > 0 ? (
                      <>
                        Add{" "}
                        <span className="text-orange-400 font-semibold">{formatCurrency(shippingRemaining)}</span>{" "}
                        for free shipping
                      </>
                    ) : (
                      <span className="text-emerald-400 font-semibold">Free shipping unlocked!</span>
                    )}
                  </span>
                  <Truck className={cn("w-4 h-4", shippingRemaining === 0 ? "text-emerald-400" : "text-zinc-600")} />
                </div>
                <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <motion.div
                    className={cn("h-full rounded-full transition-colors", shippingProgress >= 100 ? "bg-emerald-500" : "bg-orange-500")}
                    initial={{ width: 0 }}
                    animate={{ width: `${shippingProgress}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                </div>
              </div>
            )}

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <ShoppingBag className="w-12 h-12 text-zinc-700 mb-4" />
                  <p className="text-zinc-400 font-medium mb-1">Your cart is empty</p>
                  <p className="text-sm text-zinc-600 mb-6">Browse our store to find something you&apos;ll love.</p>
                  <div className="flex flex-col gap-3 w-full max-w-xs">
                    <Button variant="outline" onClick={closeCart} asChild>
                      <Link href="/store">Browse Store</Link>
                    </Button>
                    <Link href="/store/wishlist" onClick={closeCart} className="flex items-center justify-center gap-2 text-sm text-zinc-500 hover:text-red-400 transition-colors cursor-pointer">
                      <Heart className="w-4 h-4" />View Wishlist
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <AnimatePresence initial={false}>
                    {items.map((item) => {
                      const effectivePrice = item.salePrice ?? item.price;
                      return (
                        <motion.div
                          key={`${item.id}-${item.variant}`}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className="flex gap-3.5 p-3.5 rounded-xl bg-zinc-900/50 border border-zinc-800/30">
                            {/* Image */}
                            <div className="w-16 h-16 rounded-lg bg-zinc-800/50 border border-zinc-700/30 flex items-center justify-center shrink-0 overflow-hidden relative">
                              {item.image ? (
                                <Image src={item.image} alt={item.name} fill className="object-cover" sizes="64px" />
                              ) : (
                                <ShoppingBag className="w-5 h-5 text-zinc-600" />
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white truncate leading-snug">{item.name}</p>
                              {item.variant && (
                                <p className="text-[11px] text-zinc-500 mt-0.5">{item.variant}</p>
                              )}
                              <div className="flex items-center gap-2 mt-0.5">
                                <p className="text-sm font-semibold text-orange-500">{formatCurrency(effectivePrice)}</p>
                                {item.salePrice != null && (
                                  <p className="text-[11px] text-zinc-600 line-through">{formatCurrency(item.price)}</p>
                                )}
                              </div>

                              <div className="flex items-center justify-between mt-2.5">
                                <div className="flex items-center border border-zinc-700/50 rounded-lg overflow-hidden">
                                  <button
                                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                    className="w-7 h-7 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                                    aria-label="Decrease quantity"
                                  >
                                    <Minus className="w-3 h-3" />
                                  </button>
                                  <span className="w-7 text-center text-xs text-white font-semibold border-x border-zinc-800/50">
                                    {item.quantity}
                                  </span>
                                  <button
                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                    className="w-7 h-7 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                                    aria-label="Increase quantity"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                </div>
                                <button
                                  onClick={() => removeItem(item.id)}
                                  className="text-zinc-600 hover:text-red-400 transition-colors cursor-pointer p-1"
                                  aria-label="Remove item"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="px-6 py-5 border-t border-zinc-800/50 space-y-4">
                {/* Savings badge */}
                <AnimatePresence>
                  {savings > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="flex items-center justify-between py-2 px-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20"
                    >
                      <span className="text-xs text-emerald-400 font-medium flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5" />You&apos;re saving
                      </span>
                      <span className="text-xs text-emerald-400 font-bold">{formatCurrency(savings)}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Promo code */}
                <div className="space-y-2">
                  {appliedCode ? (
                    <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                      <span className="text-xs text-orange-400 font-medium flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5" />
                        Code <strong>{appliedCode}</strong> applied ({discountPercent}% off)
                      </span>
                      <button
                        onClick={() => setAppliedCode(null)}
                        className="text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                      >
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
                          className="flex-1 h-9 text-xs bg-zinc-900 border-zinc-700/60 placeholder:text-zinc-600"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-zinc-700 text-zinc-400 hover:text-white text-xs cursor-pointer h-9"
                          onClick={handleApplyCoupon}
                        >
                          Apply
                        </Button>
                      </div>
                      {couponError && (
                        <p className="text-[11px] text-red-400">{couponError}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Order summary */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between text-zinc-400">
                    <span>Subtotal</span>
                    <span>{formatCurrency(sub)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex items-center justify-between text-emerald-400">
                      <span>Discount ({discountPercent}%)</span>
                      <span>-{formatCurrency(discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-zinc-400">
                    <span>Shipping</span>
                    <span className={shippingCost === 0 ? "text-emerald-400 font-medium" : ""}>
                      {shippingCost === 0 ? "Free" : formatCurrency(shippingCost)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-zinc-800/50 text-base font-bold text-white">
                    <span>Total</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                </div>

                <Button className="w-full gap-2 cursor-pointer" onClick={closeCart} asChild>
                  <Link href="/checkout">
                    Checkout
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>

                <div className="flex items-center justify-between text-[11px] text-zinc-600">
                  <Link href="/store" onClick={closeCart} className="hover:text-zinc-400 transition-colors cursor-pointer">Continue Shopping</Link>
                  <Link href="/store/wishlist" onClick={closeCart} className="flex items-center gap-1 hover:text-red-400 transition-colors cursor-pointer">
                    <Heart className="w-3 h-3" />Wishlist
                    <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
