"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  ArrowLeft, Save, Eye, Loader2, ImageIcon, X, Plus, Tag, DollarSign,
  Package, ShoppingBag, Star, Globe, Settings, AlertCircle,
  CheckCircle2, Layers, Barcode, Weight, Truck, Sparkles, Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { slugify, formatCurrency, cn } from "@/lib/utils";
import { MultiImageUpload } from "@/components/ui/ImageUpload";

const RichTextEditor = dynamic(
  () => import("@/components/admin/RichTextEditor"),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 rounded-xl bg-gray-50 border border-gray-200 animate-pulse flex items-center justify-center">
        <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
      </div>
    ),
  }
);

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Variant {
  name: string;
  value: string;
  price: number | null;
  stock: number;
  sku: string;
}

interface ProductData {
  id?: string;
  name: string;
  slug: string;
  description: string;
  summary: string;
  price: string;
  comparePrice: string;
  images: string[];
  categoryId: string;
  sku: string;
  stock: string;
  lowStockAlert: string;
  isActive: boolean;
  isFeatured: boolean;
  isDigital: boolean;
  weight: string;
  tags: string[];
  badge: string;
  metaTitle: string;
  metaDescription: string;
  variants: Variant[];
}

const INITIAL_PRODUCT: ProductData = {
  name: "",
  slug: "",
  description: "",
  summary: "",
  price: "",
  comparePrice: "",
  images: [],
  categoryId: "",
  sku: "",
  stock: "0",
  lowStockAlert: "5",
  isActive: true,
  isFeatured: false,
  isDigital: false,
  weight: "",
  tags: [],
  badge: "",
  metaTitle: "",
  metaDescription: "",
  variants: [],
};

const BADGE_OPTIONS = ["", "Bestseller", "New", "Limited", "Sale", "Popular", "Exclusive"];

export default function ProductEditor({ productId }: { productId?: string }) {
  const router = useRouter();
  const [product, setProduct] = useState<ProductData>(INITIAL_PRODUCT);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(!!productId);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">("idle");
  const [activeTab, setActiveTab] = useState<"general" | "inventory" | "seo" | "settings">("general");
  const [slugManual, setSlugManual] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [showCategoryInput, setShowCategoryInput] = useState(false);
  const [tagInput, setTagInput] = useState("");

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/products/categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories);
      }
    } catch {
      // ignore
    }
  }, []);

  // Fetch product if editing
  const fetchProduct = useCallback(async () => {
    if (!productId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/products/${productId}`);
      if (!res.ok) throw new Error();
      const { product: p } = await res.json();
      setProduct({
        id: p.id,
        name: p.name,
        slug: p.slug,
        description: p.description || "",
        summary: p.summary || "",
        price: String(Number(p.price)),
        comparePrice: p.comparePrice ? String(Number(p.comparePrice)) : "",
        images: p.images || [],
        categoryId: p.categoryId || "",
        sku: p.sku || "",
        stock: String(p.stock),
        lowStockAlert: String(p.lowStockAlert),
        isActive: p.isActive,
        isFeatured: p.isFeatured,
        isDigital: p.isDigital || false,
        weight: p.weight ? String(Number(p.weight)) : "",
        tags: p.tags || [],
        badge: p.badge || "",
        metaTitle: p.metaTitle || "",
        metaDescription: p.metaDescription || "",
        variants: (p.variants || []).map((v: { name: string; value: string; price: number | null; stock: number; sku: string | null }) => ({
          name: v.name,
          value: v.value,
          price: v.price ? Number(v.price) : null,
          stock: v.stock,
          sku: v.sku || "",
        })),
      });
      setSlugManual(true);
    } catch {
      alert("Failed to load product");
      router.push("/admin/products");
    } finally {
      setLoading(false);
    }
  }, [productId, router]);

  useEffect(() => {
    fetchCategories();
    fetchProduct();
  }, [fetchCategories, fetchProduct]);

  // ── Smart SEO Engine ──
  const generateSeoTitle = useCallback((): string => {
    const parts: string[] = [];
    if (product.name) parts.push(product.name);
    const cat = categories.find((c) => c.id === product.categoryId);
    if (cat) parts.push(cat.name);
    parts.push("TIMN Store");
    return parts.join(" | ").slice(0, 60);
  }, [product.name, product.categoryId, categories]);

  const generateSeoDescription = useCallback((): string => {
    const parts: string[] = [];
    if (product.summary) {
      parts.push(product.summary.slice(0, 110));
    } else if (product.name) {
      parts.push(`Shop ${product.name} at The Integrity Man Network Store.`);
    }
    if (product.price && parseFloat(product.price) > 0) {
      parts.push(`From ${formatCurrency(parseFloat(product.price))}.`);
    }
    const cat = categories.find((c) => c.id === product.categoryId);
    if (cat) parts.push(`Browse ${cat.name}.`);
    if (!product.isDigital) parts.push("Fast shipping across Ghana.");
    return parts.join(" ").slice(0, 160);
  }, [product.name, product.summary, product.price, product.categoryId, product.isDigital, categories]);

  const extractKeywords = useCallback((): string[] => {
    const kw = new Set<string>();
    if (product.name) {
      product.name
        .split(/[\s\-—]+/)
        .filter((w) => w.length > 3)
        .forEach((w) => kw.add(w.toLowerCase()));
    }
    product.tags.forEach((t) => kw.add(t.toLowerCase()));
    const cat = categories.find((c) => c.id === product.categoryId);
    if (cat) kw.add(cat.name.toLowerCase());
    kw.add("integrity man network");
    kw.add("timn store");
    return Array.from(kw).slice(0, 12);
  }, [product.name, product.tags, product.categoryId, categories]);

  const seoScore = useMemo(() => {
    const title = product.metaTitle || product.name;
    const desc = product.metaDescription || product.summary;
    const checks = [
      { label: "Custom meta title", ok: !!product.metaTitle, tip: "Set a custom title for search engines" },
      { label: "Title length (30–60)", ok: title.length >= 30 && title.length <= 60, tip: title.length < 30 ? "Too short — aim for 30+ chars" : title.length > 60 ? "May be truncated" : "Perfect" },
      { label: "Meta description set", ok: !!product.metaDescription, tip: "Custom descriptions improve CTR" },
      { label: "Description (100–160)", ok: (desc?.length || 0) >= 100 && (desc?.length || 0) <= 160, tip: (desc?.length || 0) < 100 ? "Too short — add detail" : (desc?.length || 0) > 160 ? "May be truncated" : "Perfect" },
      { label: "Product images", ok: product.images.length > 0, tip: "Images improve rankings" },
      { label: "3+ images", ok: product.images.length >= 3, tip: "Multiple angles help buyers" },
      { label: "Summary filled in", ok: !!product.summary && product.summary.length > 20, tip: "Used in cards & previews" },
      { label: "Rich description", ok: !!product.description && product.description.length > 50, tip: "Detailed content ranks higher" },
      { label: "Category assigned", ok: !!product.categoryId, tip: "Improves navigation & structure" },
      { label: "Tags added (2+)", ok: product.tags.length >= 2, tip: "Improves discoverability" },
      { label: "Price set", ok: !!product.price && parseFloat(product.price) > 0, tip: "Helps search rich results" },
      { label: "Clean URL slug", ok: !!product.slug && product.slug.length > 3 && !product.slug.includes("--"), tip: "Short descriptive URLs rank better" },
    ];
    const passed = checks.filter((c) => c.ok).length;
    const score = Math.round((passed / checks.length) * 100);
    return { score, checks };
  }, [product]);

  const autoFillSeo = () => {
    setProduct((prev) => ({
      ...prev,
      metaTitle: generateSeoTitle(),
      metaDescription: generateSeoDescription(),
    }));
  };

  // Auto-generate slug from name
  const handleNameChange = (name: string) => {
    setProduct((prev) => ({
      ...prev,
      name,
      ...(!slugManual && { slug: slugify(name) }),
    }));
  };

  const handleSlugChange = (slug: string) => {
    setSlugManual(true);
    setProduct((prev) => ({ ...prev, slug: slugify(slug) }));
  };

  // Save product
  const handleSave = async () => {
    if (!product.name || !product.price) {
      alert("Name and price are required");
      return;
    }
    setSaving(true);
    setSaveStatus("idle");
    try {
      const payload = {
        name: product.name,
        slug: product.slug,
        description: product.description || null,
        summary: product.summary || null,
        price: parseFloat(product.price),
        comparePrice: product.comparePrice ? parseFloat(product.comparePrice) : null,
        images: product.images,
        categoryId: product.categoryId || null,
        sku: product.sku || null,
        stock: parseInt(product.stock) || 0,
        lowStockAlert: parseInt(product.lowStockAlert) || 5,
        isActive: product.isActive,
        isFeatured: product.isFeatured,
        isDigital: product.isDigital,
        weight: product.weight ? parseFloat(product.weight) : null,
        tags: product.tags,
        badge: product.badge || null,
        metaTitle: product.metaTitle || generateSeoTitle(),
        metaDescription: product.metaDescription || generateSeoDescription(),
        variants: product.variants,
      };

      const url = product.id
        ? `/api/admin/products/${product.id}`
        : "/api/admin/products";
      const method = product.id ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save");
      }

      const data = await res.json();
      setSaveStatus("saved");

      if (!product.id) {
        // Redirect to edit page after creating
        router.push(`/admin/products/${data.product.id}/edit`);
      } else {
        setProduct((prev) => ({ ...prev, ...data.product }));
        setTimeout(() => setSaveStatus("idle"), 3000);
      }
    } catch (err) {
      setSaveStatus("error");
      alert(err instanceof Error ? err.message : "Failed to save product");
    } finally {
      setSaving(false);
    }
  };

  // Create inline category
  const createCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      const res = await fetch("/api/admin/products/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCategoryName.trim() }),
      });
      if (!res.ok) throw new Error();
      const { category } = await res.json();
      setCategories((prev) => [...prev, category]);
      setProduct((prev) => ({ ...prev, categoryId: category.id }));
      setNewCategoryName("");
      setShowCategoryInput(false);
    } catch {
      alert("Failed to create category");
    }
  };

  // Tag management
  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !product.tags.includes(tag)) {
      setProduct((prev) => ({ ...prev, tags: [...prev.tags, tag] }));
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setProduct((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tag) }));
  };

  // Variant management
  const addVariant = () => {
    setProduct((prev) => ({
      ...prev,
      variants: [...prev.variants, { name: "", value: "", price: null, stock: 0, sku: "" }],
    }));
  };

  const updateVariant = (index: number, field: keyof Variant, value: string | number | null) => {
    setProduct((prev) => ({
      ...prev,
      variants: prev.variants.map((v, i) =>
        i === index ? { ...v, [field]: value } : v
      ),
    }));
  };

  const removeVariant = (index: number) => {
    setProduct((prev) => ({ ...prev, variants: prev.variants.filter((_, i) => i !== index) }));
  };

  // Delete product
  const handleDelete = async () => {
    if (!product.id) return;
    if (!confirm("Are you sure you want to delete this product? This action cannot be undone.")) return;
    try {
      const res = await fetch(`/api/admin/products/${product.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      router.push("/admin/products");
    } catch {
      alert("Failed to delete product");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  const discount = product.price && product.comparePrice
    ? Math.round(((parseFloat(product.comparePrice) - parseFloat(product.price)) / parseFloat(product.comparePrice)) * 100)
    : null;

  return (
    <div className="min-h-screen">
      {/* ── Top Bar ── */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-200">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => router.push("/admin/products")}>
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div className="h-5 w-px bg-gray-200" />
            <h1 className="text-sm font-semibold text-gray-900">
              {product.id ? "Edit Product" : "New Product"}
            </h1>
            {saveStatus === "saved" && (
              <Badge variant="success" className="text-[10px] px-2 py-0.5">
                <CheckCircle2 className="w-3 h-3 mr-1" /> Saved
              </Badge>
            )}
            {saveStatus === "error" && (
              <Badge variant="destructive" className="text-[10px] px-2 py-0.5">
                <AlertCircle className="w-3 h-3 mr-1" /> Error
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {product.id && (
              <a href={`/store/${product.slug}`} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm">
                  <Eye className="w-3.5 h-3.5" />
                  Preview
                </Button>
              </a>
            )}
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              {saving ? "Saving..." : "Save Product"}
            </Button>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {/* ── LEFT COLUMN (2/3) ── */}
          <div className="lg:col-span-2 space-y-6">
            {/* Product Name & Slug */}
            <Card variant="admin">
              <CardContent className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Product Name</label>
                  <Input
                    variant="admin"
                    value={product.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Enter product name..."
                    className="text-lg font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Slug · <span className="text-blue-600 font-medium">/store/{product.slug || "..."}</span>
                  </label>
                  <Input
                    variant="admin"
                    value={product.slug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    placeholder="auto-generated-from-name"
                    className="text-xs font-mono"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Product Images */}
            <Card variant="admin">
              <CardContent className="p-6">
                <MultiImageUpload
                  value={product.images}
                  onChange={(urls) => setProduct((prev) => ({ ...prev, images: urls }))}
                  context="product"
                  label="Product Images"
                  maxFiles={8}
                />
              </CardContent>
            </Card>

            {/* Summary */}
            <Card variant="admin">
              <CardContent className="p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-gray-400" />
                  Short Summary
                </h3>
                <Textarea
                  variant="admin"
                  value={product.summary}
                  onChange={(e) => setProduct((prev) => ({ ...prev, summary: e.target.value }))}
                  placeholder="Brief product description for cards and listings..."
                  rows={3}
                  className="text-sm"
                />
                <p className="text-[10px] text-gray-400 mt-2">{product.summary.length}/300 characters</p>
              </CardContent>
            </Card>

            {/* Rich Text Description */}
            <Card variant="admin">
              <CardContent className="p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-gray-400" />
                  Full Description
                </h3>
                <RichTextEditor
                  content={product.description}
                  onChange={(html: string) =>
                    setProduct((prev) => ({ ...prev, description: html }))
                  }
                />
              </CardContent>
            </Card>

            {/* Variants */}
            <Card variant="admin">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-gray-400" />
                    Product Variants
                  </h3>
                  <Button variant="outline" size="sm" onClick={addVariant}>
                    <Plus className="w-3.5 h-3.5" />
                    Add Variant
                  </Button>
                </div>

                {product.variants.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-6">
                    No variants yet. Add variants like Size, Color, etc.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {product.variants.map((variant, index) => (
                      <div key={index} className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-gray-500">Variant {index + 1}</span>
                          <button onClick={() => removeVariant(index)} className="text-red-400 hover:text-red-500 transition-colors">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] text-gray-500 mb-1">Name (e.g., Size)</label>
                            <Input
                              variant="admin"
                              value={variant.name}
                              onChange={(e) => updateVariant(index, "name", e.target.value)}
                              placeholder="Size"
                              className="text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] text-gray-500 mb-1">Value (e.g., XL)</label>
                            <Input
                              variant="admin"
                              value={variant.value}
                              onChange={(e) => updateVariant(index, "value", e.target.value)}
                              placeholder="XL"
                              className="text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] text-gray-500 mb-1">Price Override</label>
                            <Input
                              variant="admin"
                              type="number"
                              step="0.01"
                              value={variant.price ?? ""}
                              onChange={(e) => updateVariant(index, "price", e.target.value ? parseFloat(e.target.value) : null)}
                              placeholder="Optional"
                              className="text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] text-gray-500 mb-1">Stock</label>
                            <Input
                              variant="admin"
                              type="number"
                              value={variant.stock}
                              onChange={(e) => updateVariant(index, "stock", parseInt(e.target.value) || 0)}
                              className="text-sm"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[11px] text-gray-500 mb-1">SKU</label>
                          <Input
                            variant="admin"
                            value={variant.sku}
                            onChange={(e) => updateVariant(index, "sku", e.target.value)}
                            placeholder="Optional variant SKU"
                            className="text-sm"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ── RIGHT SIDEBAR (1/3) ── */}
          <div className="space-y-6">
            {/* Status Quick Card */}
            <Card variant="admin">
              <CardContent className="p-5">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Status</span>
                    <Badge variant={product.isActive ? "success" : "destructive"}>
                      {product.isActive ? "Active" : "Draft"}
                    </Badge>
                  </div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={product.isActive}
                      onChange={(e) => setProduct((prev) => ({ ...prev, isActive: e.target.checked }))}
                      className="w-4 h-4 rounded bg-white border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Visible in store</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={product.isFeatured}
                      onChange={(e) => setProduct((prev) => ({ ...prev, isFeatured: e.target.checked }))}
                      className="w-4 h-4 rounded bg-white border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5 text-amber-500" />
                      <span className="text-sm text-gray-700">Featured product</span>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={product.isDigital}
                      onChange={(e) => setProduct((prev) => ({ ...prev, isDigital: e.target.checked }))}
                      className="w-4 h-4 rounded bg-white border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Digital product (no shipping)</span>
                  </label>
                </div>
              </CardContent>
            </Card>

            {/* Tabs */}
            <Card variant="admin">
              <CardContent className="p-0">
                <div className="flex border-b border-gray-200">
                  {(
                    [
                      { id: "general", label: "General", icon: Settings },
                      { id: "inventory", label: "Inventory", icon: Package },
                      { id: "seo", label: "SEO", icon: Globe },
                      { id: "settings", label: "More", icon: Sparkles },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-[11px] font-medium border-b-2 transition-all ${
                        activeTab === tab.id
                          ? "border-blue-600 text-blue-700"
                          : "border-transparent text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      <tab.icon className="w-3.5 h-3.5" />
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="p-5 space-y-4">
                  {/* ── GENERAL TAB ── */}
                  {activeTab === "general" && (
                    <>
                      {/* Pricing */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                          <DollarSign className="w-3.5 h-3.5 text-gray-400" />
                          Price (GHS)
                        </label>
                        <Input
                          variant="admin"
                          type="number"
                          step="0.01"
                          value={product.price}
                          onChange={(e) => setProduct((prev) => ({ ...prev, price: e.target.value }))}
                          placeholder="0.00"
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1.5">Compare-at Price</label>
                        <Input
                          variant="admin"
                          type="number"
                          step="0.01"
                          value={product.comparePrice}
                          onChange={(e) => setProduct((prev) => ({ ...prev, comparePrice: e.target.value }))}
                          placeholder="Original price (optional)"
                          className="text-sm"
                        />
                        {discount && discount > 0 && (
                          <p className="text-[10px] text-emerald-500 mt-1 font-medium">
                            {discount}% discount · Sale price: {product.price ? formatCurrency(parseFloat(product.price)) : "—"}
                          </p>
                        )}
                      </div>

                      {/* Category */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                          <Tag className="w-3.5 h-3.5 text-gray-400" />
                          Category
                        </label>
                        <select
                          value={product.categoryId}
                          onChange={(e) => setProduct((prev) => ({ ...prev, categoryId: e.target.value }))}
                          className="w-full h-10 px-3 rounded-lg border border-gray-300 bg-white text-sm text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                        >
                          <option value="">No category</option>
                          {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name}
                            </option>
                          ))}
                        </select>
                        {!showCategoryInput ? (
                          <button
                            onClick={() => setShowCategoryInput(true)}
                            className="text-[11px] text-blue-600 hover:text-blue-700 mt-1.5 font-semibold"
                          >
                            + Create new category
                          </button>
                        ) : (
                          <div className="flex gap-2 mt-2">
                            <Input
                              variant="admin"
                              value={newCategoryName}
                              onChange={(e) => setNewCategoryName(e.target.value)}
                              placeholder="Category name..."
                              className="text-xs"
                              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), createCategory())}
                            />
                            <Button size="sm" onClick={createCategory}>Add</Button>
                            <Button variant="ghost" size="sm" onClick={() => setShowCategoryInput(false)}>
                              <X className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* Badge */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-gray-400" />
                          Product Badge
                        </label>
                        <select
                          value={product.badge}
                          onChange={(e) => setProduct((prev) => ({ ...prev, badge: e.target.value }))}
                          className="w-full h-10 px-3 rounded-lg border border-gray-300 bg-white text-sm text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                        >
                          {BADGE_OPTIONS.map((b) => (
                            <option key={b} value={b}>
                              {b || "None"}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Tags */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1.5">Tags</label>
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {product.tags.map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-gray-100 text-xs text-gray-600"
                            >
                              {tag}
                              <button onClick={() => removeTag(tag)} className="hover:text-red-500">
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Input
                            variant="admin"
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            placeholder="Add tag..."
                            className="text-xs"
                            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                          />
                          <Button variant="outline" size="sm" onClick={addTag}>
                            <Plus className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </>
                  )}

                  {/* ── INVENTORY TAB ── */}
                  {activeTab === "inventory" && (
                    <>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                          <Barcode className="w-3.5 h-3.5 text-gray-400" />
                          SKU
                        </label>
                        <Input
                          variant="admin"
                          value={product.sku}
                          onChange={(e) => setProduct((prev) => ({ ...prev, sku: e.target.value }))}
                          placeholder="Stock-keeping unit (optional)"
                          className="text-sm font-mono"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                            <Package className="w-3.5 h-3.5 text-gray-400" />
                            Stock
                          </label>
                          <Input
                            variant="admin"
                            type="number"
                            value={product.stock}
                            onChange={(e) => setProduct((prev) => ({ ...prev, stock: e.target.value }))}
                            className="text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1.5 flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5 text-gray-400" />
                            Low Stock Alert
                          </label>
                          <Input
                            variant="admin"
                            type="number"
                            value={product.lowStockAlert}
                            onChange={(e) => setProduct((prev) => ({ ...prev, lowStockAlert: e.target.value }))}
                            className="text-sm"
                          />
                        </div>
                      </div>

                      {/* Stock Status */}
                      <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                        <div className="flex items-center gap-2">
                          {parseInt(product.stock) === 0 ? (
                            <AlertCircle className="w-4 h-4 text-red-400" />
                          ) : parseInt(product.stock) <= parseInt(product.lowStockAlert) ? (
                            <AlertCircle className="w-4 h-4 text-amber-400" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          )}
                          <span className="text-xs font-medium text-gray-700">
                            {parseInt(product.stock) === 0
                              ? "Out of stock"
                              : parseInt(product.stock) <= parseInt(product.lowStockAlert)
                                ? `Low stock (${product.stock} remaining)`
                                : `In stock (${product.stock} units)`}
                          </span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                          <Weight className="w-3.5 h-3.5 text-gray-400" />
                          Weight (kg)
                        </label>
                        <Input
                          variant="admin"
                          type="number"
                          step="0.01"
                          value={product.weight}
                          onChange={(e) => setProduct((prev) => ({ ...prev, weight: e.target.value }))}
                          placeholder="0.00"
                          className="text-sm"
                        />
                      </div>

                      {/* Variants summary */}
                      {product.variants.length > 0 && (
                        <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
                          <p className="text-xs font-medium text-blue-700">
                            <Layers className="w-3.5 h-3.5 inline mr-1" />
                            {product.variants.length} variant{product.variants.length > 1 ? "s" : ""} configured
                          </p>
                          <p className="text-[10px] text-blue-500 mt-1">
                            Total variant stock: {product.variants.reduce((sum, v) => sum + v.stock, 0)} units
                          </p>
                        </div>
                      )}
                    </>
                  )}

                  {/* ── SEO TAB ── */}
                  {activeTab === "seo" && (
                    <>
                      {/* SEO Score */}
                      <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/80">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">SEO Score</h4>
                          <span className={cn(
                            "text-xl font-bold",
                            seoScore.score >= 80 ? "text-emerald-600" : seoScore.score >= 50 ? "text-amber-600" : "text-red-500"
                          )}>
                            {seoScore.score}%
                          </span>
                        </div>
                        <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all duration-500",
                              seoScore.score >= 80 ? "bg-emerald-500" : seoScore.score >= 50 ? "bg-amber-500" : "bg-red-400"
                            )}
                            style={{ width: `${seoScore.score}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-gray-500 mt-2">
                          {seoScore.score >= 80 ? "Great! Well optimized for search." : seoScore.score >= 50 ? "Good start — fill in more items below." : "Needs work — complete the checklist."}
                        </p>
                      </div>

                      {/* Auto-Generate */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={autoFillSeo}
                        className="w-full border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800 font-semibold"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Auto-Generate SEO Fields
                      </Button>

                      {/* Meta Title */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs font-semibold text-gray-800">Meta Title</label>
                          {!product.metaTitle && (
                            <button
                              onClick={() => setProduct((prev) => ({ ...prev, metaTitle: generateSeoTitle() }))}
                              className="text-[10px] text-blue-600 hover:text-blue-700 font-semibold"
                            >
                              Auto-fill
                            </button>
                          )}
                        </div>
                        <Input
                          variant="admin"
                          value={product.metaTitle}
                          onChange={(e) => setProduct((prev) => ({ ...prev, metaTitle: e.target.value }))}
                          placeholder={generateSeoTitle()}
                          className="text-sm"
                        />
                        <p className={cn(
                          "text-[10px] font-medium mt-1",
                          (product.metaTitle || product.name).length > 60
                            ? "text-red-500"
                            : (product.metaTitle || product.name).length >= 30
                              ? "text-emerald-600"
                              : "text-amber-500"
                        )}>
                          {(product.metaTitle || product.name).length}/60 characters
                          {(product.metaTitle || product.name).length > 60 && " — will be truncated"}
                          {(product.metaTitle || product.name).length >= 30 && (product.metaTitle || product.name).length <= 60 && " ✓"}
                        </p>
                      </div>

                      {/* Meta Description */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs font-semibold text-gray-800">Meta Description</label>
                          {!product.metaDescription && (
                            <button
                              onClick={() => setProduct((prev) => ({ ...prev, metaDescription: generateSeoDescription() }))}
                              className="text-[10px] text-blue-600 hover:text-blue-700 font-semibold"
                            >
                              Auto-fill
                            </button>
                          )}
                        </div>
                        <Textarea
                          variant="admin"
                          value={product.metaDescription}
                          onChange={(e) => setProduct((prev) => ({ ...prev, metaDescription: e.target.value }))}
                          placeholder={generateSeoDescription()}
                          rows={3}
                          className="text-sm"
                        />
                        <p className={cn(
                          "text-[10px] font-medium mt-1",
                          (product.metaDescription || product.summary || "").length > 160
                            ? "text-red-500"
                            : (product.metaDescription || product.summary || "").length >= 100
                              ? "text-emerald-600"
                              : "text-amber-500"
                        )}>
                          {(product.metaDescription || product.summary || "").length}/160 characters
                          {(product.metaDescription || product.summary || "").length > 160 && " — will be truncated"}
                          {(product.metaDescription || product.summary || "").length >= 100 && (product.metaDescription || product.summary || "").length <= 160 && " ✓"}
                        </p>
                      </div>

                      {/* Suggested Keywords */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-800 mb-1.5">Suggested Keywords</label>
                        <div className="flex flex-wrap gap-1.5">
                          {extractKeywords().map((kw) => (
                            <span
                              key={kw}
                              className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-medium"
                            >
                              {kw}
                            </span>
                          ))}
                          {extractKeywords().length === 0 && (
                            <p className="text-[10px] text-gray-500 italic">Add name, tags & category for suggestions</p>
                          )}
                        </div>
                      </div>

                      {/* Google Preview */}
                      <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-sm space-y-1">
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Google Preview</p>
                        <p className="text-[15px] text-blue-800 font-medium leading-snug truncate">
                          {product.metaTitle || product.name || "Product Title"}
                        </p>
                        <p className="text-[12px] text-emerald-700 truncate">
                          integritymannetwork.com › store › {product.slug || "..."}
                        </p>
                        <p className="text-[12px] text-gray-600 line-clamp-2 leading-relaxed">
                          {product.metaDescription || product.summary || "Product description will appear here in search results..."}
                        </p>
                      </div>

                      {/* SEO Checklist */}
                      <div>
                        <p className="text-xs font-bold text-gray-800 mb-2 uppercase tracking-wider">SEO Checklist</p>
                        <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                          {seoScore.checks.map((check) => (
                            <div key={check.label} className="flex items-start gap-2">
                              {check.ok ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                              ) : (
                                <AlertCircle className="w-3.5 h-3.5 text-gray-300 shrink-0 mt-0.5" />
                              )}
                              <div>
                                <p className={cn("text-[11px] font-medium", check.ok ? "text-gray-700" : "text-gray-400")}>
                                  {check.label}
                                </p>
                                {!check.ok && (
                                  <p className="text-[9px] text-gray-400">{check.tip}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {/* ── SETTINGS TAB ── */}
                  {activeTab === "settings" && (
                    <>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                          <Truck className="w-3.5 h-3.5 text-gray-400" />
                          Shipping
                        </label>
                        <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={product.isDigital}
                              onChange={(e) => setProduct((prev) => ({ ...prev, isDigital: e.target.checked }))}
                              className="w-4 h-4 rounded bg-white border-gray-300 text-blue-600"
                            />
                            <div>
                              <p className="text-sm text-gray-700 font-medium">Digital product</p>
                              <p className="text-[10px] text-gray-500">No shipping required</p>
                            </div>
                          </label>
                        </div>
                      </div>

                      {/* Product info */}
                      {product.id && (
                        <div className="p-3 rounded-lg bg-gray-50 border border-gray-100 space-y-2">
                          <p className="text-[11px] text-gray-600">
                            <span className="font-medium text-gray-700">Product ID:</span>{" "}
                            <span className="font-mono">{product.id}</span>
                          </p>
                          <p className="text-[11px] text-gray-600">
                            <span className="font-medium text-gray-700">URL:</span>{" "}
                            <a href={`/store/${product.slug}`} className="text-blue-600 hover:text-blue-700 hover:underline" target="_blank">
                              /store/{product.slug}
                            </a>
                          </p>
                        </div>
                      )}

                      {/* Danger zone */}
                      {product.id && (
                        <div className="p-4 rounded-lg border border-red-200 bg-red-50/50">
                          <p className="text-xs font-medium text-red-700 mb-1">Danger Zone</p>
                          <p className="text-[10px] text-red-500 mb-3">
                            Permanently delete this product and all its data.
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleDelete}
                            className="border-red-200 text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete Product
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Price Preview */}
            {product.price && (
              <Card variant="admin">
                <CardContent className="p-5">
                  <p className="text-xs font-medium text-gray-500 mb-2">Price Preview</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-gray-900">
                      {formatCurrency(parseFloat(product.price))}
                    </span>
                    {product.comparePrice && (
                      <span className="text-sm text-gray-400 line-through">
                        {formatCurrency(parseFloat(product.comparePrice))}
                      </span>
                    )}
                  </div>
                  {discount && discount > 0 && (
                    <Badge variant="success" className="mt-2 text-[10px]">
                      {discount}% OFF
                    </Badge>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
