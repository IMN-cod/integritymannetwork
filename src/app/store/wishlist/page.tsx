"use client";

/* eslint-disable @next/next/no-img-element */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart, ShoppingCart, Trash2, ArrowLeft, ShoppingBag,
  Loader2, Share2, Check, X, Truck,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatCurrency, cn } from "@/lib/utils";
import { useCartStore, useWishlistStore } from "@/stores";

interface WishlistProduct {
  id: string;
  name: string;
  slug: string;
  summary: string | null;
  price: number;
  comparePrice: number | null;
  images: string[];
  stock: number;
  badge: string | null;
  isDigital: boolean;
  category: { name: string; slug: string } | null;
  variants: { id: string; name: string; value: string; price: number | null; stock: number }[];
}

export default function WishlistPage() {
  const { ids, removeItem, clearWishlist } = useWishlistStore();
  const { addItem, openCart } = useCartStore();

  const [products, setProducts] = useState<WishlistProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [shared, setShared] = useState(false);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (ids.length === 0) { setProducts([]); return; }
    setLoading(true);
    fetch(`/api/store?ids=${ids.join(",")}&limit=100`)
      .then((r) => r.json())
      .then((data) => setProducts(data.products ?? []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [ids]);

  const handleAddToCart = (product: WishlistProduct) => {
    const price = Number(product.price);
    const comparePrice = product.comparePrice ? Number(product.comparePrice) : null;
    addItem({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: comparePrice ?? price,
      salePrice: comparePrice ? price : undefined,
      image: product.images[0],
    });
    openCart();
    setAddedIds((prev) => new Set(prev).add(product.id));
    setTimeout(() => setAddedIds((prev) => { const s = new Set(prev); s.delete(product.id); return s; }), 2000);
  };

  const handleAddAllToCart = () => {
    products.forEach((p) => {
      if (p.isDigital || p.stock > 0) handleAddToCart(p);
    });
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: "My TIMN Wishlist", url }); } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(url);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    }
  };

  const inStockCount = products.filter((p) => p.isDigital || p.stock > 0).length;

  return (
    <>
      {/* Header */}
      <section className="relative pt-28 pb-10 sm:pt-32 sm:pb-12 overflow-hidden">
        <div className="absolute inset-0 bg-zinc-950" />
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="absolute inset-0 bg-radial-dark" />
        <div className="container-wide relative z-10">
          <Link
            href="/store"
            className="inline-flex items-center gap-2 text-xs text-zinc-500 hover:text-orange-500 transition-colors mb-6 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />Back to Store
          </Link>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col sm:flex-row sm:items-end justify-between gap-4"
          >
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 backdrop-blur-sm mb-4">
                <Heart className="w-3.5 h-3.5 text-red-400 fill-red-400" />
                <span className="text-[10px] sm:text-xs font-semibold tracking-[0.15em] uppercase text-red-400">
                  My Wishlist
                </span>
              </div>
              <h1 className="font-display text-3xl sm:text-4xl font-bold text-white">
                Saved Items
              </h1>
              <p className="text-sm text-zinc-400 mt-2">
                {ids.length === 0
                  ? "Your wishlist is empty"
                  : `${ids.length} item${ids.length !== 1 ? "s" : ""} saved · ${inStockCount} in stock`}
              </p>
            </div>

            {ids.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShare}
                  className="border-zinc-800 text-zinc-400 hover:text-white cursor-pointer"
                >
                  {shared ? <><Check className="w-3.5 h-3.5 text-emerald-400" />Copied!</> : <><Share2 className="w-3.5 h-3.5" />Share</>}
                </Button>
                {inStockCount > 1 && (
                  <Button size="sm" onClick={handleAddAllToCart} className="cursor-pointer">
                    <ShoppingCart className="w-3.5 h-3.5" />Add All to Cart
                  </Button>
                )}
                <button
                  onClick={clearWishlist}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer border border-transparent hover:border-red-500/20"
                >
                  <X className="w-3.5 h-3.5" />Clear all
                </button>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      <div className="divider-gradient" />

      <section className="py-10 sm:py-14">
        <div className="container-wide">
          {loading ? (
            <div className="flex items-center justify-center py-28">
              <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
            </div>
          ) : ids.length === 0 ? (
            /* Empty state */
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-28"
            >
              <div className="w-20 h-20 rounded-2xl bg-zinc-800/40 border border-zinc-800/60 flex items-center justify-center mx-auto mb-6">
                <Heart className="w-9 h-9 text-zinc-700" />
              </div>
              <h2 className="text-xl font-bold text-white font-display mb-2">No saved items yet</h2>
              <p className="text-sm text-zinc-500 mb-8 max-w-sm mx-auto leading-relaxed">
                Browse the store and tap the heart icon on any product to save it here for later.
              </p>
              <Button asChild className="cursor-pointer">
                <Link href="/store">
                  <ShoppingBag className="w-4 h-4" />Browse Store
                </Link>
              </Button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
              <AnimatePresence>
                {products.map((product, i) => {
                  const price = Number(product.price);
                  const comparePrice = product.comparePrice ? Number(product.comparePrice) : null;
                  const discount = comparePrice ? Math.round(((comparePrice - price) / comparePrice) * 100) : null;
                  const inStock = product.isDigital || product.stock > 0;
                  const added = addedIds.has(product.id);

                  return (
                    <motion.div
                      key={product.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9, height: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.04 }}
                    >
                      <div className="group rounded-2xl border border-zinc-800/60 bg-zinc-900/40 overflow-hidden hover:border-zinc-700/80 hover:bg-zinc-900/60 transition-all duration-300 flex flex-col h-full">
                        {/* Image */}
                        <Link href={`/store/${product.slug}`} className="block relative cursor-pointer">
                          <div className="aspect-square bg-zinc-800/30 overflow-hidden relative">
                            {product.images[0] ? (
                              <img
                                src={product.images[0]}
                                alt={product.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <ShoppingBag className="w-12 h-12 text-zinc-700/60" />
                              </div>
                            )}

                            {/* Badges */}
                            <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                              {product.badge && (
                                <span className="text-[9px] font-bold uppercase tracking-wider bg-orange-500 text-white px-2 py-0.5 rounded shadow-lg">
                                  {product.badge}
                                </span>
                              )}
                              {discount && discount > 0 && (
                                <span className="text-[9px] font-bold bg-emerald-500 text-white px-2 py-0.5 rounded shadow-lg">
                                  -{discount}%
                                </span>
                              )}
                            </div>

                            {/* Remove from wishlist */}
                            <button
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); removeItem(product.id); }}
                              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg shadow-red-500/30 hover:bg-red-600 transition-colors cursor-pointer"
                              aria-label="Remove from wishlist"
                            >
                              <Heart className="w-3.5 h-3.5 fill-current" />
                            </button>

                            {/* Stock badge */}
                            <div className="absolute bottom-3 right-3">
                              {inStock ? (
                                <span className="text-[9px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full backdrop-blur-sm">
                                  In Stock
                                </span>
                              ) : (
                                <span className="text-[9px] font-medium text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full backdrop-blur-sm">
                                  Out of Stock
                                </span>
                              )}
                            </div>
                          </div>
                        </Link>

                        {/* Body */}
                        <div className="p-4 sm:p-5 flex flex-col flex-1">
                          {product.category && (
                            <p className="text-[10px] text-zinc-600 uppercase tracking-wider mb-1.5">
                              {product.category.name}
                            </p>
                          )}
                          <Link href={`/store/${product.slug}`} className="cursor-pointer">
                            <h3 className="text-sm font-bold text-white font-display mb-1.5 line-clamp-2 hover:text-orange-500 transition-colors leading-snug">
                              {product.name}
                            </h3>
                          </Link>
                          {product.summary && (
                            <p className="text-[11px] text-zinc-500 line-clamp-2 mb-3 leading-relaxed flex-1">
                              {product.summary}
                            </p>
                          )}

                          <div className="flex items-baseline gap-2 mb-1 mt-auto">
                            <span className="text-lg font-bold text-white">{formatCurrency(price)}</span>
                            {comparePrice && (
                              <span className="text-xs text-zinc-600 line-through">{formatCurrency(comparePrice)}</span>
                            )}
                          </div>

                          {price >= 500 && (
                            <p className="text-[10px] text-emerald-400/70 mb-3 flex items-center gap-1">
                              <Truck className="w-3 h-3" />Free shipping
                            </p>
                          )}

                          <div className="flex gap-2 mt-2">
                            <Button
                              size="sm"
                              className={cn(
                                "flex-1 cursor-pointer transition-all",
                                added && "bg-emerald-600 hover:bg-emerald-600"
                              )}
                              disabled={!inStock}
                              onClick={() => handleAddToCart(product)}
                            >
                              {added ? (
                                <><Check className="w-3.5 h-3.5" />Added!</>
                              ) : (
                                <><ShoppingCart className="w-3.5 h-3.5" />{inStock ? "Add to Cart" : "Out of Stock"}</>
                              )}
                            </Button>
                            <button
                              onClick={() => removeItem(product.id)}
                              className="w-9 h-9 rounded-lg border border-zinc-800/60 flex items-center justify-center text-zinc-500 hover:text-red-400 hover:border-red-500/30 transition-all cursor-pointer"
                              aria-label="Remove"
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

              {/* Items saved but not yet loaded */}
              {ids.filter((id) => !products.find((p) => p.id === id)).map((id) => (
                <div key={id} className="rounded-2xl border border-zinc-800/40 bg-zinc-900/20 aspect-[3/4] animate-pulse" />
              ))}
            </div>
          )}

          {/* Suggestions CTA */}
          {ids.length > 0 && !loading && (
            <div className="mt-14 text-center">
              <p className="text-sm text-zinc-500 mb-4">Looking for more inspiration?</p>
              <Button variant="outline" asChild className="border-zinc-800 text-zinc-400 hover:text-white cursor-pointer">
                <Link href="/store">
                  <ShoppingBag className="w-4 h-4" />Continue Browsing
                </Link>
              </Button>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
