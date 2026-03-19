"use client";

/* eslint-disable @next/next/no-img-element */

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ShoppingBag, Search, Plus, Eye, Edit, Trash2, Loader2,
  ChevronLeft, ChevronRight, RefreshCw, Star, ArrowUpDown,
  CheckSquare, Square, MoreHorizontal, TrendingUp, Package,
  DollarSign, AlertTriangle, ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice: number | null;
  images: string[];
  sku: string | null;
  stock: number;
  lowStockAlert: number;
  isActive: boolean;
  isFeatured: boolean;
  isDigital: boolean;
  badge: string | null;
  tags: string[];
  salesCount: number;
  viewCount: number;
  createdAt: string;
  category: { id: string; name: string; slug: string } | null;
  _count: { orderItems: number; variants: number };
}

interface Stats {
  total: number;
  active: number;
  lowStock: number;
  featured: number;
  totalSales: number;
  totalRevenue: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

type StatusFilter = "all" | "active" | "inactive" | "featured" | "low-stock";
type SortOption = "newest" | "name" | "price-asc" | "price-desc" | "stock" | "sales";

const STATUS_TABS: { id: StatusFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "inactive", label: "Inactive" },
  { id: "featured", label: "Featured" },
  { id: "low-stock", label: "Low Stock" },
];

const SORT_OPTIONS: { id: SortOption; label: string }[] = [
  { id: "newest", label: "Newest First" },
  { id: "name", label: "Name (A-Z)" },
  { id: "price-asc", label: "Price: Low → High" },
  { id: "price-desc", label: "Price: High → Low" },
  { id: "stock", label: "Stock: Low → High" },
  { id: "sales", label: "Best Selling" },
];

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, lowStock: 0, featured: 0, totalSales: 0, totalRevenue: 0 });
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, pages: 0 });
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showBulkMenu, setShowBulkMenu] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);

  const fetchProducts = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: "20",
          status: statusFilter,
          sortBy,
        });
        if (searchQuery) params.set("search", searchQuery);
        const res = await fetch(`/api/admin/products?${params}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        setProducts(data.products);
        setPagination(data.pagination);
        setStats(data.stats);
      } catch {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    },
    [searchQuery, statusFilter, sortBy]
  );

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Selection helpers
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === products.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(products.map((p) => p.id)));
    }
  };

  // Bulk actions
  const handleBulkAction = async (action: string) => {
    if (selectedIds.size === 0) return;
    const confirmMsg =
      action === "delete"
        ? `Delete ${selectedIds.size} products permanently?`
        : `${action} ${selectedIds.size} products?`;
    if (!confirm(confirmMsg)) return;
    setBulkLoading(true);
    try {
      const res = await fetch("/api/admin/products/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, productIds: Array.from(selectedIds) }),
      });
      if (!res.ok) throw new Error();
      setSelectedIds(new Set());
      setShowBulkMenu(false);
      await fetchProducts(pagination.page);
    } catch {
      alert("Bulk action failed");
    } finally {
      setBulkLoading(false);
    }
  };

  // Quick toggle
  const toggleActive = async (product: Product) => {
    try {
      await fetch(`/api/admin/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !product.isActive }),
      });
      await fetchProducts(pagination.page);
    } catch {
      alert("Failed to update product");
    }
  };

  const toggleFeatured = async (product: Product) => {
    try {
      await fetch(`/api/admin/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFeatured: !product.isFeatured }),
      });
      await fetchProducts(pagination.page);
    } catch {
      alert("Failed to update product");
    }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm("Delete this product permanently?")) return;
    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      await fetchProducts(pagination.page);
    } catch {
      alert("Failed to delete product");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-display">Products</h1>
          <p className="text-sm text-gray-500 mt-1">Manage store inventory, pricing, and categories.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/orders">
            <Button variant="outline" size="sm">
              <Package className="w-3.5 h-3.5" />
              Orders
            </Button>
          </Link>
          <Link href="/admin/products/new">
            <Button>
              <Plus className="w-4 h-4" />
              Add Product
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Products", value: stats.total, icon: ShoppingBag, color: "text-blue-500", bg: "bg-blue-50" },
          { label: "Active", value: stats.active, icon: Package, color: "text-emerald-500", bg: "bg-emerald-50" },
          { label: "Low Stock", value: stats.lowStock, icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-50" },
          { label: "Revenue", value: formatCurrency(stats.totalRevenue), icon: DollarSign, color: "text-orange-500", bg: "bg-orange-50" },
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

      {/* Filters & Table */}
      <Card variant="admin">
        <CardHeader className="pb-0">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 border-b border-gray-100 -mx-6 px-6 mb-4">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setStatusFilter(tab.id); setSelectedIds(new Set()); }}
                className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-all ${
                  statusFilter === tab.id
                    ? "border-orange-500 text-orange-600"
                    : "border-transparent text-gray-400 hover:text-gray-600"
                }`}
              >
                {tab.label}
                {tab.id === "low-stock" && stats.lowStock > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-600 text-[9px] font-bold">
                    {stats.lowStock}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Search & Actions Row */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                variant="admin"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex items-center gap-2 ml-auto">
              {/* Bulk actions */}
              {selectedIds.size > 0 && (
                <div className="relative">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowBulkMenu(!showBulkMenu)}
                    disabled={bulkLoading}
                  >
                    {bulkLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <MoreHorizontal className="w-3.5 h-3.5" />
                    )}
                    {selectedIds.size} selected
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                  {showBulkMenu && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowBulkMenu(false)} />
                      <div className="absolute right-0 top-full mt-1 z-50 w-44 rounded-xl border border-gray-200 bg-white shadow-xl overflow-hidden">
                        {[
                          { action: "activate", label: "Activate" },
                          { action: "deactivate", label: "Deactivate" },
                          { action: "feature", label: "Feature" },
                          { action: "unfeature", label: "Unfeature" },
                          { action: "delete", label: "Delete", danger: true },
                        ].map((item) => (
                          <button
                            key={item.action}
                            onClick={() => handleBulkAction(item.action)}
                            className={`w-full text-left px-4 py-2.5 text-xs font-medium transition-colors ${
                              "danger" in item && item.danger
                                ? "text-red-500 hover:bg-red-50"
                                : "text-gray-600 hover:bg-gray-50"
                            }`}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Sort */}
              <div className="relative">
                <Button variant="outline" size="sm" onClick={() => setShowSortMenu(!showSortMenu)}>
                  <ArrowUpDown className="w-3.5 h-3.5" />
                  Sort
                  <ChevronDown className="w-3 h-3" />
                </Button>
                {showSortMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowSortMenu(false)} />
                    <div className="absolute right-0 top-full mt-1 z-50 w-48 rounded-xl border border-gray-200 bg-white shadow-xl overflow-hidden">
                      {SORT_OPTIONS.map((option) => (
                        <button
                          key={option.id}
                          onClick={() => { setSortBy(option.id); setShowSortMenu(false); }}
                          className={`w-full text-left px-4 py-2.5 text-xs font-medium transition-colors ${
                            sortBy === option.id
                              ? "text-orange-500 bg-orange-50"
                              : "text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <Button variant="outline" size="sm" onClick={() => fetchProducts()}>
                <RefreshCw className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0 mt-4">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-y border-gray-100 bg-gray-50/50">
                      <th className="px-4 py-3 w-10">
                        <button onClick={toggleSelectAll} className="text-gray-400 hover:text-gray-600">
                          {selectedIds.size === products.length && products.length > 0 ? (
                            <CheckSquare className="w-4 h-4 text-orange-500" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </th>
                      <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Product</th>
                      <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Category</th>
                      <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Price</th>
                      <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Stock</th>
                      <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Status</th>
                      <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Sales</th>
                      <th className="px-4 py-3 text-right text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {products.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="px-4 py-3">
                          <button onClick={() => toggleSelect(product.id)} className="text-gray-400 hover:text-gray-600">
                            {selectedIds.has(product.id) ? (
                              <CheckSquare className="w-4 h-4 text-orange-500" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0 overflow-hidden">
                              {product.images?.[0] ? (
                                <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <ShoppingBag className="w-4 h-4 text-gray-400" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <Link
                                  href={`/admin/products/${product.id}/edit`}
                                  className="text-sm font-medium text-gray-900 hover:text-orange-500 transition-colors truncate"
                                >
                                  {product.name}
                                </Link>
                                {product.isFeatured && (
                                  <Star className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                {product.sku && (
                                  <span className="text-[10px] text-gray-400 font-mono">
                                    SKU: {product.sku}
                                  </span>
                                )}
                                {product.badge && (
                                  <span className="text-[9px] font-bold text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded">
                                    {product.badge}
                                  </span>
                                )}
                                {product._count.variants > 0 && (
                                  <span className="text-[9px] text-gray-400">
                                    {product._count.variants} variants
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          {product.category ? (
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">
                              {product.category.name}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-300">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-semibold text-gray-900">
                            {formatCurrency(Number(product.price))}
                          </p>
                          {product.comparePrice && (
                            <p className="text-[10px] text-gray-400 line-through">
                              {formatCurrency(Number(product.comparePrice))}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <span
                            className={`text-sm font-medium ${
                              product.stock === 0
                                ? "text-red-500"
                                : product.stock <= product.lowStockAlert
                                  ? "text-amber-500"
                                  : "text-gray-700"
                            }`}
                          >
                            {product.isDigital ? "∞" : product.stock}
                          </span>
                          {!product.isDigital && product.stock > 0 && product.stock <= product.lowStockAlert && (
                            <p className="text-[9px] text-amber-500 font-medium">Low stock</p>
                          )}
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <button onClick={() => toggleActive(product)}>
                            <Badge variant={product.isActive ? "success" : "destructive"} className="text-[10px] cursor-pointer">
                              {product.isActive ? "Active" : "Draft"}
                            </Badge>
                          </button>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <div className="flex items-center gap-1.5 text-sm text-gray-500">
                            <TrendingUp className="w-3 h-3" />
                            <span>{product.salesCount || product._count.orderItems}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => toggleFeatured(product)}
                              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                              title={product.isFeatured ? "Unfeature" : "Feature"}
                            >
                              <Star
                                className={`w-3.5 h-3.5 ${
                                  product.isFeatured
                                    ? "text-amber-500 fill-amber-500"
                                    : "text-gray-400"
                                }`}
                              />
                            </button>
                            <a
                              href={`/store/${product.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5 text-gray-400" />
                            </a>
                            <Link
                              href={`/admin/products/${product.id}/edit`}
                              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                              <Edit className="w-3.5 h-3.5 text-gray-400" />
                            </Link>
                            <button
                              onClick={() => deleteProduct(product.id)}
                              className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-red-400" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {products.length === 0 && (
                <div className="text-center py-16">
                  <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                    <ShoppingBag className="w-6 h-6 text-gray-300" />
                  </div>
                  <p className="text-sm font-medium text-gray-900 mb-1">No products found</p>
                  <p className="text-xs text-gray-500 mb-4">
                    {searchQuery
                      ? "Try a different search term."
                      : "Get started by adding your first product."}
                  </p>
                  {!searchQuery && (
                    <Link href="/admin/products/new">
                      <Button size="sm">
                        <Plus className="w-4 h-4" />
                        Add Product
                      </Button>
                    </Link>
                  )}
                </div>
              )}

              {pagination.pages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
                  <p className="text-xs text-gray-500">
                    Showing {(pagination.page - 1) * pagination.limit + 1}–
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
                    {pagination.total}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page <= 1}
                      onClick={() => fetchProducts(pagination.page - 1)}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-xs text-gray-500 font-medium">
                      {pagination.page} / {pagination.pages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page >= pagination.pages}
                      onClick={() => fetchProducts(pagination.page + 1)}
                    >
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
  );
}
