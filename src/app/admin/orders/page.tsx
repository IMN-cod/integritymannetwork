"use client";

/* eslint-disable @next/next/no-img-element */

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Package, Search, Loader2, ChevronLeft, ChevronRight, RefreshCw,
  Truck, DollarSign, Clock, CheckCircle2, XCircle, ArrowLeft,
  X, CreditCard, ShoppingBag, User, MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";

interface OrderItem {
  id: string;
  productName: string;
  price: number;
  quantity: number;
  variantInfo: string | null;
  product: { name: string; images: string[] };
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  subtotal: number;
  tax: number;
  shippingCost: number;
  total: number;
  trackingNumber: string | null;
  trackingUrl: string | null;
  notes: string | null;
  customerEmail: string | null;
  shippingAddress: Record<string, string> | null;
  createdAt: string;
  updatedAt: string;
  user: { firstName: string | null; lastName: string | null; email: string; avatar: string | null };
  items: OrderItem[];
}

interface Stats {
  total: number;
  pending: number;
  processing: number;
  shipped: number;
  delivered: number;
  paid: number;
  revenue: number;
}

const STATUS_COLORS: Record<string, { variant: "success" | "warning" | "destructive" | "secondary" | "default"; icon: typeof CheckCircle2 }> = {
  PENDING: { variant: "warning", icon: Clock },
  CONFIRMED: { variant: "default", icon: CheckCircle2 },
  PROCESSING: { variant: "default", icon: Package },
  SHIPPED: { variant: "success", icon: Truck },
  DELIVERED: { variant: "success", icon: CheckCircle2 },
  CANCELLED: { variant: "destructive", icon: XCircle },
  REFUNDED: { variant: "secondary", icon: DollarSign },
};

const PAYMENT_STATUS_COLORS: Record<string, "success" | "warning" | "destructive"> = {
  PENDING: "warning",
  PAID: "success",
  FAILED: "destructive",
  REFUNDED: "destructive",
};

const ORDER_STATUSES = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, processing: 0, shipped: 0, delivered: 0, paid: 0, revenue: 0 });
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updatingOrder, setUpdatingOrder] = useState(false);

  const fetchOrders = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (searchQuery) params.set("search", searchQuery);
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/admin/orders?${params}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setOrders(data.orders);
      setPagination(data.pagination);
      setStats(data.stats);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const updateOrderStatus = async (orderId: string, status: string) => {
    setUpdatingOrder(true);
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: orderId, status }),
      });
      if (!res.ok) throw new Error();
      const { order } = await res.json();
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: order.status } : o)));
      if (selectedOrder?.id === orderId) {
        setSelectedOrder((prev) => prev ? { ...prev, status: order.status } : null);
      }
      await fetchOrders(pagination.page);
    } catch {
      alert("Failed to update order");
    } finally {
      setUpdatingOrder(false);
    }
  };

  const updatePaymentStatus = async (orderId: string, paymentStatus: string) => {
    setUpdatingOrder(true);
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: orderId, paymentStatus }),
      });
      if (!res.ok) throw new Error();
      await fetchOrders(pagination.page);
      if (selectedOrder?.id === orderId) {
        setSelectedOrder((prev) => prev ? { ...prev, paymentStatus } : null);
      }
    } catch {
      alert("Failed to update payment status");
    } finally {
      setUpdatingOrder(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/products">
            <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4" /></Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 font-display">Orders</h1>
            <p className="text-sm text-gray-500 mt-1">Track and manage customer orders.</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => fetchOrders()}>
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Orders", value: stats.total, icon: Package, color: "text-blue-500", bg: "bg-blue-50" },
          { label: "Pending", value: stats.pending, icon: Clock, color: "text-amber-500", bg: "bg-amber-50" },
          { label: "Shipped", value: stats.shipped, icon: Truck, color: "text-emerald-500", bg: "bg-emerald-50" },
          { label: "Revenue", value: formatCurrency(stats.revenue), icon: DollarSign, color: "text-orange-500", bg: "bg-orange-50" },
        ].map((stat) => (
          <Card key={stat.label} variant="admin">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Orders List */}
        <div className="lg:col-span-2">
          <Card variant="admin">
            <CardHeader className="pb-0">
              {/* Status tabs */}
              <div className="flex items-center gap-1 border-b border-gray-100 -mx-6 px-6 mb-4 overflow-x-auto">
                <button
                  onClick={() => setStatusFilter("")}
                  className={`px-3 py-2.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
                    !statusFilter ? "border-orange-500 text-orange-600" : "border-transparent text-gray-400 hover:text-gray-600"
                  }`}
                >
                  All
                </button>
                {ORDER_STATUSES.map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`px-3 py-2.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
                      statusFilter === s ? "border-orange-500 text-orange-600" : "border-transparent text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    {s.charAt(0) + s.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    variant="admin"
                    placeholder="Search by order #, customer..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0 mt-4">
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-16">
                  <Package className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm font-medium text-gray-900">No orders found</p>
                  <p className="text-xs text-gray-500 mt-1">Orders will appear here when customers make purchases.</p>
                </div>
              ) : (
                <>
                  <div className="divide-y divide-gray-50">
                    {orders.map((order) => {
                      const statusInfo = STATUS_COLORS[order.status] || { variant: "secondary" as const, icon: Package };
                      const StatusIcon = statusInfo.icon;
                      return (
                        <button
                          key={order.id}
                          onClick={() => setSelectedOrder(order)}
                          className={`w-full text-left px-6 py-4 hover:bg-gray-50/50 transition-colors ${
                            selectedOrder?.id === order.id ? "bg-orange-50/40 border-l-2 border-l-orange-500" : ""
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                                <StatusIcon className={`w-4 h-4 ${
                                  statusInfo.variant === "success" ? "text-emerald-500" :
                                  statusInfo.variant === "warning" ? "text-amber-500" :
                                  statusInfo.variant === "destructive" ? "text-red-500" :
                                  "text-gray-400"
                                }`} />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-semibold text-gray-900 font-mono">
                                    {order.orderNumber}
                                  </p>
                                  <Badge variant={statusInfo.variant} className="text-[9px] px-1.5 py-0">
                                    {order.status}
                                  </Badge>
                                </div>
                                <p className="text-xs text-gray-500 mt-0.5">
                                  {order.user.firstName} {order.user.lastName} · {formatDate(order.createdAt)}
                                </p>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-sm font-bold text-gray-900">
                                {formatCurrency(Number(order.total))}
                              </p>
                              <p className="text-[10px] text-gray-400">
                                {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {pagination.pages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
                      <p className="text-xs text-gray-500">
                        Page {pagination.page} of {pagination.pages}
                      </p>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" disabled={pagination.page <= 1} onClick={() => fetchOrders(pagination.page - 1)}>
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm" disabled={pagination.page >= pagination.pages} onClick={() => fetchOrders(pagination.page + 1)}>
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Order Detail Panel */}
        <div>
          {selectedOrder ? (
            <div className="space-y-4 sticky top-24">
              <Card variant="admin">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-gray-900 font-mono">{selectedOrder.orderNumber}</h3>
                    <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-gray-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Status management */}
                  <div className="space-y-3 mb-5">
                    <div>
                      <label className="block text-[11px] font-medium text-gray-500 mb-1.5">Order Status</label>
                      <select
                        value={selectedOrder.status}
                        onChange={(e) => updateOrderStatus(selectedOrder.id, e.target.value)}
                        disabled={updatingOrder}
                        className="w-full h-9 px-3 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none disabled:opacity-50"
                      >
                        {ORDER_STATUSES.map((s) => (
                          <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-gray-500 mb-1.5">Payment Status</label>
                      <select
                        value={selectedOrder.paymentStatus}
                        onChange={(e) => updatePaymentStatus(selectedOrder.id, e.target.value)}
                        disabled={updatingOrder}
                        className="w-full h-9 px-3 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none disabled:opacity-50"
                      >
                        {["PENDING", "PAID", "FAILED", "REFUNDED"].map((s) => (
                          <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Customer */}
                  <div className="p-3 rounded-lg bg-gray-50 border border-gray-100 mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-xs font-medium text-gray-700">Customer</span>
                    </div>
                    <p className="text-sm text-gray-900">
                      {selectedOrder.user.firstName} {selectedOrder.user.lastName}
                    </p>
                    <p className="text-xs text-gray-500">{selectedOrder.user.email}</p>
                  </div>

                  {/* Payment */}
                  <div className="p-3 rounded-lg bg-gray-50 border border-gray-100 mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CreditCard className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-xs font-medium text-gray-700">Payment</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">{selectedOrder.paymentMethod}</span>
                      <Badge variant={PAYMENT_STATUS_COLORS[selectedOrder.paymentStatus] || "warning"} className="text-[9px]">
                        {selectedOrder.paymentStatus}
                      </Badge>
                    </div>
                  </div>

                  {/* Shipping address */}
                  {selectedOrder.shippingAddress && (
                    <div className="p-3 rounded-lg bg-gray-50 border border-gray-100 mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-xs font-medium text-gray-700">Shipping Address</span>
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        {selectedOrder.shippingAddress.address}<br />
                        {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.region}<br />
                        {selectedOrder.shippingAddress.country}
                      </p>
                    </div>
                  )}

                  {/* Items */}
                  <div className="mt-4">
                    <h4 className="text-xs font-medium text-gray-500 mb-3">
                      Items ({selectedOrder.items.length})
                    </h4>
                    <div className="space-y-2">
                      {selectedOrder.items.map((item) => (
                        <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50">
                          <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0 overflow-hidden">
                            {item.product?.images?.[0] ? (
                              <img src={item.product.images[0]} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <ShoppingBag className="w-3.5 h-3.5 text-gray-300" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-900 truncate">{item.productName}</p>
                            {item.variantInfo && (
                              <p className="text-[10px] text-gray-400">{item.variantInfo}</p>
                            )}
                            <p className="text-[10px] text-gray-500">
                              {formatCurrency(Number(item.price))} × {item.quantity}
                            </p>
                          </div>
                          <p className="text-xs font-semibold text-gray-900">
                            {formatCurrency(Number(item.price) * item.quantity)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Totals */}
                  <div className="mt-4 pt-4 border-t border-gray-100 space-y-1.5">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Subtotal</span>
                      <span>{formatCurrency(Number(selectedOrder.subtotal))}</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Shipping</span>
                      <span>{formatCurrency(Number(selectedOrder.shippingCost))}</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Tax</span>
                      <span>{formatCurrency(Number(selectedOrder.tax))}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold text-gray-900 pt-2 border-t border-gray-100">
                      <span>Total</span>
                      <span>{formatCurrency(Number(selectedOrder.total))}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card variant="admin">
              <CardContent className="p-8 text-center">
                <Package className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="text-sm text-gray-500">Select an order to view details</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
