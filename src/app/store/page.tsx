"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingBag, Search, Star, ShoppingCart, Eye, Truck, Shield, Tag,
  ChevronDown, X, Grid3X3, LayoutList, ArrowUpDown, Package,
  CheckCircle2, Loader2, ChevronLeft, ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, cn } from "@/lib/utils";
import { useCartStore } from "@/stores";

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

const SORT_OPTIONS: { id: SortOption; label: string }[] = [
  { id: "newest", label: "Newest Arrivals" },
  { id: "popular", label: "Most Popular" },
  { id: "price-asc", label: "Price: Low to High" },
  { id: "price-desc", label: "Price: High to Low" },
  { id: "name", label: "Name (A-Z)" },
];

// ──────────────────────────────────────────
// HERO
// ──────────────────────────────────────────

function StoreHero() {
  return (
    <section className="relative pt-28 pb-10 sm:pt-32 sm:pb-14 md:pt-36 md:pb-16 overflow-hidden">
      <div className="absolute inset-0 bg-zinc-950" />
      <div className="absolute inset-0 bg-grid opacity-20" />
      <div className="absolute inset-0 bg-radial-dark" />

      <div className="container-wide relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-5 sm:mb-6">
            <ShoppingBag className="w-3.5 h-3.5 text-orange-500" />
            <span className="text-[10px] sm:text-xs font-semibold tracking-[0.2em] uppercase text-orange-400">
              Official Store
            </span>
          </div>

          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[0.95] mb-4">
            Shop <span className="text-gradient">TIMN</span>
          </h1>

          <p className="text-sm sm:text-base md:text-lg text-zinc-400 leading-relaxed max-w-xl mb-6 sm:mb-8">
            Purpose-branded resources, apparel, and merchandise that represent
            the values you stand for.
          </p>

          <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-zinc-500">
            {[
              { icon: Truck, text: "Free shipping over GH₵500" },
              { icon: Shield, text: "Secure checkout" },
              { icon: Package, text: "Quality guaranteed" },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-2">
                <item.icon className="w-3.5 h-3.5 text-orange-500/60" />
                <span className="text-[10px] sm:text-xs font-medium">{item.text}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ──────────────────────────────────────────
// PRODUCT CARD
// ──────────────────────────────────────────

function ProductCard({ product, layout }: { product: Product; layout: "grid" | "list" }) {
  const { addItem, openCart } = useCartStore();

  const price = Number(product.price);
  const comparePrice = product.comparePrice ? Number(product.comparePrice) : null;
  const discount = comparePrice ? Math.round(((comparePrice - price) / comparePrice) * 100) : null;
  const inStock = product.isDigital || product.stock > 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price,
      salePrice: comparePrice ? price : undefined,
      image: product.images?.[0] ?? undefined,
    });
    openCart();
  };

  if (layout === "list") {
    return (
      <Link href={`/store/${product.slug}`}>
        <div className="group flex gap-4 sm:gap-6 p-4 rounded-2xl border border-zinc-800/60 bg-zinc-900/40 hover:border-zinc-700/80 hover:bg-zinc-900/60 transition-all duration-300">
          <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-xl bg-zinc-800/40 border border-zinc-800/40 flex items-center justify-center shrink-0 relative overflow-hidden">
            {product.images?.[0] ? (
              <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <ShoppingBag className="w-8 h-8 text-zinc-700" />
            )}
            {product.badge && (
              <div className="absolute top-2 left-2">
                <span className="text-[9px] font-bold uppercase tracking-wider bg-orange-500 text-white px-2 py-0.5 rounded">
                  {product.badge}
                </span>
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
            <div>
              <p className="text-[10px] text-zinc-600 uppercase tracking-wider mb-1">
                {product.category?.name || "Uncategorized"}
              </p>
              <h3 className="text-sm sm:text-base font-bold text-white font-display group-hover:text-orange-500 transition-colors line-clamp-1 mb-1.5">
                {product.name}
              </h3>
              <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed hidden sm:block">
                {product.summary}
              </p>
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
              {inStock ? (
                <Button size="sm" className="hidden sm:inline-flex" onClick={handleAddToCart}>
                  <ShoppingCart className="w-3.5 h-3.5" />
                  Add to Cart
                </Button>
              ) : (
                <Badge variant="destructive" className="text-[10px]">Out of Stock</Badge>
              )}
            </div>
          </div>
        </div>
      </Link>
    );
  }

  // Grid layout
  return (
    <Link href={`/store/${product.slug}`}>
      <div className="group h-full rounded-2xl border border-zinc-800/60 bg-zinc-900/40 overflow-hidden hover:border-zinc-700/80 hover:bg-zinc-900/60 transition-all duration-300 flex flex-col">
        <div className="aspect-square bg-zinc-800/30 relative flex items-center justify-center overflow-hidden">
          {product.images?.[0] ? (
            <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <ShoppingBag className="w-12 h-12 text-zinc-700/60" />
          )}

          {inStock && (
            <div className="absolute inset-0 bg-zinc-950/70 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-2">
              <Button size="sm" variant="white" className="shadow-xl text-xs">
                <Eye className="w-3.5 h-3.5" />
                View
              </Button>
              <Button size="sm" className="shadow-xl text-xs" onClick={handleAddToCart}>
                <ShoppingCart className="w-3.5 h-3.5" />
                Add
              </Button>
            </div>
          )}

          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {product.badge && (
              <span className="text-[9px] font-bold uppercase tracking-wider bg-orange-500 text-white px-2 py-0.5 rounded shadow-lg shadow-orange-500/20">
                {product.badge}
              </span>
            )}
            {!product.badge && new Date(product.createdAt) > new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) && (
              <span className="text-[9px] font-bold uppercase tracking-wider bg-white text-zinc-900 px-2 py-0.5 rounded shadow-lg">
                New
              </span>
            )}
            {discount && (
              <span className="text-[9px] font-bold bg-emerald-500 text-white px-2 py-0.5 rounded shadow-lg">
                -{discount}%
              </span>
            )}
          </div>

          {inStock ? (
            <div className="absolute bottom-3 right-3">
              <span className="text-[9px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full backdrop-blur-sm">
                In Stock
              </span>
            </div>
          ) : (
            <div className="absolute bottom-3 right-3">
              <span className="text-[9px] font-medium text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full backdrop-blur-sm">
                Out of Stock
              </span>
            </div>
          )}
        </div>

        <div className="p-4 sm:p-5 flex flex-col flex-1">
          <p className="text-[10px] text-zinc-600 uppercase tracking-wider mb-1.5">
            {product.category?.name || "Uncategorized"}
          </p>

          <h3 className="text-sm sm:text-base font-bold text-white font-display mb-1.5 line-clamp-2 group-hover:text-orange-500 transition-colors leading-snug">
            {product.name}
          </h3>

          <p className="text-[11px] sm:text-xs text-zinc-500 line-clamp-2 mb-3 leading-relaxed flex-1">
            {product.summary}
          </p>

          {product.variants.length > 0 && (
            <p className="text-[10px] text-zinc-500 mb-3">
              {product.variants.length} variant{product.variants.length > 1 ? "s" : ""} available
            </p>
          )}

          <div className="flex items-baseline gap-2 mt-auto">
            <span className="text-lg font-bold text-white">{formatCurrency(price)}</span>
            {comparePrice && (
              <span className="text-xs text-zinc-600 line-through">{formatCurrency(comparePrice)}</span>
            )}
          </div>

          {price >= 500 && (
            <p className="text-[10px] text-emerald-400/70 mt-1.5 flex items-center gap-1">
              <Truck className="w-3 h-3" />
              Free shipping
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}

// ──────────────────────────────────────────
// PAGE
// ──────────────────────────────────────────

export default function StorePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 0 });
  const [activeCategory, setActiveCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [layout, setLayout] = useState<"grid" | "list">("grid");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const fetchProducts = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "12",
        sort: sortBy,
      });
      if (activeCategory) params.set("category", activeCategory);
      if (searchQuery) params.set("search", searchQuery);

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
  }, [activeCategory, searchQuery, sortBy]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchInput);
  };

  const clearFilters = () => {
    setActiveCategory("");
    setSearchQuery("");
    setSearchInput("");
    setSortBy("newest");
  };

  const hasActiveFilters = activeCategory || searchQuery || sortBy !== "newest";
  const totalProductCount = categories.reduce((sum, c) => sum + c._count.products, 0);

  return (
    <>
      <StoreHero />
      <div className="divider-gradient" />

      <section className="py-8 sm:py-10 md:py-14">
        <div className="container-wide">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* ── SIDEBAR ── */}
            <aside className="hidden lg:block w-60 shrink-0 space-y-6">
              {/* Categories */}
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Categories</h3>
                <nav className="space-y-0.5">
                  <button
                    onClick={() => setActiveCategory("")}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all",
                      !activeCategory
                        ? "bg-orange-500/10 text-orange-500 font-semibold"
                        : "text-zinc-400 hover:text-white hover:bg-zinc-800/40"
                    )}
                  >
                    <span>All Products</span>
                    <span className={cn(
                      "text-[10px] font-medium px-1.5 py-0.5 rounded-full",
                      !activeCategory ? "bg-orange-500/20 text-orange-400" : "bg-zinc-800 text-zinc-500"
                    )}>
                      {totalProductCount}
                    </span>
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.slug)}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all",
                        activeCategory === cat.slug
                          ? "bg-orange-500/10 text-orange-500 font-semibold"
                          : "text-zinc-400 hover:text-white hover:bg-zinc-800/40"
                      )}
                    >
                      <span>{cat.name}</span>
                      <span className={cn(
                        "text-[10px] font-medium px-1.5 py-0.5 rounded-full",
                        activeCategory === cat.slug
                          ? "bg-orange-500/20 text-orange-400"
                          : "bg-zinc-800 text-zinc-500"
                      )}>
                        {cat._count.products}
                      </span>
                    </button>
                  ))}
                </nav>
              </div>

              {/* Promo */}
              <div className="rounded-xl bg-linear-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/20 p-4">
                <Tag className="w-5 h-5 text-orange-500 mb-2" />
                <p className="text-sm font-bold text-white font-display mb-1">Free Shipping</p>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  On all orders over GH₵500. No code needed.
                </p>
              </div>
            </aside>

            {/* ── MAIN CONTENT ── */}
            <div className="flex-1 min-w-0">
              {/* Toolbar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-6">
                <form onSubmit={handleSearch} className="relative w-full sm:max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <Input
                    placeholder="Search products..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="pl-10 h-10 bg-zinc-900/40 border-zinc-800/60 text-sm"
                  />
                  {searchInput && (
                    <button
                      type="button"
                      onClick={() => { setSearchInput(""); setSearchQuery(""); }}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      <X className="w-3.5 h-3.5 text-zinc-500 hover:text-white transition-colors" />
                    </button>
                  )}
                </form>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {/* Mobile filter toggle */}
                  <button
                    onClick={() => setShowMobileFilters(!showMobileFilters)}
                    className="lg:hidden flex items-center gap-2 px-3 py-2 rounded-lg border border-zinc-800/60 text-xs font-medium text-zinc-400 hover:text-white transition-colors"
                  >
                    <Tag className="w-3.5 h-3.5" />
                    Filters
                  </button>

                  {/* Sort dropdown */}
                  <div className="relative ml-auto sm:ml-0">
                    <button
                      onClick={() => setShowSortMenu(!showSortMenu)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg border border-zinc-800/60 text-xs font-medium text-zinc-400 hover:text-white transition-colors"
                    >
                      <ArrowUpDown className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">
                        {SORT_OPTIONS.find((s) => s.id === sortBy)?.label}
                      </span>
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
                            {SORT_OPTIONS.map((option) => (
                              <button
                                key={option.id}
                                onClick={() => { setSortBy(option.id); setShowSortMenu(false); }}
                                className={cn(
                                  "w-full text-left px-4 py-2.5 text-xs font-medium transition-colors",
                                  sortBy === option.id
                                    ? "text-orange-500 bg-orange-500/5"
                                    : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
                                )}
                              >
                                {option.label}
                                {sortBy === option.id && (
                                  <CheckCircle2 className="w-3 h-3 inline ml-2 text-orange-500" />
                                )}
                              </button>
                            ))}
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Layout toggle */}
                  <div className="hidden sm:flex items-center border border-zinc-800/60 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setLayout("grid")}
                      className={cn(
                        "p-2 transition-colors",
                        layout === "grid" ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-white"
                      )}
                    >
                      <Grid3X3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setLayout("list")}
                      className={cn(
                        "p-2 transition-colors",
                        layout === "list" ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-white"
                      )}
                    >
                      <LayoutList className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Mobile filters */}
              <AnimatePresence>
                {showMobileFilters && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="lg:hidden overflow-hidden mb-4"
                  >
                    <div className="flex flex-wrap gap-2 p-4 rounded-xl border border-zinc-800/60 bg-zinc-900/40">
                      <button
                        onClick={() => setActiveCategory("")}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                          !activeCategory
                            ? "bg-orange-500 text-white"
                            : "bg-zinc-800/50 text-zinc-400 border border-zinc-700/40"
                        )}
                      >
                        All ({totalProductCount})
                      </button>
                      {categories.map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => setActiveCategory(cat.slug)}
                          className={cn(
                            "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                            activeCategory === cat.slug
                              ? "bg-orange-500 text-white"
                              : "bg-zinc-800/50 text-zinc-400 border border-zinc-700/40"
                          )}
                        >
                          {cat.name} ({cat._count.products})
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Results header */}
              <div className="flex items-center justify-between mb-5">
                <p className="text-xs text-zinc-500">
                  {loading ? "Loading..." : (
                    <>
                      Showing{" "}
                      <span className="text-zinc-300 font-medium">{products.length}</span>{" "}
                      of <span className="text-zinc-300 font-medium">{pagination.total}</span>{" "}
                      products
                      {activeCategory && (
                        <> in <span className="text-orange-500">{categories.find((c) => c.slug === activeCategory)?.name}</span></>
                      )}
                    </>
                  )}
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-[10px] font-medium text-orange-500 hover:text-orange-400 transition-colors flex items-center gap-1"
                  >
                    <X className="w-3 h-3" />
                    Clear all
                  </button>
                )}
              </div>

              {/* Products */}
              {loading ? (
                <div className="flex items-center justify-center py-24">
                  <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                </div>
              ) : products.length > 0 ? (
                <>
                  <div
                    className={cn(
                      layout === "grid"
                        ? "grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4"
                        : "space-y-3"
                    )}
                  >
                    {products.map((product, index) => (
                      <motion.div
                        key={product.id}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
                      >
                        <ProductCard product={product} layout={layout} />
                      </motion.div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {pagination.totalPages > 1 && (
                    <div className="flex items-center justify-center gap-3 mt-10">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={pagination.page <= 1}
                        onClick={() => fetchProducts(pagination.page - 1)}
                        className="border-zinc-800 text-zinc-400"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Previous
                      </Button>
                      <span className="text-xs text-zinc-500 font-medium">
                        Page {pagination.page} of {pagination.totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={pagination.page >= pagination.totalPages}
                        onClick={() => fetchProducts(pagination.page + 1)}
                        className="border-zinc-800 text-zinc-400"
                      >
                        Next
                        <ChevronRight className="w-4 h-4" />
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
                    {searchQuery
                      ? "Try adjusting your search term."
                      : "Check back soon for new arrivals."}
                  </p>
                  {hasActiveFilters && (
                    <Button variant="outline" onClick={clearFilters}>
                      <X className="w-3.5 h-3.5" />
                      Clear Filters
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
