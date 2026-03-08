"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useCartStore } from "@/stores";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

export function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, subtotal, totalItems } =
    useCartStore();

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
                <h2 className="text-lg font-bold text-white font-display">
                  Your Cart
                </h2>
                <span className="text-xs text-zinc-500">
                  ({totalItems()} items)
                </span>
              </div>
              <button
                onClick={closeCart}
                className="w-8 h-8 rounded-lg bg-zinc-800/50 hover:bg-zinc-700/50 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-zinc-400" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <ShoppingBag className="w-12 h-12 text-zinc-700 mb-4" />
                  <p className="text-zinc-400 font-medium mb-1">
                    Your cart is empty
                  </p>
                  <p className="text-sm text-zinc-600 mb-6">
                    Browse our store to find something you&apos;ll love.
                  </p>
                  <Button variant="outline" onClick={closeCart} asChild>
                    <Link href="/store">Browse Store</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((item) => {
                    const effectivePrice = item.salePrice ?? item.price;
                    return (
                      <div
                        key={`${item.id}-${item.variant}`}
                        className="flex gap-4 p-4 rounded-lg bg-zinc-900/50 border border-zinc-800/30"
                      >
                        {/* Image */}
                        <div className="w-16 h-16 rounded-md bg-zinc-800/50 border border-zinc-700/50 flex items-center justify-center shrink-0 overflow-hidden relative">
                          {item.image ? (
                            <Image
                              src={item.image}
                              alt={item.name}
                              fill
                              className="object-cover"
                              sizes="64px"
                            />
                          ) : (
                            <ShoppingBag className="w-5 h-5 text-zinc-600" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">
                            {item.name}
                          </p>
                          {item.variant && (
                            <p className="text-xs text-zinc-500 mt-0.5">
                              {item.variant}
                            </p>
                          )}
                          <p className="text-sm font-semibold text-orange-500 mt-1">
                            {formatCurrency(effectivePrice)}
                          </p>

                          {/* Quantity controls */}
                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center border border-zinc-700/50 rounded-md">
                              <button
                                onClick={() =>
                                  updateQuantity(item.id, item.quantity - 1)
                                }
                                className="w-7 h-7 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-8 text-center text-xs text-white font-medium">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() =>
                                  updateQuantity(item.id, item.quantity + 1)
                                }
                                className="w-7 h-7 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                            <button
                              onClick={() => removeItem(item.id)}
                              className="text-zinc-600 hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="px-6 py-5 border-t border-zinc-800/50 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-400">Subtotal</span>
                  <span className="text-lg font-bold text-white font-display">
                    {formatCurrency(subtotal())}
                  </span>
                </div>
                <p className="text-xs text-zinc-600">
                  Shipping and taxes calculated at checkout.
                </p>
                <Button className="w-full gap-2" onClick={closeCart} asChild>
                  <Link href="/checkout">
                    Checkout
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
