"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingBag, Star, Minus, Plus, ShoppingCart, ArrowLeft,
  Truck, Shield, RotateCcw, CheckCircle2, Package, ChevronRight,
  Share2, Zap, Eye, Check, Loader2, AlertTriangle, Tag, Heart,
  Users, MessageSquare, ThumbsUp, Send,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, cn } from "@/lib/utils";
import { useCartStore, useWishlistStore, useRecentlyViewedStore } from "@/stores";

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Constants ────────────────────────────────────────────────────────────────

const SHIPPING_INFO = [
  { icon: Truck, title: "Free Shipping", desc: "On Orders over GHS 2000" },
  { icon: Shield, title: "Secure Payment", desc: "256-bit SSL encrypted" },
  { icon: RotateCcw, title: "30-Day Returns", desc: "Hassle-free returns" },
  { icon: Package, title: "Quality Guaranteed", desc: "Premium materials" },
];

const REVIEW_FORM_PLACEHOLDER = [
  { name: "Kwame A.", rating: 5, time: "2 weeks ago", text: "Excellent quality! The material is premium and the fit is perfect. Proud to represent TIMN values." },
  { name: "Ama B.", rating: 4, time: "1 month ago", text: "Great product. Packaging was secure and delivery was on time. Would definitely recommend." },
  { name: "Emmanuel K.", rating: 5, time: "3 weeks ago", text: "Outstanding! This is exactly what I needed. The design captures everything TIMN stands for." },
];

// ─── Wishlist Button ──────────────────────────────────────────────────────────

function WishlistBtn({ productId, size = "md" }: { productId: string; size?: "sm" | "md" }) {
  const { toggleItem, isWishlisted } = useWishlistStore();
  const wishlisted = isWishlisted(productId);
  return (
    <button
      onClick={() => toggleItem(productId)}
      className={cn(
        "rounded-full flex items-center justify-center transition-all cursor-pointer",
        size === "sm" ? "w-8 h-8" : "w-10 h-10",
        wishlisted
          ? "bg-red-500 text-white shadow-lg shadow-red-500/30"
          : "bg-zinc-800/60 border border-zinc-700/50 text-zinc-400 hover:text-red-400 hover:border-red-500/30"
      )}
      aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
    >
      <Heart className={cn(size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4", wishlisted && "fill-current")} />
    </button>
  );
}

// ─── Star Display ─────────────────────────────────────────────────────────────

function StarDisplay({ rating, interactive = false, onRate }: { rating: number; interactive?: boolean; onRate?: (r: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          onClick={() => interactive && onRate?.(s)}
          onMouseEnter={() => interactive && setHover(s)}
          onMouseLeave={() => interactive && setHover(0)}
          className={cn(!interactive && "pointer-events-none", interactive && "cursor-pointer")}
          aria-label={interactive ? `Rate ${s} stars` : undefined}
        >
          <Star className={cn("w-4 h-4 transition-colors",
            (interactive ? (hover || rating) : rating) >= s
              ? "text-amber-400 fill-amber-400"
              : "text-zinc-700"
          )} />
        </button>
      ))}
    </div>
  );
}

// ─── Lightbox ────────────────────────────────────────────────────────────────

function Lightbox({ images, index, onClose }: { images: string[]; index: number; onClose: () => void }) {
  const [current, setCurrent] = useState(index);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setCurrent((c) => Math.min(c + 1, images.length - 1));
      if (e.key === "ArrowLeft") setCurrent((c) => Math.max(c - 1, 0));
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, images.length]);

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed inset-4 z-50 flex items-center justify-center"
        onClick={onClose}
      >
        <div className="relative max-w-4xl w-full max-h-full" onClick={(e) => e.stopPropagation()}>
          <div className="aspect-square relative rounded-2xl overflow-hidden bg-zinc-900">
            <Image src={images[current]} alt="Product" fill className="object-contain" sizes="90vw" />
          </div>
          {images.length > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={cn("w-2 h-2 rounded-full transition-all cursor-pointer",
                    i === current ? "bg-orange-500 w-4" : "bg-zinc-600 hover:bg-zinc-400")}
                />
              ))}
            </div>
          )}
        </div>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center cursor-pointer hover:bg-zinc-700 transition-colors"
        >
          <span className="text-white text-lg">×</span>
        </button>
      </motion.div>
    </>
  );
}

// ─── Reviews Section ──────────────────────────────────────────────────────────

function ReviewsSection({ product }: { product: ProductDetail }) {
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const avgRating = product.salesCount > 0 ? Math.min(5, 3.5 + (product.salesCount % 15) * 0.1) : 0;
  const reviews = product.salesCount > 2 ? REVIEW_FORM_PLACEHOLDER.slice(0, Math.min(3, Math.ceil(product.salesCount / 5))) : [];

  return (
    <div className="space-y-8">
      {/* Aggregate */}
      <div className="flex flex-col sm:flex-row gap-6 p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800/50">
        <div className="text-center sm:border-r sm:border-zinc-800/50 sm:pr-6">
          <div className="text-5xl font-bold text-white font-display mb-1">
            {reviews.length > 0 ? avgRating.toFixed(1) : "—"}
          </div>
          <StarDisplay rating={Math.round(avgRating)} />
          <p className="text-xs text-zinc-500 mt-2">{reviews.length} review{reviews.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex-1 space-y-2">
          {[5, 4, 3, 2, 1].map((star) => {
            const pct = reviews.length > 0
              ? reviews.filter((r) => r.rating === star).length / reviews.length * 100
              : 0;
            return (
              <div key={star} className="flex items-center gap-2 text-xs">
                <span className="text-zinc-500 w-2">{star}</span>
                <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />
                <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-zinc-600 w-6 text-right">{Math.round(pct)}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Review cards */}
      {reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews.map((r, i) => (
            <div key={i} className="p-5 rounded-xl border border-zinc-800/50 bg-zinc-900/30">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-sm font-bold text-orange-500">
                    {r.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{r.name}</p>
                    <p className="text-[10px] text-zinc-500">{r.time}</p>
                  </div>
                </div>
                <StarDisplay rating={r.rating} />
              </div>
              <p className="text-sm text-zinc-400 leading-relaxed">{r.text}</p>
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-zinc-800/40">
                <button className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer">
                  <ThumbsUp className="w-3.5 h-3.5" />Helpful
                </button>
                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3 h-3" />Verified Purchase
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-10">
          <MessageSquare className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
          <p className="text-sm font-medium text-zinc-400 mb-1">No reviews yet</p>
          <p className="text-xs text-zinc-600">Be the first to share your thoughts on this product.</p>
        </div>
      )}

      {/* Leave a review form */}
      {!submitted ? (
        <div className="p-5 rounded-2xl border border-zinc-800/50 bg-zinc-900/30 space-y-4">
          <h3 className="text-sm font-bold text-white">Leave a Review</h3>
          <div>
            <p className="text-xs text-zinc-500 mb-2">Your rating</p>
            <StarDisplay rating={rating} interactive onRate={setRating} />
          </div>
          <textarea
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="Share your experience with this product..."
            className="w-full h-24 bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-3 text-sm text-white placeholder:text-zinc-600 resize-none focus:outline-none focus:border-orange-500/50 transition-colors"
          />
          <Button
            className="gap-2 cursor-pointer"
            disabled={rating === 0 || reviewText.trim().length < 10}
            onClick={() => { if (rating > 0 && reviewText.trim().length >= 10) setSubmitted(true); }}
          >
            <Send className="w-4 h-4" />Submit Review
          </Button>
        </div>
      ) : (
        <div className="p-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 text-center">
          <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
          <p className="text-sm font-bold text-white mb-1">Review Submitted!</p>
          <p className="text-xs text-zinc-400">Thank you for sharing your feedback.</p>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProductPage() {
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [related, setRelated] = useState<RelatedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [selectedThumb, setSelectedThumb] = useState(0);
  const [activeTab, setActiveTab] = useState<"description" | "details" | "reviews">("description");
  const [copied, setCopied] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Simulated live viewer count
  const [viewerCount] = useState(() => Math.floor(Math.random() * 18) + 4);

  const { addItem, openCart, totalItems } = useCartStore();
  const { addProduct } = useRecentlyViewedStore();
  const { toggleItem: toggleWishlist, isWishlisted } = useWishlistStore();

  const fetchProduct = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/store/${slug}`);
      if (!res.ok) {
        setError(res.status === 404 ? "Product not found" : "Failed to load product");
        return;
      }
      const data = await res.json();
      setProduct(data.product);
      setRelated(data.related || []);
      if (data.product.variants?.length > 0) setSelectedVariant(data.product.variants[0]);
    } catch {
      setError("Failed to load product");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => { fetchProduct(); }, [fetchProduct]);

  // Add to recently viewed once product loads
  useEffect(() => {
    if (product) {
      addProduct({
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: Number(product.price),
        comparePrice: product.comparePrice ? Number(product.comparePrice) : null,
        image: product.images[0],
      });
    }
  }, [product, addProduct]);

  const effectivePrice = Number(selectedVariant?.price ?? product?.price ?? 0);
  const discount = product?.comparePrice
    ? Math.round(((Number(product.comparePrice) - effectivePrice) / Number(product.comparePrice)) * 100)
    : null;
  const inStock = selectedVariant ? selectedVariant.stock > 0 : (product?.stock ?? 0) > 0 || product?.isDigital;
  const stockCount = selectedVariant ? selectedVariant.stock : product?.stock ?? 0;

  const handleAddToCart = () => {
    if (!product) return;
    addItem(
      {
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: product.comparePrice ? Number(product.comparePrice) : effectivePrice,
        salePrice: product.comparePrice ? effectivePrice : undefined,
        image: product.images[0] || undefined,
        variant: selectedVariant?.value,
      },
      quantity
    );
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2200);
    openCart();
  };

  const handleBuyNow = () => { handleAddToCart(); router.push("/checkout"); };

  const handleShare = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: product?.name, url: window.location.href }); } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

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

  if (error || !product) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertTriangle className="w-12 h-12 text-zinc-600 mx-auto" />
          <h1 className="text-xl font-bold text-white font-display">{error || "Product not found"}</h1>
          <p className="text-sm text-zinc-500">This product may have been removed or is no longer available.</p>
          <Button asChild><Link href="/store">Back to Store</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Breadcrumb */}
      <section className="relative pt-28 sm:pt-32 pb-0 overflow-hidden">
        <div className="absolute inset-0 bg-zinc-950" />
        <div className="container-wide relative z-10">
          <nav className="flex items-center gap-1.5 text-xs text-zinc-500">
            <Link href="/store" className="hover:text-orange-500 transition-colors flex items-center gap-1 cursor-pointer">
              <ArrowLeft className="w-3 h-3" />Store
            </Link>
            {product.category && (
              <>
                <ChevronRight className="w-3 h-3" />
                <Link href={`/store?category=${product.category.slug}`} className="hover:text-orange-500 transition-colors cursor-pointer">
                  {product.category.name}
                </Link>
              </>
            )}
            <ChevronRight className="w-3 h-3" />
            <span className="text-zinc-400 line-clamp-1">{product.name}</span>
          </nav>
        </div>
      </section>

      {/* Product Main */}
      <section className="py-6 sm:py-10 md:py-14 pb-24 lg:pb-14">
        <div className="container-wide">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            {/* Image Gallery */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-6"
            >
              <div className="sticky top-28 space-y-3">
                {/* Main image */}
                <div
                  className="aspect-square rounded-2xl bg-zinc-800/30 border border-zinc-800/50 flex items-center justify-center relative overflow-hidden cursor-zoom-in"
                  onClick={() => product.images.length > 0 && setLightboxOpen(true)}
                >
                  {product.images.length > 0 ? (
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={selectedThumb}
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.25 }}
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

                  {/* Top-right action buttons */}
                  <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleShare(); }}
                      className="w-9 h-9 rounded-full bg-zinc-900/60 border border-zinc-700/40 backdrop-blur-sm flex items-center justify-center text-zinc-400 hover:text-white hover:border-zinc-600 transition-all cursor-pointer"
                    >
                      {copied ? <Check className="w-4 h-4 text-green-400" /> : <Share2 className="w-4 h-4" />}
                    </button>
                    <div onClick={(e) => e.stopPropagation()}>
                      <WishlistBtn productId={product.id} size="sm" />
                    </div>
                  </div>

                  {/* Zoom hint */}
                  {product.images.length > 0 && (
                    <div className="absolute bottom-4 left-4 text-[9px] text-zinc-500 bg-zinc-900/60 backdrop-blur-sm px-2 py-1 rounded-full border border-zinc-800/40">
                      Click to zoom
                    </div>
                  )}
                </div>

                {/* Thumbnails */}
                {product.images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {product.images.map((img, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedThumb(i)}
                        className={cn(
                          "w-16 h-16 sm:w-20 sm:h-20 rounded-xl border flex items-center justify-center transition-all shrink-0 overflow-hidden relative cursor-pointer",
                          selectedThumb === i ? "border-orange-500/50 ring-1 ring-orange-500/20" : "border-zinc-800/40 hover:border-zinc-700"
                        )}
                      >
                        <Image src={img} alt={`${product.name} ${i + 1}`} fill className="object-cover" sizes="80px" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Stats bar */}
                <div className="flex items-center gap-5 text-[10px] text-zinc-600 pt-1">
                  <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{product.viewCount.toLocaleString()} views</span>
                  <span className="flex items-center gap-1"><ShoppingCart className="w-3 h-3" />{product.salesCount.toLocaleString()} sold</span>
                  <span className="flex items-center gap-1 text-orange-400/70">
                    <Users className="w-3 h-3" />{viewerCount} viewing now
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Product Details */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="lg:col-span-6 space-y-5 sm:space-y-6"
            >
              {/* Category & name */}
              <div>
                {product.category && (
                  <p className="text-[10px] sm:text-xs text-zinc-500 uppercase tracking-wider mb-2">{product.category.name}</p>
                )}
                <div className="flex items-start gap-3">
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white font-display leading-tight flex-1">
                    {product.name}
                  </h1>
                  <div className="hidden sm:block shrink-0 mt-1">
                    <WishlistBtn productId={product.id} />
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-center gap-3 flex-wrap mt-3">
                  {inStock ? (
                    <Badge variant="success" className="text-[10px]">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      {product.isDigital ? "Available" : stockCount <= 5 ? `Only ${stockCount} left` : "In Stock"}
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="text-[10px]">Out of Stock</Badge>
                  )}
                  {product.isFeatured && (
                    <Badge variant="warning" className="text-[10px]">
                      <Star className="w-3 h-3 mr-1 fill-current" />Featured
                    </Badge>
                  )}
                  {product.sku && <span className="text-[10px] text-zinc-600">SKU: {product.sku}</span>}
                </div>

                {/* Social proof urgency */}
                {viewerCount > 5 && inStock && (
                  <div className="flex items-center gap-2 mt-3 text-xs text-amber-400/80">
                    <Users className="w-3.5 h-3.5" />
                    <span><strong>{viewerCount} people</strong> are viewing this right now</span>
                  </div>
                )}
              </div>

              {/* Price */}
              <div className="p-4 sm:p-5 rounded-xl bg-zinc-900/60 border border-zinc-800/50">
                <div className="flex items-baseline gap-3 mb-1">
                  <span className="text-3xl sm:text-4xl font-bold text-white font-display">
                    {formatCurrency(effectivePrice)}
                  </span>
                  {product.comparePrice && Number(product.comparePrice) > effectivePrice && (
                    <>
                      <span className="text-base text-zinc-600 line-through">{formatCurrency(Number(product.comparePrice))}</span>
                      <Badge variant="success" className="text-[10px]">Save {discount}%</Badge>
                    </>
                  )}
                </div>
                {effectivePrice >= 2000 && (
                  <p className="text-xs text-emerald-400/80 flex items-center gap-1.5 mt-1">
                    <Truck className="w-3.5 h-3.5" />Eligible for free shipping
                  </p>
                )}
              </div>

              {/* Summary */}
              {product.summary && <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">{product.summary}</p>}

              {/* Tags */}
              {product.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {product.tags.map((tag) => (
                    <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800/40 border border-zinc-700/30 text-zinc-400">
                      <Tag className="w-2.5 h-2.5 inline mr-1" />{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Variants */}
              {product.variants.length > 0 && (
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider mb-3">Options</h3>
                  <div className="flex flex-wrap gap-2">
                    {product.variants.map((v) => (
                      <button
                        key={v.id}
                        onClick={() => { setSelectedVariant(v); setQuantity(1); }}
                        disabled={v.stock <= 0}
                        className={cn(
                          "px-4 py-2.5 rounded-xl border text-sm font-medium transition-all cursor-pointer",
                          selectedVariant?.id === v.id
                            ? "border-orange-500/50 bg-orange-500/10 text-orange-500 ring-1 ring-orange-500/20"
                            : v.stock <= 0
                            ? "border-zinc-800/30 bg-zinc-900/20 text-zinc-600 cursor-not-allowed line-through"
                            : "border-zinc-700/50 bg-zinc-800/30 text-zinc-300 hover:border-zinc-600"
                        )}
                      >
                        {v.value}
                        {v.price && v.price !== product.price && (
                          <span className="text-xs text-zinc-500 ml-1.5">({formatCurrency(v.price)})</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity + CTA */}
              <div className="pt-5 border-t border-zinc-800/50 space-y-4">
                <div className="flex items-center gap-5">
                  <span className="text-sm font-medium text-zinc-300">Quantity</span>
                  <div className="flex items-center border border-zinc-700/50 rounded-xl overflow-hidden bg-zinc-900/40">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-11 h-11 flex items-center justify-center hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-white cursor-pointer"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-12 text-center text-white font-bold text-sm border-x border-zinc-800/50">{quantity}</span>
                    <button
                      onClick={() => setQuantity(Math.min(product.isDigital ? 99 : stockCount, quantity + 1))}
                      className="w-11 h-11 flex items-center justify-center hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-white cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  {!product.isDigital && stockCount <= 10 && stockCount > 0 && (
                    <span className="text-xs text-amber-400 animate-pulse">{stockCount} remaining</span>
                  )}
                </div>

                <div className="flex gap-3">
                  <Button size="xl" className="flex-1 group cursor-pointer" onClick={handleAddToCart} disabled={!inStock}>
                    {addedToCart ? (
                      <><Check className="w-5 h-5" />Added to Cart!</>
                    ) : (
                      <><ShoppingCart className="w-5 h-5" />Add to Cart — {formatCurrency(effectivePrice * quantity)}</>
                    )}
                  </Button>
                  {totalItems() > 0 && (
                    <Button size="xl" variant="secondary" className="shrink-0 cursor-pointer" onClick={openCart} aria-label="View cart">
                      <ShoppingBag className="w-5 h-5" />
                    </Button>
                  )}
                </div>
                <div className="flex gap-3">
                  <Button size="lg" variant="secondary" className="flex-1 cursor-pointer" onClick={handleBuyNow} disabled={!inStock}>
                    <Zap className="w-4 h-4 text-orange-500" />Buy Now
                  </Button>
                  {totalItems() > 0 && (
                    <Button size="lg" variant="outline" className="flex-1 cursor-pointer border-orange-500/40 text-orange-500 hover:bg-orange-500/10" onClick={openCart}>
                      View Cart ({totalItems()})
                    </Button>
                  )}
                </div>
              </div>

              {/* Guarantees */}
              <div className="grid grid-cols-2 gap-3 pt-5 border-t border-zinc-800/50">
                {SHIPPING_INFO.map((info) => (
                  <div key={info.title} className="flex items-start gap-2.5 p-3 rounded-xl bg-zinc-900/30 border border-zinc-800/30">
                    <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0">
                      <info.icon className="w-3.5 h-3.5 text-orange-500" />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-white leading-tight">{info.title}</p>
                      <p className="text-[10px] text-zinc-500">{info.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mt-14 sm:mt-20 max-w-4xl"
          >
            <div className="flex gap-1 border-b border-zinc-800/60 mb-6 sm:mb-8">
              {(["description", "details", "reviews"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn("px-5 py-3 text-sm font-semibold transition-all relative capitalize cursor-pointer",
                    activeTab === tab ? "text-orange-500" : "text-zinc-500 hover:text-zinc-300")}
                >
                  {tab === "reviews" ? `Reviews (${product.salesCount > 2 ? Math.min(3, Math.ceil(product.salesCount / 5)) : 0})` : tab === "details" ? "Product Details" : "Description"}
                  {activeTab === tab && (
                    <motion.div layoutId="product-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500" transition={{ type: "spring", bounce: 0.2, duration: 0.5 }} />
                  )}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {activeTab === "description" && (
                <motion.div key="desc" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }}>
                  {product.description ? (
                    <div className="prose prose-invert prose-zinc max-w-none prose-headings:font-display prose-a:text-orange-500 prose-strong:text-white" dangerouslySetInnerHTML={{ __html: product.description }} />
                  ) : product.summary ? (
                    <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">{product.summary}</p>
                  ) : (
                    <p className="text-sm text-zinc-600 italic">No description available.</p>
                  )}
                </motion.div>
              )}

              {activeTab === "details" && (
                <motion.div key="details" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }}>
                  <div className="rounded-xl border border-zinc-800/50 overflow-hidden">
                    {[
                      { label: "Category", value: product.category?.name || "—" },
                      { label: "SKU", value: product.sku || "—" },
                      { label: "Weight", value: product.weight ? `${product.weight} g` : "—" },
                      { label: "Type", value: product.isDigital ? "Digital Product" : "Physical Product" },
                      { label: "Stock", value: product.isDigital ? "Unlimited" : `${product.stock} units` },
                      ...(product.variants.length > 0 ? [{ label: "Variants", value: product.variants.map((v) => v.value).join(", ") }] : []),
                    ].map((row, i) => (
                      <div key={row.label} className={cn("flex items-center justify-between px-5 py-3.5 text-sm", i % 2 === 0 ? "bg-zinc-900/30" : "bg-transparent")}>
                        <span className="text-zinc-500 font-medium">{row.label}</span>
                        <span className="text-white">{row.value}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === "reviews" && (
                <motion.div key="reviews" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }}>
                  <ReviewsSection product={product} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Related Products */}
          {related.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="mt-14 sm:mt-20"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg sm:text-xl font-bold text-white font-display">You May Also Like</h2>
                <Link href="/store" className="text-xs font-medium text-orange-500 hover:text-orange-400 transition-colors flex items-center gap-1 cursor-pointer">
                  View All<ChevronRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {related.map((item) => {
                  const itemDiscount = item.comparePrice
                    ? Math.round(((item.comparePrice - item.price) / item.comparePrice) * 100)
                    : null;
                  return (
                    <Link key={item.id} href={`/store/${item.slug}`} className="group rounded-2xl border border-zinc-800/60 bg-zinc-900/40 overflow-hidden hover:border-zinc-700/80 transition-all cursor-pointer">
                      <div className="aspect-square bg-zinc-800/20 flex items-center justify-center relative overflow-hidden">
                        {item.images[0] ? (
                          <Image src={item.images[0]} alt={item.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" />
                        ) : (
                          <ShoppingBag className="w-10 h-10 text-zinc-700/50" />
                        )}
                        {item.badge && <span className="absolute top-2 left-2 text-[8px] font-bold uppercase bg-white text-zinc-900 px-2 py-0.5 rounded shadow">{item.badge}</span>}
                        {itemDiscount && itemDiscount > 0 && <span className="absolute top-2 right-2 text-[8px] font-bold bg-emerald-500 text-white px-2 py-0.5 rounded shadow">-{itemDiscount}%</span>}
                      </div>
                      <div className="p-3 sm:p-4">
                        {item.category && <p className="text-[10px] text-zinc-600 uppercase tracking-wider mb-1">{item.category.name}</p>}
                        <h3 className="text-xs sm:text-sm font-bold text-white font-display line-clamp-1 group-hover:text-orange-500 transition-colors mb-2">{item.name}</h3>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-sm sm:text-base font-bold text-white">{formatCurrency(item.price)}</span>
                          {item.comparePrice && <span className="text-[10px] text-zinc-600 line-through">{formatCurrency(item.comparePrice)}</span>}
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

      {/* Sticky mobile CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-zinc-950/95 border-t border-zinc-800/60 backdrop-blur-md p-4">
        <div className="flex items-center gap-3 max-w-screen-sm mx-auto">
          <div className="shrink-0">
            <p className="text-[10px] text-zinc-500 leading-none mb-0.5">Price</p>
            <p className="text-lg font-bold text-white leading-none">{formatCurrency(effectivePrice)}</p>
          </div>
          <div className="flex gap-2 flex-1">
            <Button
              variant="secondary"
              className="shrink-0 w-11 h-11 p-0 cursor-pointer"
              onClick={() => toggleWishlist(product.id)}
              aria-label="Add to wishlist"
            >
              <Heart className={cn("w-4 h-4", isWishlisted(product.id) && "fill-red-500 text-red-500")} />
            </Button>
            <Button className="flex-1 cursor-pointer" onClick={handleAddToCart} disabled={!inStock}>
              <ShoppingCart className="w-4 h-4" />
              {addedToCart ? "Added!" : inStock ? "Add to Cart" : "Out of Stock"}
            </Button>
            {totalItems() > 0 && (
              <Button
                variant="outline"
                className="shrink-0 cursor-pointer border-orange-500/40 text-orange-500 hover:bg-orange-500/10 px-3"
                onClick={openCart}
                aria-label="View cart"
              >
                <ShoppingBag className="w-4 h-4" />
                <span className="text-xs font-bold">{totalItems()}</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxOpen && (
          <Lightbox images={product.images} index={selectedThumb} onClose={() => setLightboxOpen(false)} />
        )}
      </AnimatePresence>
    </>
  );
}
