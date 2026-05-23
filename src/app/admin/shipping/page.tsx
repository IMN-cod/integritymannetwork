"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Truck, Plus, Pencil, Trash2, Save, Loader2, Check,
  AlertTriangle, ToggleLeft, ToggleRight, PackageCheck, Info,
  MapPin, Package, X, ChevronDown, ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type {
  ShippingConfig, ShippingMethod, ShippingZone, ShippingClassConfig,
} from "@/app/api/store/shipping/route";
import { DEFAULT_SHIPPING_CONFIG } from "@/app/api/store/shipping/route";

// ── Helpers ───────────────────────────────────────────────────────────────────

function generateId(name: string) {
  return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") + "-" + Math.random().toString(36).slice(2, 6);
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${on ? "bg-blue-600" : "bg-gray-200"}`}
    >
      <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${on ? "translate-x-5" : "translate-x-0"}`} />
    </button>
  );
}

function SectionHeader({ icon: Icon, title, subtitle, action }: { icon: React.ElementType; title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-50 rounded-xl">
          <Icon className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

// ── Method Form ───────────────────────────────────────────────────────────────

interface MethodFormState {
  id: string; name: string; description: string; carrier: string;
  price: string; estimatedDays: string; processingDays: string;
  enabled: boolean; codAvailable: boolean;
}
const emptyMethod = (): MethodFormState => ({
  id: "", name: "", description: "", carrier: "", price: "",
  estimatedDays: "", processingDays: "1-2 business days", enabled: true, codAvailable: false,
});

function MethodForm({ form, setForm, error, onSave, onCancel, isNew }: {
  form: MethodFormState;
  setForm: React.Dispatch<React.SetStateAction<MethodFormState>>;
  error: string | null;
  onSave: () => void;
  onCancel: () => void;
  isNew: boolean;
}) {
  const u = (k: keyof MethodFormState, v: string | boolean) => setForm((p) => ({ ...p, [k]: v }));
  return (
    <div className="p-5 rounded-xl border-2 border-blue-200 bg-blue-50/30 space-y-4">
      <h3 className="text-sm font-semibold text-gray-800">{isNew ? "Add Delivery Method" : "Edit Delivery Method"}</h3>
      {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Method Name *</label>
          <Input variant="admin" placeholder="Standard Delivery" value={form.name} onChange={(e) => u("name", e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Base Price (GHS) *</label>
          <Input variant="admin" type="number" min={0} step={5} placeholder="35" value={form.price} onChange={(e) => u("price", e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Carrier / Courier</label>
          <Input variant="admin" placeholder="e.g. GIG Logistics, DHL Express" value={form.carrier} onChange={(e) => u("carrier", e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Estimated Delivery *</label>
          <Input variant="admin" placeholder="5-7 business days" value={form.estimatedDays} onChange={(e) => u("estimatedDays", e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Processing / Dispatch Time</label>
          <Input variant="admin" placeholder="1-2 business days" value={form.processingDays} onChange={(e) => u("processingDays", e.target.value)} />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
        <Input variant="admin" placeholder="Reliable delivery across Ghana" value={form.description} onChange={(e) => u("description", e.target.value)} />
      </div>

      <div className="flex flex-wrap items-center gap-6 pt-1">
        <label className="flex items-center gap-2.5 cursor-pointer">
          <Toggle on={form.enabled} onToggle={() => u("enabled", !form.enabled)} />
          <span className="text-sm text-gray-700">{form.enabled ? "Active — shown at checkout" : "Disabled — hidden from customers"}</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.codAvailable}
            onChange={(e) => u("codAvailable", e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-blue-600"
          />
          <span className="text-sm text-gray-700">Cash on Delivery available</span>
        </label>
      </div>

      <div className="flex gap-2 pt-1">
        <Button size="sm" onClick={onSave}><Check className="w-3.5 h-3.5" />{isNew ? "Add Method" : "Save"}</Button>
        <Button size="sm" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

// ── Zone Form ─────────────────────────────────────────────────────────────────

interface ZoneFormState { id: string; name: string; description: string; enabled: boolean; extraFee: string; }
const emptyZone = (): ZoneFormState => ({ id: "", name: "", description: "", enabled: true, extraFee: "0" });

function ZoneForm({ form, setForm, error, onSave, onCancel, isNew }: {
  form: ZoneFormState;
  setForm: React.Dispatch<React.SetStateAction<ZoneFormState>>;
  error: string | null;
  onSave: () => void;
  onCancel: () => void;
  isNew: boolean;
}) {
  const u = (k: keyof ZoneFormState, v: string | boolean) => setForm((p) => ({ ...p, [k]: v }));
  return (
    <div className="p-5 rounded-xl border-2 border-emerald-200 bg-emerald-50/30 space-y-4">
      <h3 className="text-sm font-semibold text-gray-800">{isNew ? "Add Delivery Zone" : "Edit Zone"}</h3>
      {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Zone Name *</label>
          <Input variant="admin" placeholder="Greater Accra" value={form.name} onChange={(e) => u("name", e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Extra Fee (GHS)</label>
          <Input variant="admin" type="number" min={0} step={5} placeholder="0" value={form.extraFee} onChange={(e) => u("extraFee", e.target.value)} />
          <p className="text-[10px] text-gray-400 mt-1">Added on top of method base price. 0 = no surcharge.</p>
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Coverage Description</label>
        <Input variant="admin" placeholder="Accra, Tema, Accra Metropolis & nearby districts" value={form.description} onChange={(e) => u("description", e.target.value)} />
      </div>
      <label className="flex items-center gap-2.5 cursor-pointer">
        <Toggle on={form.enabled} onToggle={() => u("enabled", !form.enabled)} />
        <span className="text-sm text-gray-700">{form.enabled ? "Active zone" : "Disabled — hidden from admin view"}</span>
      </label>
      <div className="flex gap-2 pt-1">
        <Button size="sm" onClick={onSave}><Check className="w-3.5 h-3.5" />{isNew ? "Add Zone" : "Save"}</Button>
        <Button size="sm" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AdminShippingPage() {
  const [config, setConfig] = useState<ShippingConfig>(DEFAULT_SHIPPING_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Method editor
  const [editingMethodId, setEditingMethodId] = useState<string | null>(null);
  const [methodForm, setMethodForm] = useState<MethodFormState>(emptyMethod());
  const [methodFormError, setMethodFormError] = useState<string | null>(null);

  // Zone editor
  const [editingZoneId, setEditingZoneId] = useState<string | null>(null);
  const [zoneForm, setZoneForm] = useState<ZoneFormState>(emptyZone());
  const [zoneFormError, setZoneFormError] = useState<string | null>(null);

  // Section collapse
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const toggleCollapse = (key: string) => setCollapsed((p) => ({ ...p, [key]: !p[key] }));

  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/shipping");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setConfig(data.config);
    } catch {
      setError("Failed to load shipping configuration");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchConfig(); }, [fetchConfig]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/shipping", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to save");
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  // ── Method actions ──────────────────────────────────────────────────────────

  const startAddMethod = () => {
    setMethodForm(emptyMethod());
    setMethodFormError(null);
    setEditingMethodId("new");
  };

  const startEditMethod = (m: ShippingMethod) => {
    setMethodForm({
      id: m.id, name: m.name, description: m.description, carrier: m.carrier ?? "",
      price: String(m.price), estimatedDays: m.estimatedDays,
      processingDays: m.processingDays ?? "", enabled: m.enabled, codAvailable: m.codAvailable ?? false,
    });
    setMethodFormError(null);
    setEditingMethodId(m.id);
  };

  const commitMethod = () => {
    if (!methodForm.name.trim()) { setMethodFormError("Method name is required."); return; }
    const price = parseFloat(methodForm.price);
    if (isNaN(price) || price < 0) { setMethodFormError("Price must be a valid number."); return; }
    if (!methodForm.estimatedDays.trim()) { setMethodFormError("Estimated delivery time is required."); return; }
    setMethodFormError(null);

    const method: ShippingMethod = {
      id: editingMethodId === "new" ? generateId(methodForm.name) : methodForm.id,
      name: methodForm.name.trim(),
      description: methodForm.description.trim(),
      carrier: methodForm.carrier.trim() || undefined,
      price,
      estimatedDays: methodForm.estimatedDays.trim(),
      processingDays: methodForm.processingDays.trim() || undefined,
      enabled: methodForm.enabled,
      codAvailable: methodForm.codAvailable,
    };
    setConfig((p) => ({
      ...p,
      methods: editingMethodId === "new"
        ? [...p.methods, method]
        : p.methods.map((m) => m.id === editingMethodId ? method : m),
    }));
    setEditingMethodId(null);
  };

  const deleteMethod = (id: string) => {
    if (!confirm("Delete this delivery method?")) return;
    setConfig((p) => ({ ...p, methods: p.methods.filter((m) => m.id !== id) }));
  };

  const toggleMethod = (id: string) =>
    setConfig((p) => ({ ...p, methods: p.methods.map((m) => m.id === id ? { ...m, enabled: !m.enabled } : m) }));

  // ── Zone actions ────────────────────────────────────────────────────────────

  const startAddZone = () => {
    setZoneForm(emptyZone());
    setZoneFormError(null);
    setEditingZoneId("new");
  };

  const startEditZone = (z: ShippingZone) => {
    setZoneForm({ id: z.id, name: z.name, description: z.description, enabled: z.enabled, extraFee: String(z.extraFee) });
    setZoneFormError(null);
    setEditingZoneId(z.id);
  };

  const commitZone = () => {
    if (!zoneForm.name.trim()) { setZoneFormError("Zone name is required."); return; }
    const fee = parseFloat(zoneForm.extraFee);
    if (isNaN(fee) || fee < 0) { setZoneFormError("Extra fee must be 0 or more."); return; }
    setZoneFormError(null);

    const zone: ShippingZone = {
      id: editingZoneId === "new" ? generateId(zoneForm.name) : zoneForm.id,
      name: zoneForm.name.trim(),
      description: zoneForm.description.trim(),
      enabled: zoneForm.enabled,
      extraFee: fee,
    };
    setConfig((p) => ({
      ...p,
      zones: editingZoneId === "new"
        ? [...p.zones, zone]
        : p.zones.map((z) => z.id === editingZoneId ? zone : z),
    }));
    setEditingZoneId(null);
  };

  const deleteZone = (id: string) => {
    if (!confirm("Delete this zone?")) return;
    setConfig((p) => ({ ...p, zones: p.zones.filter((z) => z.id !== id) }));
  };

  const toggleZone = (id: string) =>
    setConfig((p) => ({ ...p, zones: p.zones.map((z) => z.id === id ? { ...z, enabled: !z.enabled } : z) }));

  // ── Class config actions ────────────────────────────────────────────────────

  const updateClass = (id: string, changes: Partial<ShippingClassConfig>) =>
    setConfig((p) => ({ ...p, classes: p.classes.map((c) => c.id === id ? { ...c, ...changes } : c) }));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* ── Top bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-display flex items-center gap-2">
            <Truck className="w-6 h-6 text-blue-600" />
            Shipping Configuration
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Configure delivery methods, regional zones, product classes, and free shipping rules.
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? "Saved!" : "Save All Changes"}
        </Button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span className="text-sm">{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600"><X className="w-4 h-4" /></button>
        </div>
      )}

      <div className="space-y-6 max-w-4xl">

        {/* ═══════════════════════════════════════════════════
            SECTION 1 — DELIVERY METHODS
        ═══════════════════════════════════════════════════ */}
        <Card variant="admin">
          <CardHeader>
            <div className="flex items-center justify-between">
              <SectionHeader
                icon={Truck}
                title="Delivery Methods"
                subtitle="Each method is selectable by the customer at checkout."
              />
              <div className="flex items-center gap-2">
                {editingMethodId !== "new" && (
                  <Button size="sm" onClick={startAddMethod}><Plus className="w-4 h-4" />Add Method</Button>
                )}
                <button onClick={() => toggleCollapse("methods")} className="p-1 text-gray-400 hover:text-gray-600">
                  {collapsed.methods ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </CardHeader>
          {!collapsed.methods && (
            <CardContent className="space-y-4">
              {config.methods.length === 0 && editingMethodId !== "new" && (
                <p className="text-center py-8 text-gray-400 text-sm">No delivery methods yet. Add one to get started.</p>
              )}
              {config.methods.map((method) => (
                <div key={method.id}>
                  {editingMethodId === method.id ? (
                    <MethodForm form={methodForm} setForm={setMethodForm} error={methodFormError}
                      onSave={commitMethod} onCancel={() => setEditingMethodId(null)} isNew={false} />
                  ) : (
                    <div className={`flex items-start gap-4 p-4 rounded-xl border transition-all ${method.enabled ? "border-gray-200 bg-white" : "border-gray-100 bg-gray-50 opacity-60"}`}>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <p className="text-sm font-semibold text-gray-800">{method.name}</p>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${method.enabled ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                            {method.enabled ? "Active" : "Disabled"}
                          </span>
                          {method.codAvailable && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-amber-100 text-amber-700">COD</span>
                          )}
                        </div>
                        {method.description && <p className="text-xs text-gray-500 mb-2">{method.description}</p>}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                          <span className="font-semibold text-gray-800 text-sm">{formatCurrency(method.price)}</span>
                          {method.carrier && <span className="text-blue-600 font-medium">via {method.carrier}</span>}
                          <span>·</span>
                          <span>{method.estimatedDays}</span>
                          {method.processingDays && <><span>·</span><span className="text-gray-400">ships in {method.processingDays}</span></>}
                        </div>
                        {config.freeShippingEnabled && (
                          <p className="text-[11px] text-green-600 mt-1.5 font-medium">
                            Free on eligible orders ≥ {formatCurrency(config.freeShippingThreshold)}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => toggleMethod(method.id)} title={method.enabled ? "Disable" : "Enable"}
                          className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                          {method.enabled ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                        </button>
                        <button onClick={() => startEditMethod(method)}
                          className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => deleteMethod(method.id)}
                          className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {editingMethodId === "new" && (
                <MethodForm form={methodForm} setForm={setMethodForm} error={methodFormError}
                  onSave={commitMethod} onCancel={() => setEditingMethodId(null)} isNew />
              )}
              <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-700 mt-2">
                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>Active methods appear at checkout for customers to choose from. Prices shown are base prices — zone and class surcharges are added separately.</span>
              </div>
            </CardContent>
          )}
        </Card>

        {/* ═══════════════════════════════════════════════════
            SECTION 2 — DELIVERY ZONES
        ═══════════════════════════════════════════════════ */}
        <Card variant="admin">
          <CardHeader>
            <div className="flex items-center justify-between">
              <SectionHeader
                icon={MapPin}
                title="Delivery Zones"
                subtitle="Define regional surcharges applied on top of the base delivery method price."
              />
              <div className="flex items-center gap-2">
                {editingZoneId !== "new" && (
                  <Button size="sm" variant="outline" onClick={startAddZone}><Plus className="w-4 h-4" />Add Zone</Button>
                )}
                <button onClick={() => toggleCollapse("zones")} className="p-1 text-gray-400 hover:text-gray-600">
                  {collapsed.zones ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </CardHeader>
          {!collapsed.zones && (
            <CardContent className="space-y-4">
              {config.zones.map((zone) => (
                <div key={zone.id}>
                  {editingZoneId === zone.id ? (
                    <ZoneForm form={zoneForm} setForm={setZoneForm} error={zoneFormError}
                      onSave={commitZone} onCancel={() => setEditingZoneId(null)} isNew={false} />
                  ) : (
                    <div className={`flex items-start gap-4 p-4 rounded-xl border transition-all ${zone.enabled ? "border-gray-200 bg-white" : "border-gray-100 bg-gray-50 opacity-60"}`}>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <p className="text-sm font-semibold text-gray-800">{zone.name}</p>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${zone.enabled ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                            {zone.enabled ? "Active" : "Disabled"}
                          </span>
                          {zone.extraFee === 0
                            ? <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">No surcharge</span>
                            : <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700 font-medium">+{formatCurrency(zone.extraFee)}</span>
                          }
                        </div>
                        <p className="text-xs text-gray-500">{zone.description}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => toggleZone(zone.id)}
                          className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                          {zone.enabled ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                        </button>
                        <button onClick={() => startEditZone(zone)}
                          className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => deleteZone(zone.id)}
                          className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {editingZoneId === "new" && (
                <ZoneForm form={zoneForm} setForm={setZoneForm} error={zoneFormError}
                  onSave={commitZone} onCancel={() => setEditingZoneId(null)} isNew />
              )}
              <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-700">
                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>Zone surcharges are informational references for your pricing model. The extra fee is used in order cost breakdowns when a customer&apos;s delivery city matches a zone.</span>
              </div>
            </CardContent>
          )}
        </Card>

        {/* ═══════════════════════════════════════════════════
            SECTION 3 — SHIPPING CLASSES
        ═══════════════════════════════════════════════════ */}
        <Card variant="admin">
          <CardHeader>
            <div className="flex items-center justify-between">
              <SectionHeader
                icon={Package}
                title="Shipping Classes"
                subtitle="Classes are assigned per product. Each class can carry a surcharge and different free-shipping eligibility."
              />
              <button onClick={() => toggleCollapse("classes")} className="p-1 text-gray-400 hover:text-gray-600">
                {collapsed.classes ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </button>
            </div>
          </CardHeader>
          {!collapsed.classes && (
            <CardContent className="space-y-4">
              {config.classes.map((cls) => (
                <div key={cls.id} className="p-4 rounded-xl border border-gray-200 bg-white">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-semibold text-gray-800">{cls.name}</p>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 font-mono">{cls.id}</span>
                      </div>
                      <p className="text-xs text-gray-500">{cls.description}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 sm:gap-5 shrink-0">
                      {/* Extra Fee */}
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-gray-500 whitespace-nowrap">Surcharge (GHS)</label>
                        <Input
                          variant="admin"
                          type="number"
                          min={0}
                          step={5}
                          className="w-24 text-sm"
                          value={cls.extraFee}
                          onChange={(e) => updateClass(cls.id, { extraFee: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                      {/* Free shipping eligible */}
                      <label className="flex items-center gap-2 cursor-pointer whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={cls.freeShippingEligible}
                          onChange={(e) => updateClass(cls.id, { freeShippingEligible: e.target.checked })}
                          className="w-4 h-4 rounded border-gray-300 text-blue-600"
                        />
                        <span className="text-xs text-gray-700">Free shipping eligible</span>
                      </label>
                    </div>
                  </div>
                  {cls.extraFee > 0 && (
                    <p className="text-[11px] text-orange-600 mt-2 font-medium">
                      +{formatCurrency(cls.extraFee)} added to every order containing a {cls.name} product.
                    </p>
                  )}
                  {!cls.freeShippingEligible && (
                    <p className="text-[11px] text-red-500 mt-1">
                      Orders with {cls.name} products do not qualify for free shipping.
                    </p>
                  )}
                </div>
              ))}
              <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-700">
                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>Assign a Shipping Class to each product from the product editor. The highest surcharge class in the cart is applied once per order. Go to <strong>Products → Edit Product → Shipping tab</strong> to set per-product classes.</span>
              </div>
            </CardContent>
          )}
        </Card>

        {/* ═══════════════════════════════════════════════════
            SECTION 4 — FREE SHIPPING RULES
        ═══════════════════════════════════════════════════ */}
        <Card variant="admin">
          <CardHeader>
            <div className="flex items-center justify-between">
              <SectionHeader
                icon={PackageCheck}
                title="Free Shipping Rules"
                subtitle="Set the order threshold above which eligible products ship for free."
              />
              <button onClick={() => toggleCollapse("free")} className="p-1 text-gray-400 hover:text-gray-600">
                {collapsed.free ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </button>
            </div>
          </CardHeader>
          {!collapsed.free && (
            <CardContent className="space-y-5">
              <div className="flex items-start gap-3">
                <Toggle
                  on={config.freeShippingEnabled}
                  onToggle={() => setConfig((p) => ({ ...p, freeShippingEnabled: !p.freeShippingEnabled }))}
                />
                <div>
                  <span className="text-sm font-medium text-gray-700">Enable Free Shipping Threshold</span>
                  <p className="text-xs text-gray-400 mt-0.5">
                    When enabled, orders meeting the threshold receive free delivery (for eligible shipping classes).
                  </p>
                </div>
              </div>

              {config.freeShippingEnabled && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1.5">Free Shipping Threshold (GHS)</label>
                    <div className="flex items-center gap-3 max-w-xs">
                      <span className="text-sm font-semibold text-gray-500">GHS</span>
                      <Input
                        variant="admin"
                        type="number"
                        min={0}
                        step={50}
                        value={config.freeShippingThreshold}
                        onChange={(e) => setConfig((p) => ({ ...p, freeShippingThreshold: parseFloat(e.target.value) || 0 }))}
                        className="max-w-36"
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      Currently: orders of {formatCurrency(config.freeShippingThreshold)} or more qualify.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-2">
                    <p className="text-xs font-semibold text-gray-700 mb-2">Class eligibility summary:</p>
                    {config.classes.map((cls) => (
                      <div key={cls.id} className="flex items-center justify-between text-xs">
                        <span className="text-gray-600">{cls.name}</span>
                        {cls.freeShippingEligible
                          ? <span className="text-green-600 font-medium">Eligible for free shipping</span>
                          : <span className="text-red-500 font-medium">Always charged</span>
                        }
                      </div>
                    ))}
                    <p className="text-[11px] text-gray-400 pt-1">Change eligibility in the Shipping Classes section above.</p>
                  </div>
                </>
              )}
            </CardContent>
          )}
        </Card>

        {/* ── Save footer ── */}
        <div className="flex items-center justify-between pb-10 pt-2">
          <p className="text-xs text-gray-400">
            Changes take effect immediately after saving. Customers see updated options at checkout.
          </p>
          <Button onClick={handleSave} disabled={saving} size="lg">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saved ? "Saved!" : "Save Shipping Configuration"}
          </Button>
        </div>
      </div>
    </div>
  );
}
