"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingBag,
  Star,
  Minus,
  Plus,
  ShoppingCart,
  ArrowLeft,
  Truck,
  Shield,
  RotateCcw,
  CheckCircle2,
  Package,
  ChevronRight,
  Share2,
  Zap,
  Eye,
  Heart,
  Copy,
  Check,
  Loader2,
  AlertTriangle,
  Tag,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, cn } from "@/lib/utils";
import { useCartStore } from "@/stores";

/* ─── Types ─── */
interface ProductVariant {
  id: string;
  name: string;
  value: string;
  price: number | null;
  stock: number;
  sku: string | null;
}

interface ProductDetail {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  summary: string | null;
  price: number;
  comparePrice: number | null;
  images: string[];
  stock: number;
  sku: string | null;
  weight: number | null;
  badge: string | null;
  tags: string[];
  isFeatured: boolean;
  isDigital: boolean;
  viewCount: number;
  salesCount: number;
  metaTitle: string | null;
  metaDescription: string | null;
  category: { name: string; slug: string } | null;
  variants: ProductVariant[];
}

interface RelatedProduct {
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
}

/* ─── Constants ─── */
const SHIPPING_INFO = [
  { icon: Truck, title: "Free Shipping", desc: "On orders over GH₵500" },
  { icon: Shield, title: "Secure Payment", desc: "256-bit SSL encrypted" },
  { icon: RotateCcw, title: "30-Day Returns", desc: "Hassle-free returns" },
  { icon: Package, title: "Quality Guaranteed", desc: "Premium materials" },
];

/* ╔══════════════════════════════════════════╗
   ║         PRODUCT DETAIL PAGE             ║
   ╚══════════════════════════════════════════╝ */

export default function ProductPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [related, setRelated] = useState<RelatedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [selectedThumb, setSelectedThumb] = useState(0);
  const [activeTab, setActiveTab] = useState<"description" | "details">("description");
  const [copied, setCopied] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

  const { addItem, openCart } = useCartStore();

  /* ─── Fetch product ─── */
  const fetchProduct = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/store/${slug}`);
      if (!res.ok) {
        if (res.status === 404) {
          setError("Product not found");
        } else {
          setError("Failed to load product");
        }
        return;
      }
      const data = await res.json();
      setProduct(data.product);
      setRelated(data.related || []);

      // Auto-select first variant
      if (data.product.variants?.length > 0) {
        setSelectedVariant(data.product.variants[0]);
      }
    } catch {
      setError("Failed to load product");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  /* ─── Derived values ─── */
  const effectivePrice = selectedVariant?.price ?? product?.price ?? 0;
  const discount =
    product?.comparePrice
      ? Math.round(((product.comparePrice - effectivePrice) / product.comparePrice) * 100)
      : null;
  const inStock = selectedVariant
    ? selectedVariant.stock > 0
    : (product?.stock ?? 0) > 0 || product?.isDigital;
  const stockCount = selectedVariant ? selectedVariant.stock : product?.stock ?? 0;

  /* ─── Handlers ─── */
  const handleAddToCart = () => {
    if (!product) return;
    addItem(
      {
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: product.comparePrice ?? effectivePrice,
        salePrice: product.comparePrice ? effectivePrice : undefined,
        image: product.images[0] || undefined,
        variant: selectedVariant?.value,
      },
      quantity
    );
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
    openCart();
  };

  const handleBuyNow = () => {
    handleAddToCart();
    window.location.href = "/checkout";
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: product?.name, url });
      } catch {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  /* ─── Loading state ─── */
  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 text-orange-500 animate-spin mx-auto" />
          <p className="text-zinc-400 text-sm">Loading product...</p>
        </div>
      </div>
    );
  }

  /* ─── Error state ─── */
  if (error || !product) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertTriangle className="w-12 h-12 text-zinc-600 mx-auto" />
          <h1 className="text-xl font-bold text-white font-display">
            {error || "Product not found"}
          </h1>
          <p className="text-sm text-zinc-500">
            This product may have been removed or is no longer available.
          </p>
          <Button asChild>
            <Link href="/store">Back to Store</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ── Breadcrumb ── */}
      <section className="relative pt-28 sm:pt-32 pb-0 overflow-hidden">
        <div className="absolute inset-0 bg-zinc-950" />
        <div className="container-wide relative z-10">
          <nav className="flex items-center gap-1.5 text-xs text-zinc-500">
            <Link
              href="/store"
              className="hover:text-orange-500 transition-colors flex items-center gap-1"
            >
              <ArrowLeft className="w-3 h-3" />
              Store
            </Link>
            {product.category && (
              <>
                <ChevronRight className="w-3 h-3" />
                <Link
                  href={`/store?category=${product.category.slug}`}
                  className="hover:text-orange-500 transition-colors"
                >
                  {product.category.name}
                </Link>
              </>
            )}
            <ChevronRight className="w-3 h-3" />
            <span className="text-zinc-400 line-clamp-1">{product.name}</span>
          </nav>
        </div>
      </section>

      {/* ── Product Main ── */}
      <section className="py-6 sm:py-10 md:py-14">
        <div className="container-wide">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            {/* ── Image Gallery ── */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-6"
            >
              <div className="sticky top-28 space-y-3">
                {/* Main image */}
                <div className="aspect-square rounded-2xl bg-zinc-800/30 border border-zinc-800/50 flex items-center justify-center relative overflow-hidden">
                  {product.images.length > 0 ? (
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={selectedThumb}
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.3 }}
                        className="absolute inset-0"
                      >
                        <Image
                          src={product.images[selectedThumb]}
                          alt={product.name}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 50vw"
                          priority
                        />
                      </motion.div>
                    </AnimatePresence>
                  ) : (
                    <ShoppingBag className="w-20 h-20 text-zinc-700/40" />
                  )}

                  {/* Badges */}
                  <div className="absolute top-4 left-4 flex flex-col gap-1.5 z-10">
                    {product.badge && (
                      <span className="text-[9px] font-bold uppercase tracking-wider bg-white text-zinc-900 px-2.5 py-1 rounded shadow-lg">
                        {product.badge}
                      </span>
                    )}
                    {discount && discount > 0 && (
                      <span className="text-[9px] font-bold bg-emerald-500 text-white px-2.5 py-1 rounded shadow-lg">
                        -{discount}% OFF
                      </span>
                    )}
                    {product.isDigital && (
                      <span className="text-[9px] font-bold bg-blue-500 text-white px-2.5 py-1 rounded shadow-lg">
                        Digital
                      </span>
                    )}
                  </div>

                  {/* Share button */}
                  <button
                    onClick={handleShare}
                    className="absolute top-4 right-4 w-9 h-9 rounded-full bg-zinc-900/60 border border-zinc-700/40 backdrop-blur-sm flex items-center justify-center text-zinc-400 hover:text-white hover:border-zinc-600 transition-all z-10"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <Share2 className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Thumbnails */}
                {product.images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {product.images.map((img, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedThumb(i)}
                        className={cn(
                          "w-16 h-16 sm:w-20 sm:h-20 rounded-xl border flex items-center justify-center transition-all shrink-0 overflow-hidden relative",
                          selectedThumb === i
                            ? "border-orange-500/50 ring-1 ring-orange-500/20"
                            : "border-zinc-800/40 hover:border-zinc-700"
                        )}
                      >
                        <Image
                          src={img}
                          alt={`${product.name} ${i + 1}`}
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      </button>
                    ))}
                  </div>
                )}

                {/* Stats bar */}
                <div className="flex items-center gap-4 text-[10px] text-zinc-600 pt-1">
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {product.viewCount.toLocaleString()} views
                  </span>
                  <span className="flex items-center gap-1">
                    <ShoppingCart className="w-3 h-3" />
                    {product.salesCount.toLocaleString()} sold
                  </span>
                </div>
              </div>
            </motion.div>

            {/* ── Product Details ── */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="lg:col-span-6 space-y-5 sm:space-y-6"
            >
              {/* Category & name */}
              <div>
                {product.category && (
                  <p className="text-[10px] sm:text-xs text-zinc-500 uppercase tracking-wider mb-2">
                    {product.category.name}
                  </p>
                )}
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white font-display leading-tight mb-3 sm:mb-4">
                  {product.name}
                </h1>

                {/* Status row */}
                <div className="flex items-center gap-3 flex-wrap">
                  {inStock ? (
                    <Badge variant="success" className="text-[10px]">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      {product.isDigital
                        ? "Available"
                        : stockCount <= 5
                        ? `Only ${stockCount} left`
                        : "In Stock"}
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="text-[10px]">
                      Out of Stock
                    </Badge>
                  )}
                  {product.isFeatured && (
                    <Badge variant="warning" className="text-[10px]">
                      <Star className="w-3 h-3 mr-1 fill-current" />
                      Featured
                    </Badge>
                  )}
                  {product.sku && (
                    <span className="text-[10px] text-zinc-600">
                      SKU: {product.sku}
                    </span>
                  )}
                </div>
              </div>

              {/* Price block */}
              <div className="p-4 sm:p-5 rounded-xl bg-zinc-900/60 border border-zinc-800/50">
                <div className="flex items-baseline gap-3 mb-1">
                  <span className="text-3xl sm:text-4xl font-bold text-white font-display">
                    {formatCurrency(effectivePrice)}
                  </span>
                  {product.comparePrice && product.comparePrice > effectivePrice && (
                    <>
                      <span className="text-base text-zinc-600 line-through">
                        {formatCurrency(product.comparePrice)}
                      </span>
                      <Badge variant="success" className="text-[10px]">
                        Save {discount}%
                      </Badge>
                    </>
                  )}
                </div>
                {effectivePrice >= 500 && (
                  <p className="text-xs text-emerald-400/80 flex items-center gap-1.5 mt-1">
                    <Truck className="w-3.5 h-3.5" />
                    Eligible for free shipping
                  </p>
                )}
              </div>

              {/* Summary */}
              {product.summary && (
                <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
                  {product.summary}
                </p>
              )}

              {/* Tags */}
              {product.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {product.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800/40 border border-zinc-700/30 text-zinc-400"
                    >
                      <Tag className="w-2.5 h-2.5 inline mr-1" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Variants */}
              {product.variants.length > 0 && (
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider mb-3">
                    Options
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {product.variants.map((variant) => (
                      <button
                        key={variant.id}
                        onClick={() => {
                          setSelectedVariant(variant);
                          setQuantity(1);
                        }}
                        disabled={variant.stock <= 0}
                        className={cn(
                          "px-4 py-2.5 rounded-xl border text-sm font-medium transition-all",
                          selectedVariant?.id === variant.id
                            ? "border-orange-500/50 bg-orange-500/10 text-orange-500 ring-1 ring-orange-500/20"
                            : variant.stock <= 0
                            ? "border-zinc-800/30 bg-zinc-900/20 text-zinc-600 cursor-not-allowed line-through"
                            : "border-zinc-700/50 bg-zinc-800/30 text-zinc-300 hover:border-zinc-600"
                        )}
                      >
                        <span>{variant.value}</span>
                        {variant.price && variant.price !== product.price && (
                          <span className="text-xs text-zinc-500 ml-1.5">
                            ({formatCurrency(variant.price)})
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity + Add to Cart */}
              <div className="pt-5 border-t border-zinc-800/50 space-y-4">
                <div className="flex items-center gap-5">
                  <span className="text-sm font-medium text-zinc-300">Quantity</span>
                  <div className="flex items-center border border-zinc-700/50 rounded-xl overflow-hidden bg-zinc-900/40">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-11 h-11 flex items-center justify-center hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-white"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-12 text-center text-white font-bold text-sm border-x border-zinc-800/50">
                      {quantity}
                    </span>
                    <button
                      onClick={() =>
                        setQuantity(
                          Math.min(
                            product.isDigital ? 99 : stockCount,
                            quantity + 1
                          )
                        )
                      }
                      className="w-11 h-11 flex items-center justify-center hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-white"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  {!product.isDigital && stockCount <= 10 && stockCount > 0 && (
                    <span className="text-xs text-amber-400">
                      {stockCount} remaining
                    </span>
                  )}
                </div>

                <div className="flex gap-3">
                  <Button
                    size="xl"
                    className="flex-1 group"
                    onClick={handleAddToCart}
                    disabled={!inStock}
                  >
                    {addedToCart ? (
                      <>
                        <Check className="w-5 h-5" />
                        Added to Cart!
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-5 h-5" />
                        Add to Cart — {formatCurrency(effectivePrice * quantity)}
                      </>
                    )}
                  </Button>
                </div>

                <Button
                  size="lg"
                  variant="secondary"
                  className="w-full"
                  onClick={handleBuyNow}
                  disabled={!inStock}
                >
                  <Zap className="w-4 h-4 text-orange-500" />
                  Buy Now
                </Button>
              </div>

              {/* Shipping guarantees */}
              <div className="grid grid-cols-2 gap-3 pt-5 border-t border-zinc-800/50">
                {SHIPPING_INFO.map((info) => (
                  <div
                    key={info.title}
                    className="flex items-start gap-2.5 p-3 rounded-xl bg-zinc-900/30 border border-zinc-800/30"
                  >
                    <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0">
                      <info.icon className="w-3.5 h-3.5 text-orange-500" />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-white leading-tight">
                        {info.title}
                      </p>
                      <p className="text-[10px] text-zinc-500">{info.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* ── Tabs: Description / Details ── */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mt-14 sm:mt-20 max-w-4xl"
          >
            {/* Tab headers */}
            <div className="flex gap-1 border-b border-zinc-800/60 mb-6 sm:mb-8">
              {(["description", "details"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "px-5 py-3 text-sm font-semibold transition-all relative",
                    activeTab === tab
                      ? "text-orange-500"
                      : "text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  {tab === "description" ? "Description" : "Product Details"}
                  {activeTab === tab && (
                    <motion.div
                      layoutId="product-tab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <AnimatePresence mode="wait">
              {activeTab === "description" && (
                <motion.div
                  key="desc"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  {product.description ? (
                    <div
                      className="prose prose-invert prose-zinc max-w-none prose-headings:font-display prose-a:text-orange-500 prose-strong:text-white"
                      dangerouslySetInnerHTML={{ __html: product.description }}
                    />
                  ) : product.summary ? (
                    <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
                      {product.summary}
                    </p>
                  ) : (
                    <p className="text-sm text-zinc-600 italic">
                      No description available for this product.
                    </p>
                  )}
                </motion.div>
              )}

              {activeTab === "details" && (
                <motion.div
                  key="details"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="rounded-xl border border-zinc-800/50 overflow-hidden">
                    {[
                      { label: "Category", value: product.category?.name || "—" },
                      { label: "SKU", value: product.sku || "—" },
                      {
                        label: "Weight",
                        value: product.weight ? `${product.weight} g` : "—",
                      },
                      {
                        label: "Type",
                        value: product.isDigital ? "Digital Product" : "Physical Product",
                      },
                      {
                        label: "Stock",
                        value: product.isDigital
                          ? "Unlimited"
                          : `${product.stock} units`,
                      },
                      ...(product.variants.length > 0
                        ? [
                            {
                              label: "Variants",
                              value: product.variants
                                .map((v) => v.value)
                                .join(", "),
                            },
                          ]
                        : []),
                    ].map((row, i) => (
                      <div
                        key={row.label}
                        className={cn(
                          "flex items-center justify-between px-5 py-3.5 text-sm",
                          i % 2 === 0 ? "bg-zinc-900/30" : "bg-transparent"
                        )}
                      >
                        <span className="text-zinc-500 font-medium">
                          {row.label}
                        </span>
                        <span className="text-white">{row.value}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* ── Related Products ── */}
          {related.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="mt-14 sm:mt-20"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg sm:text-xl font-bold text-white font-display">
                  You May Also Like
                </h2>
                <Link
                  href="/store"
                  className="text-xs font-medium text-orange-500 hover:text-orange-400 transition-colors flex items-center gap-1"
                >
                  View All
                  <ChevronRight className="w-3 h-3" />
                </Link>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {related.map((item) => {
                  const itemDiscount =
                    item.comparePrice
                      ? Math.round(
                          ((item.comparePrice - item.price) / item.comparePrice) * 100
                        )
                      : null;

                  return (
                    <Link
                      key={item.id}
                      href={`/store/${item.slug}`}
                      className="group rounded-2xl border border-zinc-800/60 bg-zinc-900/40 overflow-hidden hover:border-zinc-700/80 transition-all"
                    >
                      <div className="aspect-square bg-zinc-800/20 flex items-center justify-center relative overflow-hidden">
                        {item.images[0] ? (
                          <Image
                            src={item.images[0]}
                            alt={item.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                          />
                        ) : (
                          <ShoppingBag className="w-10 h-10 text-zinc-700/50" />
                        )}

                        {item.badge && (
                          <span className="absolute top-2 left-2 text-[8px] font-bold uppercase bg-white text-zinc-900 px-2 py-0.5 rounded shadow">
                            {item.badge}
                          </span>
                        )}
                        {itemDiscount && itemDiscount > 0 && (
                          <span className="absolute top-2 right-2 text-[8px] font-bold bg-emerald-500 text-white px-2 py-0.5 rounded shadow">
                            -{itemDiscount}%
                          </span>
                        )}
                      </div>
                      <div className="p-3 sm:p-4">
                        {item.category && (
                          <p className="text-[10px] text-zinc-600 uppercase tracking-wider mb-1">
                            {item.category.name}
                          </p>
                        )}
                        <h3 className="text-xs sm:text-sm font-bold text-white font-display line-clamp-1 group-hover:text-orange-500 transition-colors mb-2">
                          {item.name}
                        </h3>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-sm sm:text-base font-bold text-white">
                            {formatCurrency(item.price)}
                          </span>
                          {item.comparePrice && (
                            <span className="text-[10px] text-zinc-600 line-through">
                              {formatCurrency(item.comparePrice)}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          )}
        </div>
      </section>
    </>
  );
}
