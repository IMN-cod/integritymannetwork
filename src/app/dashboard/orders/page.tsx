"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package, ArrowLeft, ChevronRight, ChevronDown,
  Loader2, ShoppingBag, Clock, CheckCircle2,
  Truck, XCircle, RotateCcw, AlertTriangle,
  CreditCard, MapPin, Calendar, Hash,
} from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { formatCurrency, cn, formatDate } from "@/lib/utils";
import { useCartStore } from "@/stores";

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  variantInfo: string | null;
  product: { name: string; images: string[]; slug: string } | null;
}

interface Order {
  id: string;
  orderNumber: string;
  createdAt: string;
  updatedAt: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  shippingAddress: Record<string, string> | null;
  items: OrderItem[];
}

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string; bg: string; step: number }> = {
  PENDING:    { label: "Pending",    icon: Clock,         color: "text-amber-400",  bg: "bg-amber-500/10 border-amber-500/20",   step: 1 },
  CONFIRMED:  { label: "Confirmed",  icon: CheckCircle2,  color: "text-blue-400",   bg: "bg-blue-500/10 border-blue-500/20",     step: 2 },
  PROCESSING: { label: "Processing", icon: Package,       color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20", step: 2 },
  SHIPPED:    { label: "Shipped",    icon: Truck,         color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20", step: 3 },
  DELIVERED:  { label: "Delivered",  icon: CheckCircle2,  color: "text-emerald-400",bg: "bg-emerald-500/10 border-emerald-500/20",step: 4 },
  CANCELLED:  { label: "Cancelled",  icon: XCircle,       color: "text-red-400",    bg: "bg-red-500/10 border-red-500/20",       step: 0 },
  REFUNDED:   { label: "Refunded",   icon: RotateCcw,     color: "text-zinc-400",   bg: "bg-zinc-500/10 border-zinc-700/40",     step: 0 },
};

const PAYMENT_LABELS: Record<string, string> = {
  PAYSTACK: "Paystack",
  STRIPE: "Stripe",
  PAYPAL: "PayPal",
};

const TIMELINE_STEPS = [
  { label: "Order Placed",  icon: ShoppingBag },
  { label: "Confirmed",     icon: CheckCircle2 },
  { label: "Shipped",       icon: Truck },
  { label: "Delivered",     icon: Package },
];

// ─── Order timeline ───────────────────────────────────────────────────────────

function OrderTimeline({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status];
  const currentStep = cfg?.step ?? 1;
  const isCancelled = status === "CANCELLED" || status === "REFUNDED";

  if (isCancelled) {
    return (
      <div className="flex items-center gap-2 py-3">
        <XCircle className="w-4 h-4 text-red-400" />
        <span className="text-sm text-red-400 font-medium">
          {status === "REFUNDED" ? "Order refunded" : "Order cancelled"}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-0 overflow-x-auto pb-1">
      {TIMELINE_STEPS.map((step, i) => {
        const stepNum = i + 1;
        const done = currentStep >= stepNum;
        const active = currentStep === stepNum;
        return (
          <div key={step.label} className="flex items-center">
            <div className="flex flex-col items-center gap-1 shrink-0">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all",
                done
                  ? "bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-500/30"
                  : "bg-zinc-800 border-zinc-700 text-zinc-600"
              )}>
                <step.icon className="w-3.5 h-3.5" />
              </div>
              <span className={cn("text-[9px] font-medium whitespace-nowrap",
                done ? (active ? "text-orange-400" : "text-zinc-300") : "text-zinc-600"
              )}>
                {step.label}
              </span>
            </div>
            {i < TIMELINE_STEPS.length - 1 && (
              <div className={cn("h-0.5 w-10 sm:w-16 mx-0.5 mb-4 rounded-full transition-all",
                currentStep > stepNum ? "bg-orange-500" : "bg-zinc-800"
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Order card ───────────────────────────────────────────────────────────────

function OrderCard({ order }: { order: Order }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.PENDING;
  const Icon = cfg.icon;

  return (
    <motion.div
      layout
      className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 overflow-hidden"
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 sm:p-6 text-left cursor-pointer hover:bg-zinc-900/60 transition-colors"
      >
        <div className="flex items-start gap-4">
          {/* Product thumbnails */}
          <div className="flex -space-x-2 shrink-0">
            {order.items.slice(0, 3).map((item, i) => (
              <div
                key={item.id}
                className="w-10 h-10 rounded-lg border-2 border-zinc-900 bg-zinc-800 overflow-hidden relative"
                style={{ zIndex: 3 - i }}
              >
                {item.product?.images?.[0] ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={item.product.images[0]} alt={item.product.name ?? ""} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ShoppingBag className="w-4 h-4 text-zinc-600" />
                  </div>
                )}
              </div>
            ))}
            {order.items.length > 3 && (
              <div className="w-10 h-10 rounded-lg border-2 border-zinc-900 bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-400">
                +{order.items.length - 3}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-sm font-bold text-white font-display">#{order.orderNumber}</span>
              <span className={cn("inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border", cfg.color, cfg.bg)}>
                <Icon className="w-3 h-3" />{cfg.label}
              </span>
            </div>
            <p className="text-xs text-zinc-500 flex items-center gap-1.5">
              <Calendar className="w-3 h-3" />
              {formatDate(order.createdAt)}
              <span className="text-zinc-700">·</span>
              {order.items.length} item{order.items.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 sm:shrink-0">
          <div className="text-right">
            <p className="text-[10px] text-zinc-600 mb-0.5">Total</p>
            <p className="text-base font-bold text-white">{formatCurrency(order.total)}</p>
          </div>
          <ChevronDown className={cn("w-4 h-4 text-zinc-500 transition-transform duration-200 shrink-0", expanded && "rotate-180")} />
        </div>
      </button>

      {/* Expanded content */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-5 sm:px-6 pb-6 space-y-5 border-t border-zinc-800/50 pt-5">
              {/* Timeline */}
              <div>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-3">Order Status</p>
                <OrderTimeline status={order.status} />
              </div>

              {/* Items */}
              <div>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-3">Items</p>
                <div className="space-y-2">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl bg-zinc-800/30 border border-zinc-800/30">
                      <div className="w-12 h-12 rounded-lg bg-zinc-800 overflow-hidden relative shrink-0 border border-zinc-700/30">
                        {item.product?.images?.[0] ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={item.product.images[0]} alt={item.product.name ?? ""} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ShoppingBag className="w-4 h-4 text-zinc-600" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        {item.product ? (
                          <Link href={`/store/${item.product.slug}`} className="text-sm font-medium text-white hover:text-orange-500 transition-colors cursor-pointer line-clamp-1">
                            {item.product.name}
                          </Link>
                        ) : (
                          <p className="text-sm font-medium text-zinc-400 line-clamp-1">Product unavailable</p>
                        )}
                        {item.variantInfo && (
                          <p className="text-[11px] text-zinc-500 mt-0.5">{item.variantInfo}</p>
                        )}
                        <p className="text-[11px] text-zinc-500 mt-0.5">Qty: {item.quantity}</p>
                      </div>
                      <p className="text-sm font-semibold text-white shrink-0">{formatCurrency(item.price)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Two-column info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Payment summary */}
                <div className="p-4 rounded-xl bg-zinc-800/30 border border-zinc-800/30 space-y-2">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5 mb-3">
                    <CreditCard className="w-3 h-3" />Payment Summary
                  </p>
                  {[
                    { label: "Subtotal", value: formatCurrency(order.subtotal) },
                    { label: "Shipping", value: order.shipping === 0 ? "Free" : formatCurrency(order.shipping) },
                    ...(order.tax > 0 ? [{ label: "Tax", value: formatCurrency(order.tax) }] : []),
                    { label: "Total", value: formatCurrency(order.total), bold: true },
                  ].map((row) => (
                    <div key={row.label} className={cn("flex items-center justify-between text-xs", row.bold && "pt-2 border-t border-zinc-700/50")}>
                      <span className={row.bold ? "font-bold text-white" : "text-zinc-400"}>{row.label}</span>
                      <span className={row.bold ? "font-bold text-white" : "text-zinc-300"}>{row.value}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-zinc-500">Payment method</span>
                    <span className="text-zinc-300">{PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod}</span>
                  </div>
                </div>

                {/* Shipping address */}
                {order.shippingAddress && (
                  <div className="p-4 rounded-xl bg-zinc-800/30 border border-zinc-800/30">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5 mb-3">
                      <MapPin className="w-3 h-3" />Shipping Address
                    </p>
                    <div className="space-y-1 text-xs text-zinc-400">
                      {order.shippingAddress.firstName && (
                        <p className="font-semibold text-white">
                          {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                        </p>
                      )}
                      {order.shippingAddress.address && <p>{order.shippingAddress.address}</p>}
                      {order.shippingAddress.city && (
                        <p>{order.shippingAddress.city}{order.shippingAddress.state ? `, ${order.shippingAddress.state}` : ""}</p>
                      )}
                      {order.shippingAddress.country && <p>{order.shippingAddress.country}</p>}
                      {order.shippingAddress.phone && (
                        <p className="text-zinc-500 mt-2">{order.shippingAddress.phone}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Order ID footer */}
              <div className="flex items-center gap-1.5 text-[10px] text-zinc-600 pt-1">
                <Hash className="w-3 h-3" />Order ID: {order.id}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OrdersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const paymentResult = searchParams.get("payment");
  const paymentReference = searchParams.get("ref");
  const clearCart = useCartStore((state) => state.clearCart);

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "active" | "delivered" | "cancelled">("all");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/login?callbackUrl=/dashboard/orders");
  }, [status, router]);

  useEffect(() => {
    if (paymentResult === "success") clearCart();
  }, [paymentResult, clearCart]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/orders")
      .then((r) => r.json())
      .then((data) => setOrders(Array.isArray(data) ? data : data.orders ?? []))
      .catch(() => setError("Failed to load orders"))
      .finally(() => setLoading(false));
  }, [status]);

  const filtered = orders.filter((o) => {
    if (filter === "active") return ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED"].includes(o.status);
    if (filter === "delivered") return o.status === "DELIVERED";
    if (filter === "cancelled") return ["CANCELLED", "REFUNDED"].includes(o.status);
    return true;
  });

  if (status === "loading" || (status === "authenticated" && loading)) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <section className="relative pt-28 pb-10 sm:pt-32 sm:pb-12 overflow-hidden">
        <div className="absolute inset-0 bg-zinc-950" />
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="absolute inset-0 bg-radial-dark" />
        <div className="container-wide relative z-10">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-xs text-zinc-500 hover:text-orange-500 transition-colors mb-6 cursor-pointer">
            <ArrowLeft className="w-3.5 h-3.5" />Dashboard
          </Link>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-4">
              <Package className="w-3.5 h-3.5 text-orange-500" />
              <span className="text-[10px] sm:text-xs font-semibold tracking-[0.15em] uppercase text-orange-400">
                Order History
              </span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-white">My Orders</h1>
            <p className="text-sm text-zinc-400 mt-2">
              {session?.user?.name ? `Welcome back, ${session.user.name.split(" ")[0]}. ` : ""}
              {orders.length > 0 ? `${orders.length} order${orders.length !== 1 ? "s" : ""} placed` : "No orders yet"}
            </p>
          </motion.div>
        </div>
      </section>

      <div className="divider-gradient" />

      {paymentResult && (
        <div className="container-wide max-w-4xl pt-8">
          <div
            role="status"
            className={cn(
              "rounded-xl border px-5 py-4 text-sm",
              paymentResult === "success"
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                : "border-red-500/30 bg-red-500/10 text-red-200"
            )}
          >
            {paymentResult === "success"
              ? `Payment verified${paymentReference ? ` for ${paymentReference}` : ""}. Your receipt has been queued for email delivery.`
              : "We could not verify that payment. No order was marked paid; please retry or contact support if your account was charged."}
          </div>
        </div>
      )}

      <section className="py-10 sm:py-14">
        <div className="container-wide max-w-4xl">
          {/* Filter tabs */}
          {orders.length > 0 && (
            <div className="flex items-center gap-1 mb-8 border-b border-zinc-800/60 overflow-x-auto pb-0">
              {[
                { id: "all", label: `All (${orders.length})` },
                { id: "active", label: "Active" },
                { id: "delivered", label: "Delivered" },
                { id: "cancelled", label: "Cancelled" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilter(tab.id as typeof filter)}
                  className={cn(
                    "px-4 py-3 text-sm font-semibold transition-all relative whitespace-nowrap cursor-pointer",
                    filter === tab.id ? "text-orange-500" : "text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  {tab.label}
                  {filter === tab.id && (
                    <motion.div layoutId="orders-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500" transition={{ type: "spring", bounce: 0.2, duration: 0.5 }} />
                  )}
                </button>
              ))}
            </div>
          )}

          {error ? (
            <div className="text-center py-20">
              <AlertTriangle className="w-10 h-10 text-zinc-600 mx-auto mb-4" />
              <p className="text-white font-medium mb-2">Failed to load orders</p>
              <p className="text-sm text-zinc-500 mb-6">{error}</p>
              <Button variant="outline" onClick={() => window.location.reload()}>Try again</Button>
            </div>
          ) : orders.length === 0 ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-24">
              <div className="w-20 h-20 rounded-2xl bg-zinc-800/40 border border-zinc-800/60 flex items-center justify-center mx-auto mb-6">
                <ShoppingBag className="w-9 h-9 text-zinc-700" />
              </div>
              <h2 className="text-xl font-bold text-white font-display mb-2">No orders yet</h2>
              <p className="text-sm text-zinc-500 mb-8 max-w-sm mx-auto">
                When you place an order it will appear here with full tracking details.
              </p>
              <Button asChild className="cursor-pointer">
                <Link href="/store"><ShoppingBag className="w-4 h-4" />Start Shopping</Link>
              </Button>
            </motion.div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-zinc-500 text-sm">No orders match this filter.</p>
              <button onClick={() => setFilter("all")} className="text-orange-500 text-sm mt-2 hover:text-orange-400 transition-colors cursor-pointer">
                View all orders →
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {filtered.map((order, i) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -16 }}
                    transition={{ duration: 0.3, delay: i * 0.04 }}
                  >
                    <OrderCard order={order} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Shop more CTA */}
          {orders.length > 0 && (
            <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800/50">
              <div>
                <p className="text-sm font-bold text-white mb-0.5">Need anything else?</p>
                <p className="text-xs text-zinc-500">Browse our full catalogue of TIMN products.</p>
              </div>
              <Button asChild variant="outline" className="border-zinc-700 cursor-pointer shrink-0">
                <Link href="/store">
                  <ShoppingBag className="w-4 h-4" />Browse Store
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </Button>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
