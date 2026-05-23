"use client";

/* eslint-disable @next/next/no-img-element */

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingBag, Search, ShoppingCart, Eye, Shield, Tag,
  ChevronDown, X, Grid3X3, LayoutList, ArrowUpDown, Package,
  CheckCircle2, Loader2, ChevronLeft, ChevronRight, Heart,
  Star, RotateCcw, Filter, Clock, Minus, Plus,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, cn } from "@/lib/utils";
import { useCartStore, useWishlistStore, useRecentlyViewedStore } from "@/stores";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Product {
  id: string;
  name: string;
  slug: string;
  summary: string | null;
  price: number;
  comparePrice: number | null;
  images: string[];
  stock: number;
  badge: string | null;
  tags: string[];
  isFeatured: boolean;
  isDigital: boolean;
  salesCount: number;
  createdAt: string;
  category: { name: string; slug: string } | null;
  variants: { id: string; name: string; value: string; price: number | null; stock: number }[];
}

interface Category {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  _count: { products: number };
}

type SortOption = "newest" | "price-asc" | "price-desc" | "popular" | "name";
type PriceRange = "all" | "under100" | "100-500" | "500-1000" | "over1000";
type ProductType = "all" | "physical" | "digital";

// ─── Constants ────────────────────────────────────────────────────────────────

const NEW_CUTOFF = Date.now() - 14 * 24 * 60 * 60 * 1000;

const SORT_OPTIONS: { id: SortOption; label: string }[] = [
  { id: "newest", label: "Newest Arrivals" },
  { id: "popular", label: "Most Popular" },
  { id: "price-asc", label: "Price: Low to High" },
  { id: "price-desc", label: "Price: High to Low" },
  { id: "name", label: "Name (A-Z)" },
];

const PRICE_RANGES: { id: PriceRange; label: string; min?: number; max?: number }[] = [
  { id: "all", label: "All Prices" },
  { id: "under100", label: "Under GH₵100", max: 100 },
  { id: "100-500", label: "GH₵100 – 500", min: 100, max: 500 },
  { id: "500-1000", label: "GH₵500 – 1,000", min: 500, max: 1000 },
  { id: "over1000", label: "Over GH₵1,000", min: 1000 },
];

const CAT_GRADIENTS = [
  "from-orange-500/15 to-orange-600/5",
  "from-blue-500/15 to-blue-600/5",
  "from-emerald-500/15 to-emerald-600/5",
  "from-purple-500/15 to-purple-600/5",
  "from-amber-500/15 to-amber-600/5",
  "from-rose-500/15 to-rose-600/5",
];

// ─── Store Hero ───────────────────────────────────────────────────────────────

function StoreHero({ totalProducts }: { totalProducts: number }) {
  return (
    <section className="relative pt-28 pb-10 sm:pt-32 sm:pb-14 overflow-hidden">
      <div className="absolute inset-0 bg-zinc-950" />
      <div className="absolute inset-0 bg-grid opacity-20" />
      <div className="absolute inset-0 bg-radial-dark" />
      <div className="container-wide relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-5">
            <ShoppingBag className="w-3.5 h-3.5 text-orange-500" />
            <span className="text-[10px] sm:text-xs font-semibold tracking-[0.2em] uppercase text-orange-400">
              Official Store
            </span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[0.95] mb-4">
            Shop <span className="text-gradient">TIMN</span>
          </h1>
          <p className="text-sm sm:text-base text-zinc-400 leading-relaxed max-w-xl mb-7">
            Purpose-branded resources, apparel, and merchandise that represent the values you stand for.
          </p>
          <div className="flex flex-wrap items-center gap-5 sm:gap-8">
            {[
              { icon: Package, value: `${totalProducts || "50"}+`, label: "Products" },
              { icon: Shield, value: "100%", label: "Secure Checkout" },
              { icon: RotateCcw, value: "30-Day", label: "Returns Policy" },
            ].map((stat) => (
              <div key={stat.label} className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                  <stat.icon className="w-4 h-4 text-orange-500" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white leading-none">{stat.value}</div>
                  <div className="text-[10px] text-zinc-500 mt-0.5">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Featured Categories ──────────────────────────────────────────────────────

function FeaturedCategories({
  categories,
  onSelect,
}: {
  categories: Category[];
  onSelect: (slug: string) => void;
}) {
  if (categories.length === 0) return null;
  return (
    <section className="py-8 sm:py-10 border-b border-zinc-800/50">
      <div className="container-wide">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base sm:text-lg font-bold font-display text-white">Shop by Category</h2>
          <span className="text-xs text-zinc-500">{categories.length} categories</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2.5 sm:gap-3">
          {categories.map((cat, i) => (
            <motion.button
              key={cat.id}
              onClick={() => onSelect(cat.slug)}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              className={cn(
                "relative rounded-xl p-4 border border-zinc-800/60 bg-gradient-to-br text-left transition-all group cursor-pointer hover:border-orange-500/40",
                CAT_GRADIENTS[i % CAT_GRADIENTS.length]
              )}
            >
              {cat.image ? (
                <div className="w-10 h-10 rounded-lg overflow-hidden mb-3 relative">
                  <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center mb-3">
                  <ShoppingBag className="w-4 h-4 text-zinc-400" />
                </div>
              )}
              <h3 className="text-xs sm:text-sm font-bold text-white group-hover:text-orange-500 transition-colors leading-tight">
                {cat.name}
              </h3>
              <p className="text-[10px] text-zinc-500 mt-0.5">{cat._count.products} items</p>
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Wishlist Button ──────────────────────────────────────────────────────────

function WishlistBtn({ productId, className }: { productId: string; className?: string }) {
  const { toggleItem, isWishlisted } = useWishlistStore();
  const wishlisted = isWishlisted(productId);
  return (
    <button
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleItem(productId); }}
      className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer",
        wishlisted
          ? "bg-red-500 text-white shadow-lg shadow-red-500/30"
          : "bg-zinc-900/80 border border-zinc-700/40 text-zinc-400 hover:text-red-400 hover:border-red-500/30 backdrop-blur-sm"
      , className)}
      aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
    >
      <Heart className={cn("w-3.5 h-3.5", wishlisted && "fill-current")} />
    </button>
  );
}

// ─── Star Rating ──────────────────────────────────────────────────────────────

function StarRating({ salesCount }: { salesCount: number }) {
  if (salesCount === 0) return null;
  const rating = Math.min(5, 3.5 + (salesCount % 15) * 0.1);
  const full = Math.floor(rating);
  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            className={cn("w-3 h-3", s <= full ? "text-amber-400 fill-amber-400" : "text-zinc-700")}
          />
        ))}
      </div>
      <span className="text-[10px] text-zinc-500">({salesCount})</span>
    </div>
  );
}

// ─── Quick View Modal ─────────────────────────────────────────────────────────

function QuickViewModal({ product, onClose }: { product: Product; onClose: () => void }) {
  const { addItem, openCart } = useCartStore();
  const [qty, setQty] = useState(1);
  const [variant, setVariant] = useState(product.variants[0] ?? null);

  const price = Number(variant?.price ?? product.price);
  const comparePrice = product.comparePrice ? Number(product.comparePrice) : null;
  const discount = comparePrice ? Math.round(((comparePrice - price) / comparePrice) * 100) : null;
  const inStock = product.isDigital || product.stock > 0;

  const handleAdd = () => {
    addItem(
      {
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: comparePrice ?? price,
        salePrice: comparePrice ? price : undefined,
        image: product.images[0],
        variant: variant?.value,
      },
      qty
    );
    openCart();
    onClose();
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 max-w-2xl mx-auto bg-zinc-900 border border-zinc-700/60 rounded-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col sm:flex-row">
          {/* Image */}
          <div className="aspect-square sm:w-64 sm:h-auto bg-zinc-800/50 relative shrink-0">
            {product.images[0] ? (
              <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ShoppingBag className="w-14 h-14 text-zinc-700" />
              </div>
            )}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center cursor-pointer hover:bg-black/70 transition-colors"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* Details */}
          <div className="flex-1 p-5 sm:p-6 flex flex-col">
            {product.category && (
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">{product.category.name}</p>
            )}
            <h2 className="text-lg font-bold text-white font-display leading-snug mb-1">{product.name}</h2>
            {product.salesCount > 0 && (
              <div className="mb-3">
                <StarRating salesCount={product.salesCount} />
              </div>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-2.5 mb-4">
              <span className="text-2xl font-bold text-white">{formatCurrency(price)}</span>
              {comparePrice && (
                <>
                  <span className="text-sm text-zinc-600 line-through">{formatCurrency(comparePrice)}</span>
                  <span className="text-xs font-bold text-emerald-400">-{discount}%</span>
                </>
              )}
            </div>

            {product.summary && (
              <p className="text-xs text-zinc-400 leading-relaxed mb-4 line-clamp-3">{product.summary}</p>
            )}

            {/* Variants */}
            {product.variants.length > 0 && (
              <div className="mb-4">
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">Options</p>
                <div className="flex flex-wrap gap-1.5">
                  {product.variants.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setVariant(v)}
                      disabled={v.stock <= 0}
                      className={cn(
                        "px-3 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer",
                        variant?.id === v.id
                          ? "border-orange-500/50 bg-orange-500/10 text-orange-400"
                          : v.stock <= 0
                          ? "border-zinc-800/40 text-zinc-600 cursor-not-allowed line-through"
                          : "border-zinc-700/40 text-zinc-300 hover:border-zinc-600"
                      )}
                    >
                      {v.value}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity + Add */}
            <div className="flex items-center gap-3 mt-auto">
              <div className="flex items-center border border-zinc-700/50 rounded-lg overflow-hidden shrink-0">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-9 h-9 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer">
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-10 text-center text-sm text-white font-bold border-x border-zinc-800/50">{qty}</span>
                <button onClick={() => setQty(qty + 1)} className="w-9 h-9 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer">
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              <Button className="flex-1 cursor-pointer" onClick={handleAdd} disabled={!inStock}>
                <ShoppingCart className="w-4 h-4" />
                {inStock ? "Add to Cart" : "Out of Stock"}
              </Button>
            </div>

            <Link
              href={`/store/${product.slug}`}
              className="text-xs text-center text-orange-500 hover:text-orange-400 transition-colors mt-3 block cursor-pointer"
              onClick={onClose}
            >
              View full details →
            </Link>
          </div>
        </div>
      </motion.div>
    </>
  );
}

// ─── Product Card ─────────────────────────────────────────────────────────────

function ProductCard({
  product,
  layout,
  onQuickView,
}: {
  product: Product;
  layout: "grid" | "list";
  onQuickView: (p: Product) => void;
}) {
  const { addItem, openCart } = useCartStore();
  const price = Number(product.price);
  const comparePrice = product.comparePrice ? Number(product.comparePrice) : null;
  const discount = comparePrice ? Math.round(((comparePrice - price) / comparePrice) * 100) : null;
  const inStock = product.isDigital || product.stock > 0;
  const isNew = !product.badge && new Date(product.createdAt).getTime() > NEW_CUTOFF;

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({ id: product.id, name: product.name, slug: product.slug, price, salePrice: comparePrice ? price : undefined, image: product.images[0] });
    openCart();
  };

  if (layout === "list") {
    return (
      <Link href={`/store/${product.slug}`} className="block cursor-pointer">
        <div className="group flex gap-4 sm:gap-5 p-4 rounded-2xl border border-zinc-800/60 bg-zinc-900/40 hover:border-zinc-700/80 hover:bg-zinc-900/60 transition-all duration-300">
          <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl bg-zinc-800/40 border border-zinc-800/40 flex items-center justify-center shrink-0 relative overflow-hidden">
            {product.images[0] ? (
              <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            ) : (
              <ShoppingBag className="w-8 h-8 text-zinc-700" />
            )}
            {product.badge && (
              <span className="absolute top-1.5 left-1.5 text-[9px] font-bold uppercase tracking-wider bg-orange-500 text-white px-1.5 py-0.5 rounded">
                {product.badge}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
            <div>
              <p className="text-[10px] text-zinc-600 uppercase tracking-wider mb-1">{product.category?.name || "Uncategorized"}</p>
              <h3 className="text-sm sm:text-base font-bold text-white font-display group-hover:text-orange-500 transition-colors line-clamp-1 mb-1">
                {product.name}
              </h3>
              {product.salesCount > 0 && <StarRating salesCount={product.salesCount} />}
              <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed mt-1.5 hidden sm:block">{product.summary}</p>
            </div>
            <div className="flex items-end justify-between mt-3">
              <div className="flex items-baseline gap-2">
                <span className="text-lg sm:text-xl font-bold text-white">{formatCurrency(price)}</span>
                {comparePrice && (
                  <>
                    <span className="text-xs text-zinc-600 line-through">{formatCurrency(comparePrice)}</span>
                    <span className="text-[10px] font-bold text-emerald-400">-{discount}%</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2">
                <WishlistBtn productId={product.id} />
                {inStock ? (
                  <Button size="sm" className="hidden sm:inline-flex cursor-pointer" onClick={handleAdd}>
                    <ShoppingCart className="w-3.5 h-3.5" />Add to Cart
                  </Button>
                ) : (
                  <Badge variant="destructive" className="text-[10px]">Out of Stock</Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/store/${product.slug}`} className="block cursor-pointer">
      <div className="group h-full rounded-2xl border border-zinc-800/60 bg-zinc-900/40 overflow-hidden hover:border-zinc-700/80 hover:bg-zinc-900/60 transition-all duration-300 flex flex-col">
        {/* Image */}
        <div className="aspect-square bg-zinc-800/30 relative flex items-center justify-center overflow-hidden">
          {product.images[0] ? (
            <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <ShoppingBag className="w-12 h-12 text-zinc-700/60" />
          )}

          {/* Hover overlay */}
          {inStock && (
            <div className="absolute inset-0 bg-zinc-950/70 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-2">
              <Button
                size="sm"
                variant="white"
                className="shadow-xl text-xs cursor-pointer"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onQuickView(product); }}
              >
                <Eye className="w-3.5 h-3.5" />Quick View
              </Button>
              <Button size="sm" className="shadow-xl text-xs cursor-pointer" onClick={handleAdd}>
                <ShoppingCart className="w-3.5 h-3.5" />Add
              </Button>
            </div>
          )}

          {/* Wishlist */}
          <WishlistBtn productId={product.id} className="absolute top-3 right-3" />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {product.badge && (
              <span className="text-[9px] font-bold uppercase tracking-wider bg-orange-500 text-white px-2 py-0.5 rounded shadow-lg shadow-orange-500/20">
                {product.badge}
              </span>
            )}
            {isNew && (
              <span className="text-[9px] font-bold uppercase tracking-wider bg-white text-zinc-900 px-2 py-0.5 rounded shadow-lg">
                New
              </span>
            )}
            {discount && discount > 0 && (
              <span className="text-[9px] font-bold bg-emerald-500 text-white px-2 py-0.5 rounded shadow-lg">
                -{discount}%
              </span>
            )}
          </div>

          {/* Stock pill */}
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

        {/* Body */}
        <div className="p-4 sm:p-5 flex flex-col flex-1">
          <p className="text-[10px] text-zinc-600 uppercase tracking-wider mb-1.5">{product.category?.name || "Uncategorized"}</p>
          <h3 className="text-sm sm:text-base font-bold text-white font-display mb-1.5 line-clamp-2 group-hover:text-orange-500 transition-colors leading-snug">
            {product.name}
          </h3>
          {product.salesCount > 0 && (
            <div className="mb-2">
              <StarRating salesCount={product.salesCount} />
            </div>
          )}
          <p className="text-[11px] text-zinc-500 line-clamp-2 mb-3 leading-relaxed flex-1">{product.summary}</p>
          {product.variants.length > 0 && (
            <p className="text-[10px] text-zinc-600 mb-2">
              {product.variants.length} variant{product.variants.length > 1 ? "s" : ""} available
            </p>
          )}
          <div className="flex items-baseline gap-2 mt-auto">
            <span className="text-lg font-bold text-white">{formatCurrency(price)}</span>
            {comparePrice && <span className="text-xs text-zinc-600 line-through">{formatCurrency(comparePrice)}</span>}
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── Recently Viewed Bar ──────────────────────────────────────────────────────

function RecentlyViewedBar() {
  const { items } = useRecentlyViewedStore();
  if (items.length === 0) return null;
  return (
    <div className="py-8 sm:py-10 border-t border-zinc-800/50">
      <div className="container-wide">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-4 h-4 text-zinc-500" />
          <h3 className="text-sm font-bold text-white">Recently Viewed</h3>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {items.map((item) => (
            <Link key={item.id} href={`/store/${item.slug}`} className="shrink-0 w-28 group cursor-pointer">
              <div className="aspect-square rounded-xl bg-zinc-800/40 border border-zinc-800/40 overflow-hidden relative mb-2 group-hover:border-orange-500/30 transition-colors">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ShoppingBag className="w-6 h-6 text-zinc-700" />
                  </div>
                )}
              </div>
              <p className="text-[11px] font-medium text-zinc-400 group-hover:text-white transition-colors line-clamp-2 leading-tight">{item.name}</p>
              <p className="text-[11px] font-bold text-white mt-0.5">{formatCurrency(item.price)}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StorePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 0 });

  const [activeCategory, setActiveCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [priceRange, setPriceRange] = useState<PriceRange>("all");
  const [productType, setProductType] = useState<ProductType>("all");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [activeTag, setActiveTag] = useState("");

  const [layout, setLayout] = useState<"grid" | "list">("grid");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  const allTags = useMemo(() => {
    const s = new Set<string>();
    products.forEach((p) => p.tags.forEach((t) => s.add(t)));
    return Array.from(s).slice(0, 14);
  }, [products]);

  const priceConfig = PRICE_RANGES.find((p) => p.id === priceRange);

  const fetchProducts = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ page: String(page), limit: "12", sort: sortBy });
        if (activeCategory) params.set("category", activeCategory);
        if (searchQuery) params.set("search", searchQuery);
        if (priceConfig?.min != null) params.set("minPrice", String(priceConfig.min));
        if (priceConfig?.max != null) params.set("maxPrice", String(priceConfig.max));
        if (productType !== "all") params.set("type", productType);
        if (inStockOnly) params.set("inStock", "true");
        if (activeTag) params.set("tag", activeTag);

        const res = await fetch(`/api/store?${params}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        setProducts(data.products);
        setCategories(data.categories);
        setPagination(data.pagination);
      } catch {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    },
    [activeCategory, searchQuery, sortBy, priceConfig, productType, inStockOnly, activeTag]
  );

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setSearchQuery(searchInput); };

  const clearFilters = () => {
    setActiveCategory("");
    setSearchQuery("");
    setSearchInput("");
    setSortBy("newest");
    setPriceRange("all");
    setProductType("all");
    setInStockOnly(false);
    setActiveTag("");
  };

  const hasActiveFilters = !!(activeCategory || searchQuery || sortBy !== "newest" || priceRange !== "all" || productType !== "all" || inStockOnly || activeTag);
  const activeFiltersCount = [activeCategory, searchQuery, priceRange !== "all", productType !== "all", inStockOnly, activeTag].filter(Boolean).length;
  const totalProductCount = categories.reduce((sum, c) => sum + c._count.products, 0);

  return (
    <>
      <StoreHero totalProducts={totalProductCount} />

      {/* Featured categories — only shown when browsing all */}
      {!activeCategory && !searchQuery && (
        <FeaturedCategories categories={categories} onSelect={setActiveCategory} />
      )}

      <div className="divider-gradient" />

      <section className="py-8 sm:py-10 md:py-14">
        <div className="container-wide">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* ── Sidebar ── */}
            <aside className="hidden lg:block w-60 shrink-0 space-y-6">
              {/* Categories */}
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Categories</h3>
                <nav className="space-y-0.5">
                  <button
                    onClick={() => setActiveCategory("")}
                    className={cn("w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all cursor-pointer",
                      !activeCategory ? "bg-orange-500/10 text-orange-500 font-semibold" : "text-zinc-400 hover:text-white hover:bg-zinc-800/40")}
                  >
                    <span>All Products</span>
                    <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded-full", !activeCategory ? "bg-orange-500/20 text-orange-400" : "bg-zinc-800 text-zinc-500")}>
                      {totalProductCount}
                    </span>
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.slug)}
                      className={cn("w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all cursor-pointer",
                        activeCategory === cat.slug ? "bg-orange-500/10 text-orange-500 font-semibold" : "text-zinc-400 hover:text-white hover:bg-zinc-800/40")}
                    >
                      <span>{cat.name}</span>
                      <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded-full",
                        activeCategory === cat.slug ? "bg-orange-500/20 text-orange-400" : "bg-zinc-800 text-zinc-500")}>
                        {cat._count.products}
                      </span>
                    </button>
                  ))}
                </nav>
              </div>

              {/* Price Range */}
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Price Range</h3>
                <div className="space-y-0.5">
                  {PRICE_RANGES.map((range) => (
                    <button
                      key={range.id}
                      onClick={() => setPriceRange(range.id)}
                      className={cn("w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all cursor-pointer flex items-center gap-2.5",
                        priceRange === range.id ? "bg-orange-500/10 text-orange-500 font-semibold" : "text-zinc-400 hover:text-white hover:bg-zinc-800/40")}
                    >
                      <span className={cn("w-2 h-2 rounded-full shrink-0 transition-colors", priceRange === range.id ? "bg-orange-500" : "bg-zinc-700")} />
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Product Type */}
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Product Type</h3>
                <div className="flex rounded-lg overflow-hidden border border-zinc-800/60">
                  {(["all", "physical", "digital"] as ProductType[]).map((type) => (
                    <button
                      key={type}
                      onClick={() => setProductType(type)}
                      className={cn("flex-1 py-2 text-[11px] font-medium transition-all capitalize cursor-pointer",
                        productType === type ? "bg-orange-500 text-white" : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/40")}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* In Stock Toggle */}
              <div>
                <button
                  onClick={() => setInStockOnly(!inStockOnly)}
                  className="flex items-center justify-between w-full cursor-pointer group"
                  aria-pressed={inStockOnly}
                >
                  <span className="text-xs font-bold text-white uppercase tracking-wider group-hover:text-orange-500 transition-colors">
                    In Stock Only
                  </span>
                  <div className={cn("w-10 h-5 rounded-full transition-all duration-300 relative border",
                    inStockOnly ? "bg-orange-500 border-orange-600" : "bg-zinc-800 border-zinc-700")}>
                    <div className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-300",
                      inStockOnly ? "left-5" : "left-0.5")} />
                  </div>
                </button>
              </div>

              {/* Tags */}
              {allTags.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Popular Tags</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {allTags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => setActiveTag(activeTag === tag ? "" : tag)}
                        className={cn("px-2.5 py-1 rounded-full text-[10px] font-medium transition-all capitalize cursor-pointer",
                          activeTag === tag
                            ? "bg-orange-500/20 text-orange-400 border border-orange-500/40"
                            : "bg-zinc-800/50 text-zinc-400 border border-zinc-700/30 hover:border-zinc-600 hover:text-white")}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}


              {/* Wishlist link */}
              <Link
                href="/store/wishlist"
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-zinc-800/60 text-sm text-zinc-400 hover:text-white hover:border-orange-500/30 transition-all cursor-pointer group"
              >
                <Heart className="w-4 h-4 text-red-500/70 group-hover:text-red-400 transition-colors" />
                <span>My Wishlist</span>
              </Link>
            </aside>

            {/* ── Main Content ── */}
            <div className="flex-1 min-w-0">
              {/* Toolbar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
                <form onSubmit={handleSearch} className="relative w-full sm:max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <Input
                    placeholder="Search products..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="pl-10 h-10 bg-zinc-900/40 border-zinc-800/60 text-sm"
                  />
                  {searchInput && (
                    <button type="button" onClick={() => { setSearchInput(""); setSearchQuery(""); }} className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer">
                      <X className="w-3.5 h-3.5 text-zinc-500 hover:text-white transition-colors" />
                    </button>
                  )}
                </form>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => setShowMobileFilters(!showMobileFilters)}
                    className="lg:hidden flex items-center gap-2 px-3 py-2 rounded-lg border border-zinc-800/60 text-xs font-medium text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <Filter className="w-3.5 h-3.5" />
                    Filters
                    {activeFiltersCount > 0 && (
                      <span className="w-4 h-4 rounded-full bg-orange-500 text-white text-[9px] flex items-center justify-center font-bold">
                        {activeFiltersCount}
                      </span>
                    )}
                  </button>

                  {/* Sort */}
                  <div className="relative ml-auto sm:ml-0">
                    <button
                      onClick={() => setShowSortMenu(!showSortMenu)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg border border-zinc-800/60 text-xs font-medium text-zinc-400 hover:text-white transition-colors cursor-pointer"
                    >
                      <ArrowUpDown className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{SORT_OPTIONS.find((s) => s.id === sortBy)?.label}</span>
                      <span className="sm:hidden">Sort</span>
                      <ChevronDown className="w-3 h-3" />
                    </button>
                    <AnimatePresence>
                      {showSortMenu && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setShowSortMenu(false)} />
                          <motion.div
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            className="absolute right-0 top-full mt-1 z-50 w-52 rounded-xl border border-zinc-800/80 bg-zinc-900 shadow-2xl shadow-black/40 overflow-hidden"
                          >
                            {SORT_OPTIONS.map((opt) => (
                              <button
                                key={opt.id}
                                onClick={() => { setSortBy(opt.id); setShowSortMenu(false); }}
                                className={cn("w-full text-left px-4 py-2.5 text-xs font-medium transition-colors cursor-pointer flex items-center justify-between",
                                  sortBy === opt.id ? "text-orange-500 bg-orange-500/5" : "text-zinc-400 hover:text-white hover:bg-zinc-800/50")}
                              >
                                {opt.label}
                                {sortBy === opt.id && <CheckCircle2 className="w-3 h-3 text-orange-500" />}
                              </button>
                            ))}
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Layout toggle */}
                  <div className="hidden sm:flex items-center border border-zinc-800/60 rounded-lg overflow-hidden">
                    <button onClick={() => setLayout("grid")} className={cn("p-2 transition-colors cursor-pointer", layout === "grid" ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-white")}>
                      <Grid3X3 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setLayout("list")} className={cn("p-2 transition-colors cursor-pointer", layout === "list" ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-white")}>
                      <LayoutList className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Mobile filter panel */}
              <AnimatePresence>
                {showMobileFilters && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="lg:hidden overflow-hidden mb-4"
                  >
                    <div className="p-4 rounded-xl border border-zinc-800/60 bg-zinc-900/40 space-y-4">
                      <div>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Category</p>
                        <div className="flex flex-wrap gap-1.5">
                          <button onClick={() => setActiveCategory("")} className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer", !activeCategory ? "bg-orange-500 text-white" : "bg-zinc-800/50 text-zinc-400 border border-zinc-700/40")}>
                            All ({totalProductCount})
                          </button>
                          {categories.map((cat) => (
                            <button key={cat.id} onClick={() => setActiveCategory(cat.slug)} className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer", activeCategory === cat.slug ? "bg-orange-500 text-white" : "bg-zinc-800/50 text-zinc-400 border border-zinc-700/40")}>
                              {cat.name}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Price</p>
                        <div className="flex flex-wrap gap-1.5">
                          {PRICE_RANGES.map((r) => (
                            <button key={r.id} onClick={() => setPriceRange(r.id)} className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer", priceRange === r.id ? "bg-orange-500 text-white" : "bg-zinc-800/50 text-zinc-400 border border-zinc-700/40")}>
                              {r.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-3 items-center">
                        <div className="flex rounded-lg overflow-hidden border border-zinc-800/60">
                          {(["all", "physical", "digital"] as ProductType[]).map((t) => (
                            <button key={t} onClick={() => setProductType(t)} className={cn("px-3 py-2 text-[11px] font-medium transition-all capitalize cursor-pointer", productType === t ? "bg-orange-500 text-white" : "text-zinc-500 hover:bg-zinc-800/40")}>
                              {t}
                            </button>
                          ))}
                        </div>
                        <button
                          onClick={() => setInStockOnly(!inStockOnly)}
                          className={cn("px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer border", inStockOnly ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" : "bg-zinc-800/50 text-zinc-400 border-zinc-700/40")}
                        >
                          In Stock Only
                        </button>
                      </div>
                      {allTags.length > 0 && (
                        <div>
                          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Tags</p>
                          <div className="flex flex-wrap gap-1.5">
                            {allTags.map((tag) => (
                              <button key={tag} onClick={() => setActiveTag(activeTag === tag ? "" : tag)} className={cn("px-2.5 py-1 rounded-full text-[10px] font-medium transition-all capitalize cursor-pointer", activeTag === tag ? "bg-orange-500/20 text-orange-400 border border-orange-500/40" : "bg-zinc-800/50 text-zinc-400 border border-zinc-700/30")}>
                                {tag}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Active filter chips */}
              {hasActiveFilters && (
                <div className="flex flex-wrap items-center gap-2 mb-5">
                  {activeCategory && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 text-xs font-medium">
                      {categories.find((c) => c.slug === activeCategory)?.name}
                      <button onClick={() => setActiveCategory("")} className="cursor-pointer hover:text-white transition-colors"><X className="w-3 h-3" /></button>
                    </span>
                  )}
                  {searchQuery && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-zinc-800/50 text-zinc-300 border border-zinc-700/40 text-xs font-medium">
                      &ldquo;{searchQuery}&rdquo;
                      <button onClick={() => { setSearchQuery(""); setSearchInput(""); }} className="cursor-pointer hover:text-white transition-colors"><X className="w-3 h-3" /></button>
                    </span>
                  )}
                  {priceRange !== "all" && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-zinc-800/50 text-zinc-300 border border-zinc-700/40 text-xs font-medium">
                      {PRICE_RANGES.find((p) => p.id === priceRange)?.label}
                      <button onClick={() => setPriceRange("all")} className="cursor-pointer hover:text-white transition-colors"><X className="w-3 h-3" /></button>
                    </span>
                  )}
                  {productType !== "all" && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-zinc-800/50 text-zinc-300 border border-zinc-700/40 text-xs font-medium capitalize">
                      {productType}
                      <button onClick={() => setProductType("all")} className="cursor-pointer hover:text-white transition-colors"><X className="w-3 h-3" /></button>
                    </span>
                  )}
                  {inStockOnly && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-medium">
                      In Stock
                      <button onClick={() => setInStockOnly(false)} className="cursor-pointer hover:text-white transition-colors"><X className="w-3 h-3" /></button>
                    </span>
                  )}
                  {activeTag && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-zinc-800/50 text-zinc-300 border border-zinc-700/40 text-xs font-medium capitalize">
                      #{activeTag}
                      <button onClick={() => setActiveTag("")} className="cursor-pointer hover:text-white transition-colors"><X className="w-3 h-3" /></button>
                    </span>
                  )}
                  <button onClick={clearFilters} className="text-[10px] font-medium text-red-400 hover:text-red-300 transition-colors cursor-pointer flex items-center gap-1">
                    <X className="w-3 h-3" />Clear all
                  </button>
                </div>
              )}

              {/* Results count */}
              <div className="flex items-center justify-between mb-5">
                <p className="text-xs text-zinc-500">
                  {loading ? "Loading..." : (
                    <>
                      Showing{" "}
                      <span className="text-zinc-300 font-medium">{products.length}</span> of{" "}
                      <span className="text-zinc-300 font-medium">{pagination.total}</span> products
                    </>
                  )}
                </p>
                <Link href="/store/wishlist" className="lg:hidden flex items-center gap-1.5 text-xs text-zinc-500 hover:text-red-400 transition-colors cursor-pointer">
                  <Heart className="w-3.5 h-3.5" />
                  Wishlist
                </Link>
              </div>

              {/* Product grid / list */}
              {loading ? (
                <div className="flex items-center justify-center py-24">
                  <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                </div>
              ) : products.length > 0 ? (
                <>
                  <div className={cn(layout === "grid" ? "grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4" : "space-y-3")}>
                    {products.map((product, i) => (
                      <motion.div
                        key={product.id}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                      >
                        <ProductCard product={product} layout={layout} onQuickView={setQuickViewProduct} />
                      </motion.div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {pagination.totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-10">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={pagination.page <= 1}
                        onClick={() => fetchProducts(pagination.page - 1)}
                        className="border-zinc-800 text-zinc-400"
                      >
                        <ChevronLeft className="w-4 h-4" />Previous
                      </Button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                          const pg = pagination.page <= 3 ? i + 1 :
                            pagination.page >= pagination.totalPages - 2 ? pagination.totalPages - 4 + i :
                            pagination.page - 2 + i;
                          if (pg < 1 || pg > pagination.totalPages) return null;
                          return (
                            <button
                              key={pg}
                              onClick={() => fetchProducts(pg)}
                              className={cn("w-8 h-8 rounded-lg text-xs font-medium transition-colors cursor-pointer",
                                pg === pagination.page ? "bg-orange-500 text-white" : "text-zinc-400 hover:bg-zinc-800 hover:text-white")}
                            >
                              {pg}
                            </button>
                          );
                        })}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={pagination.page >= pagination.totalPages}
                        onClick={() => fetchProducts(pagination.page + 1)}
                        className="border-zinc-800 text-zinc-400"
                      >
                        Next<ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-24">
                  <div className="w-16 h-16 rounded-2xl bg-zinc-800/40 border border-zinc-800/60 flex items-center justify-center mx-auto mb-5">
                    <Search className="w-7 h-7 text-zinc-700" />
                  </div>
                  <p className="text-white font-display font-bold text-lg mb-1">No products found</p>
                  <p className="text-sm text-zinc-500 mb-6">
                    {searchQuery ? "Try adjusting your search term or filters." : "Check back soon for new arrivals."}
                  </p>
                  {hasActiveFilters && (
                    <Button variant="outline" onClick={clearFilters}>
                      <X className="w-3.5 h-3.5" />Clear Filters
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Recently Viewed */}
      <RecentlyViewedBar />

      {/* Quick View Modal */}
      <AnimatePresence>
        {quickViewProduct && (
          <QuickViewModal product={quickViewProduct} onClose={() => setQuickViewProduct(null)} />
        )}
      </AnimatePresence>
    </>
  );
}
