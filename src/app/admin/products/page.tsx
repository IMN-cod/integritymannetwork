"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ShoppingBag,
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  X,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  isActive: boolean;
  isFeatured: boolean;
  createdAt: string;
  category: { name: string } | null;
  _count: { orderItems: number };
}

interface Pagination { page: number; limit: number; total: number; pages: number; }

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, pages: 0 });
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formComparePrice, setFormComparePrice] = useState("");
  const [formSku, setFormSku] = useState("");
  const [formStock, setFormStock] = useState("0");
  const [formIsActive, setFormIsActive] = useState(true);

  const fetchProducts = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (searchQuery) params.set("search", searchQuery);
      const res = await fetch(`/api/admin/products?${params}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setProducts(data.products);
      setPagination(data.pagination);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const openCreate = () => {
    setEditingProduct(null);
    setFormName(""); setFormDescription(""); setFormPrice("");
    setFormComparePrice(""); setFormSku(""); setFormStock("0"); setFormIsActive(true);
    setShowModal(true);
  };

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    setFormName(product.name);
    setFormDescription("");
    setFormPrice(String(Number(product.price)));
    setFormComparePrice(product.comparePrice ? String(Number(product.comparePrice)) : "");
    setFormSku(product.sku || "");
    setFormStock(String(product.stock));
    setFormIsActive(product.isActive);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const body = {
        ...(editingProduct && { id: editingProduct.id }),
        name: formName,
        ...(formDescription && { description: formDescription }),
        price: parseFloat(formPrice),
        ...(formComparePrice && { comparePrice: parseFloat(formComparePrice) }),
        ...(formSku && { sku: formSku }),
        stock: parseInt(formStock) || 0,
        isActive: formIsActive,
      };
      const res = await fetch("/api/admin/products", {
        method: editingProduct ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      setShowModal(false);
      await fetchProducts(pagination.page);
    } catch {
      alert("Failed to save product");
    } finally {
      setFormLoading(false);
    }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm("Delete this product permanently?")) return;
    try {
      const res = await fetch("/api/admin/products", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error();
      await fetchProducts(pagination.page);
    } catch {
      alert("Failed to delete product");
    }
  };

  const toggleActive = async (product: Product) => {
    try {
      await fetch("/api/admin/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: product.id, isActive: !product.isActive }),
      });
      await fetchProducts(pagination.page);
    } catch {
      alert("Failed to update product");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-display">Products</h1>
          <p className="text-sm text-gray-500 mt-1">Manage store inventory, pricing, and categories.</p>
        </div>
        <Button onClick={openCreate}><Plus className="w-4 h-4" />Add Product</Button>
      </div>

      <Card variant="admin">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input variant="admin" placeholder="Search products..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
            </div>
            <Button variant="outline" size="sm" onClick={() => fetchProducts()}><RefreshCw className="w-3.5 h-3.5" /></Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 text-orange-500 animate-spin" /></div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sales</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {products.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
                              <ShoppingBag className="w-4 h-4 text-gray-400" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{product.name}</p>
                              {product.sku && <p className="text-[10px] text-gray-400">SKU: {product.sku}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">{product.category?.name || ""}</td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-900 font-medium">{formatCurrency(Number(product.price))}</p>
                          {product.comparePrice && (
                            <p className="text-[10px] text-gray-400 line-through">{formatCurrency(Number(product.comparePrice))}</p>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-sm font-medium ${product.stock === 0 ? "text-red-400" : product.stock < 10 ? "text-yellow-400" : "text-gray-700"}`}>
                            {product.stock}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button onClick={() => toggleActive(product)}>
                            <Badge variant={product.isActive ? "success" : "destructive"}>
                              {product.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </button>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">{product._count.orderItems}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <a href={`/store/${product.slug}`} target="_blank" rel="noopener noreferrer">
                              <Button variant="ghost" size="icon"><Eye className="w-4 h-4" /></Button>
                            </a>
                            <Button variant="ghost" size="icon" onClick={() => openEdit(product)}><Edit className="w-4 h-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => deleteProduct(product.id)}><Trash2 className="w-4 h-4 text-red-400" /></Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {products.length === 0 && (
                <div className="text-center py-12"><ShoppingBag className="w-10 h-10 text-gray-300 mx-auto mb-3" /><p className="text-sm text-gray-500">No products found.</p></div>
              )}

              {pagination.pages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500">Page {pagination.page} of {pagination.pages}</p>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" disabled={pagination.page <= 1} onClick={() => fetchProducts(pagination.page - 1)}><ChevronLeft className="w-4 h-4" /></Button>
                    <Button variant="outline" size="sm" disabled={pagination.page >= pagination.pages} onClick={() => fetchProducts(pagination.page + 1)}><ChevronRight className="w-4 h-4" /></Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative w-full max-w-xl bg-white border border-gray-200 rounded-xl shadow-xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900 font-display">{editingProduct ? "Edit Product" : "New Product"}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-900"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-500 mb-1.5">Name</label>
                <Input variant="admin" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Product name..." required />
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1.5">Description</label>
                <Textarea variant="admin" value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="Product description..." rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-500 mb-1.5">Price</label>
                  <Input variant="admin" type="number" step="0.01" value={formPrice} onChange={(e) => setFormPrice(e.target.value)} placeholder="0.00" required />
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1.5">Compare Price</label>
                  <Input variant="admin" type="number" step="0.01" value={formComparePrice} onChange={(e) => setFormComparePrice(e.target.value)} placeholder="Optional" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-500 mb-1.5">SKU</label>
                  <Input variant="admin" value={formSku} onChange={(e) => setFormSku(e.target.value)} placeholder="Optional" />
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1.5">Stock</label>
                  <Input variant="admin" type="number" value={formStock} onChange={(e) => setFormStock(e.target.value)} />
                </div>
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={formIsActive} onChange={(e) => setFormIsActive(e.target.checked)} className="w-4 h-4 rounded bg-white border-gray-300 text-orange-500" />
                <span className="text-sm text-gray-700">Active (visible in store)</span>
              </label>
              <div className="flex items-center gap-3 pt-2">
                <Button type="submit" disabled={formLoading}>
                  {formLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingProduct ? "Update Product" : "Create Product"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
