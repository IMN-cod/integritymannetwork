"use client";

/* eslint-disable @next/next/no-img-element */

import { useState, useEffect, useCallback } from "react";
import {
  Package, Search, Loader2, ChevronLeft, ChevronRight, RefreshCw,
  Truck, DollarSign, Clock, CheckCircle2, XCircle,
  X, CreditCard, ShoppingBag, User, MapPin, ShieldCheck,
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
  paymentId?: string | null;
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

const STATUS_COLORS: Record<string, { variant: "success" | "warning" | "destructive" | "secondary" | "default"; icon: typeof CheckCircle2; color: string }> = {
  PENDING: { variant: "warning", icon: Clock, color: "text-amber-500" },
  CONFIRMED: { variant: "default", icon: CheckCircle2, color: "text-blue-500" },
  PROCESSING: { variant: "default", icon: Package, color: "text-blue-500" },
  SHIPPED: { variant: "success", icon: Truck, color: "text-emerald-500" },
  DELIVERED: { variant: "success", icon: CheckCircle2, color: "text-emerald-500" },
  CANCELLED: { variant: "destructive", icon: XCircle, color: "text-red-500" },
  REFUNDED: { variant: "secondary", icon: DollarSign, color: "text-gray-500" },
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-display">Orders</h1>
          <p className="text-sm text-gray-500 mt-1">Track and manage customer orders and payments.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => fetchOrders()}>
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card variant="admin" className="relative overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
                <p className="text-xs text-gray-400 mt-1">{stats.delivered} delivered</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Package className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="admin" className="relative overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(stats.revenue)}</p>
                <p className="text-xs text-gray-400 mt-1">{stats.paid} paid orders</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="admin" className="relative overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Pending</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.pending}</p>
                <p className="text-xs text-gray-400 mt-1">{stats.processing} processing</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                <Clock className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="admin" className="relative overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Shipped</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.shipped}</p>
                <p className="text-xs text-gray-400 mt-1">In transit</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-violet-500 to-violet-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                <Truck className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Orders List */}
        <div className={selectedOrder ? "lg:col-span-2" : "lg:col-span-3"}>
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
                  All ({stats.total})
                </button>
                {ORDER_STATUSES.map((s) => {
                  const count = s === "PENDING" ? stats.pending : s === "PROCESSING" ? stats.processing : s === "SHIPPED" ? stats.shipped : s === "DELIVERED" ? stats.delivered : undefined;
                  return (
                    <button
                      key={s}
                      onClick={() => setStatusFilter(s)}
                      className={`px-3 py-2.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
                        statusFilter === s ? "border-orange-500 text-orange-600" : "border-transparent text-gray-400 hover:text-gray-600"
                      }`}
                    >
                      {s.charAt(0) + s.slice(1).toLowerCase()}
                      {count !== undefined && count > 0 && (
                        <span className="ml-1.5 text-[10px] font-bold bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">{count}</span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    variant="admin"
                    placeholder="Search by order #, customer name or email..."
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
                  <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                    <Package className="w-7 h-7 text-gray-300" />
                  </div>
                  <p className="text-sm font-medium text-gray-900">No orders found</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {searchQuery || statusFilter ? "Try adjusting your filters." : "Orders will appear here when customers make purchases."}
                  </p>
                </div>
              ) : (
                <>
                  <div className="divide-y divide-gray-50">
                    {orders.map((order) => {
                      const statusInfo = STATUS_COLORS[order.status] || { variant: "secondary" as const, icon: Package, color: "text-gray-400" };
                      const StatusIcon = statusInfo.icon;
                      return (
                        <button
                          key={order.id}
                          onClick={() => setSelectedOrder(order)}
                          className={`w-full text-left px-6 py-4 hover:bg-orange-50/30 transition-colors ${
                            selectedOrder?.id === order.id ? "bg-orange-50/50 border-l-2 border-l-orange-500" : ""
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                statusInfo.variant === "success" ? "bg-emerald-50" :
                                statusInfo.variant === "warning" ? "bg-amber-50" :
                                statusInfo.variant === "destructive" ? "bg-red-50" :
                                "bg-gray-100"
                              }`}>
                                <StatusIcon className={`w-5 h-5 ${statusInfo.color}`} />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-bold text-gray-900 font-mono">{order.orderNumber}</p>
                                  <Badge variant={statusInfo.variant} className="text-[9px] px-1.5 py-0">{order.status}</Badge>
                                  <Badge variant={PAYMENT_STATUS_COLORS[order.paymentStatus] || "warning"} className="text-[9px] px-1.5 py-0">
                                    {order.paymentStatus}
                                  </Badge>
                                </div>
                                <p className="text-xs text-gray-500 mt-0.5">
                                  {order.user.firstName} {order.user.lastName} &middot; {formatDate(order.createdAt, { month: "short", day: "numeric" })}
                                </p>
                              </div>
                            </div>
                            <div className="text-right shrink-0 ml-3">
                              <p className="text-sm font-bold text-gray-900">{formatCurrency(Number(order.total))}</p>
                              <p className="text-[10px] text-gray-400 mt-0.5">
                                {order.items.length} item{order.items.length !== 1 ? "s" : ""} &middot; {order.paymentMethod}
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
                        Showing {(pagination.page - 1) * pagination.limit + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                      </p>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" disabled={pagination.page <= 1} onClick={() => fetchOrders(pagination.page - 1)}>
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <span className="text-xs text-gray-500 font-medium">{pagination.page} / {pagination.pages}</span>
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
        {selectedOrder ? (
          <div className="lg:col-span-1">
            <div className="space-y-4 sticky top-20">
              <Card variant="admin">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-gray-900 font-mono">{selectedOrder.orderNumber}</h3>
                    <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Amount Hero */}
                  <div className="text-center py-3 mb-4 rounded-xl bg-linear-to-br from-blue-50 to-indigo-50 border border-blue-100">
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(Number(selectedOrder.total))}</p>
                    <div className="flex items-center justify-center gap-2 mt-2">
                      <Badge variant={STATUS_COLORS[selectedOrder.status]?.variant || "secondary"} className="text-[10px]">
                        {selectedOrder.status}
                      </Badge>
                      <Badge variant={PAYMENT_STATUS_COLORS[selectedOrder.paymentStatus] || "warning"} className="text-[10px]">
                        {selectedOrder.paymentStatus}
                      </Badge>
                    </div>
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
                  <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 mb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Customer</span>
                    </div>
                    <p className="text-sm font-medium text-gray-900">{selectedOrder.user.firstName} {selectedOrder.user.lastName}</p>
                    <p className="text-xs text-gray-500">{selectedOrder.user.email}</p>
                  </div>

                  {/* Payment */}
                  <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 mb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <CreditCard className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Payment</span>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Method</span>
                        <Badge variant="outline" className="text-[10px]">{selectedOrder.paymentMethod}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Status</span>
                        <Badge variant={PAYMENT_STATUS_COLORS[selectedOrder.paymentStatus] || "warning"} className="text-[10px]">
                          {selectedOrder.paymentStatus}
                        </Badge>
                      </div>
                      {selectedOrder.paymentMethod === "PAYSTACK" && (
                        <div className="flex items-center gap-1.5 pt-1 text-xs text-orange-600">
                          <ShieldCheck className="w-3 h-3" />
                          <span className="font-medium">Paystack Payment</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Shipping address */}
                  {selectedOrder.shippingAddress && (
                    <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 mb-3">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Shipping Address</span>
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
                    <h4 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-3">
                      Items ({selectedOrder.items.length})
                    </h4>
                    <div className="space-y-2">
                      {selectedOrder.items.map((item) => (
                        <div key={item.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                          <div className="w-11 h-11 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0 overflow-hidden">
                            {item.product?.images?.[0] ? (
                              <img src={item.product.images[0]} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <ShoppingBag className="w-4 h-4 text-gray-300" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-900 truncate">{item.productName}</p>
                            {item.variantInfo && (
                              <p className="text-[10px] text-gray-400">{item.variantInfo}</p>
                            )}
                            <p className="text-[10px] text-gray-500">
                              {formatCurrency(Number(item.price))} &times; {item.quantity}
                            </p>
                          </div>
                          <p className="text-xs font-bold text-gray-900">
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
          </div>
        ) : !loading && orders.length > 0 && (
          <div className="lg:col-span-1 hidden lg:block">
            <Card variant="admin">
              <CardContent className="p-8 text-center">
                <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <Package className="w-7 h-7 text-gray-300" />
                </div>
                <p className="text-sm font-medium text-gray-900">Select an order</p>
                <p className="text-xs text-gray-500 mt-1">Click on an order to view its details</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
