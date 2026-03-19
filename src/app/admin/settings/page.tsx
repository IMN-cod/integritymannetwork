"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Save,
  Globe,
  Mail,
  Bell,
  Shield,
  Loader2,
  Check,
  Palette,
  Share2,
  Search,
  CreditCard,
  Database,
  AlertTriangle,
  Eye,
  EyeOff,
  RotateCcw,
  Download,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageUpload } from "@/components/ui/ImageUpload";

// ─── Types ───────────────────────────────────────────────────────────────────
type SettingsMap = Record<string, string>;

interface TabConfig {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
}

// ─── Tabs ────────────────────────────────────────────────────────────────────
const TABS: TabConfig[] = [
  { id: "general", label: "General", icon: <Globe className="w-4 h-4" />, description: "Site name, tagline, and basic info" },
  { id: "contact", label: "Contact", icon: <Mail className="w-4 h-4" />, description: "Contact information and addresses" },
  { id: "social", label: "Social", icon: <Share2 className="w-4 h-4" />, description: "Social media links" },
  { id: "seo", label: "SEO", icon: <Search className="w-4 h-4" />, description: "Search engine optimization" },
  { id: "appearance", label: "Appearance", icon: <Palette className="w-4 h-4" />, description: "Colors, logo, and branding" },
  { id: "payments", label: "Payments", icon: <CreditCard className="w-4 h-4" />, description: "Payment gateway configuration" },
  { id: "notifications", label: "Notifications", icon: <Bell className="w-4 h-4" />, description: "Email and alert settings" },
  { id: "security", label: "Security", icon: <Shield className="w-4 h-4" />, description: "Access control and security" },
];

// ─── Default Settings ────────────────────────────────────────────────────────
const DEFAULTS: SettingsMap = {
  // General
  siteName: "The Integrity Man Network",
  tagline: "A Community for Men of Integrity & Purpose",
  siteDescription: "",
  siteUrl: "",
  copyrightText: "",
  // Contact
  adminEmail: "",
  supportEmail: "",
  phone: "",
  whatsapp: "",
  address: "",
  // Social
  socialFacebook: "",
  socialTwitter: "",
  socialInstagram: "",
  socialYoutube: "",
  socialLinkedin: "",
  socialTiktok: "",
  // SEO
  metaTitle: "",
  metaDescription: "",
  metaKeywords: "",
  ogImage: "",
  googleAnalyticsId: "",
  googleVerification: "",
  robotsTxt: "User-agent: *\nAllow: /",
  // Appearance
  primaryColor: "#f97316",
  secondaryColor: "#3b82f6",
  logoUrl: "",
  faviconUrl: "",
  footerText: "",
  heroTitle: "",
  heroSubtitle: "",
  // Payments
  paymentCurrency: "GHS",
  stripeEnabled: "false",
  stripePublicKey: "",
  stripeSecretKey: "",
  paypalEnabled: "false",
  paypalClientId: "",
  paypalSecretKey: "",
  paystackEnabled: "false",
  paystackPublicKey: "",
  paystackSecretKey: "",
  // Notifications
  notifyNewMembers: "true",
  notifyDonations: "true",
  notifyMessages: "true",
  notifyOrders: "true",
  notifyEvents: "false",
  notifyCourseEnrollments: "true",
  emailFromName: "",
  emailFromAddress: "",
  smtpHost: "",
  smtpPort: "587",
  smtpUser: "",
  smtpPassword: "",
  // Security
  maintenanceMode: "false",
  allowRegistration: "true",
  maxLoginAttempts: "5",
  lockoutDuration: "30",
  sessionTimeout: "1440",
  requireEmailVerification: "false",
  twoFactorEnabled: "false",
  allowedOrigins: "",
};

// ─── Component ───────────────────────────────────────────────────────────────
export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const [settings, setSettings] = useState<SettingsMap>({ ...DEFAULTS });
  const [originalSettings, setOriginalSettings] = useState<SettingsMap>({ ...DEFAULTS });
  const [hasChanges, setHasChanges] = useState(false);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  // Track unsaved changes
  useEffect(() => {
    const changed = Object.keys(settings).some(
      (key) => settings[key] !== (originalSettings[key] ?? DEFAULTS[key] ?? "")
    );
    setHasChanges(changed);
  }, [settings, originalSettings]);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/settings");
      if (!res.ok) throw new Error();
      const data = await res.json();
      const s = data.settings || {};
      const merged = { ...DEFAULTS, ...s };
      setSettings(merged);
      setOriginalSettings(merged);
    } catch {
      setError("Failed to load settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleChange = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setError(null);
  };

  const handleToggle = (key: string) => {
    setSettings((prev) => ({
      ...prev,
      [key]: prev[key] === "true" ? "false" : "true",
    }));
    setError(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save");
      }
      setOriginalSettings({ ...settings });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSettings({ ...originalSettings });
    setError(null);
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(settings, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `imn-settings-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const imported = JSON.parse(text);
        if (typeof imported !== "object") throw new Error();
        setSettings((prev) => ({ ...prev, ...imported }));
      } catch {
        setError("Invalid settings file");
      }
    };
    input.click();
  };

  const toggleSecret = (key: string) => {
    setShowSecrets((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // ─── Field Renderers ────────────────────────────────────────────────────────
  const renderTextField = (key: string, label: string, opts?: { placeholder?: string; type?: string; description?: string; className?: string }) => (
    <div className={opts?.className}>
      <label className="block text-sm font-medium text-gray-600 mb-1.5">{label}</label>
      <Input
        variant="admin"
        type={opts?.type || "text"}
        value={settings[key] || ""}
        onChange={(e) => handleChange(key, e.target.value)}
        placeholder={opts?.placeholder}
        className="max-w-lg"
      />
      {opts?.description && <p className="text-xs text-gray-400 mt-1">{opts.description}</p>}
    </div>
  );

  const renderTextarea = (key: string, label: string, opts?: { placeholder?: string; rows?: number; description?: string }) => (
    <div>
      <label className="block text-sm font-medium text-gray-600 mb-1.5">{label}</label>
      <Textarea
        variant="admin"
        rows={opts?.rows || 3}
        value={settings[key] || ""}
        onChange={(e) => handleChange(key, e.target.value)}
        placeholder={opts?.placeholder}
        className="max-w-lg"
      />
      {opts?.description && <p className="text-xs text-gray-400 mt-1">{opts.description}</p>}
    </div>
  );

  const renderSecretField = (key: string, label: string, opts?: { placeholder?: string; description?: string }) => (
    <div>
      <label className="block text-sm font-medium text-gray-600 mb-1.5">{label}</label>
      <div className="flex gap-2 max-w-lg">
        <Input
          variant="admin"
          type={showSecrets[key] ? "text" : "password"}
          value={settings[key] || ""}
          onChange={(e) => handleChange(key, e.target.value)}
          placeholder={opts?.placeholder}
          className="flex-1"
        />
        <button
          type="button"
          onClick={() => toggleSecret(key)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors"
        >
          {showSecrets[key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {opts?.description && <p className="text-xs text-gray-400 mt-1">{opts.description}</p>}
    </div>
  );

  const renderToggle = (key: string, label: string, description?: string) => (
    <div className="flex items-start gap-3">
      <button
        type="button"
        onClick={() => handleToggle(key)}
        className={`relative mt-0.5 inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
          settings[key] === "true" ? "bg-blue-600" : "bg-gray-200"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            settings[key] === "true" ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
      <div>
        <span className="text-sm font-medium text-gray-700">{label}</span>
        {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
      </div>
    </div>
  );

  const renderColorField = (key: string, label: string) => (
    <div>
      <label className="block text-sm font-medium text-gray-600 mb-1.5">{label}</label>
      <div className="flex gap-2 items-center max-w-lg">
        <input
          type="color"
          value={settings[key] || "#000000"}
          onChange={(e) => handleChange(key, e.target.value)}
          className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer p-0.5"
        />
        <Input
          variant="admin"
          value={settings[key] || ""}
          onChange={(e) => handleChange(key, e.target.value)}
          placeholder="#f97316"
          className="flex-1"
        />
      </div>
    </div>
  );

  const renderNumberField = (key: string, label: string, opts?: { min?: number; max?: number; description?: string; suffix?: string }) => (
    <div>
      <label className="block text-sm font-medium text-gray-600 mb-1.5">{label}</label>
      <div className="flex items-center gap-2 max-w-lg">
        <Input
          variant="admin"
          type="number"
          min={opts?.min}
          max={opts?.max}
          value={settings[key] || ""}
          onChange={(e) => handleChange(key, e.target.value)}
          className="max-w-32"
        />
        {opts?.suffix && <span className="text-sm text-gray-500">{opts.suffix}</span>}
      </div>
      {opts?.description && <p className="text-xs text-gray-400 mt-1">{opts.description}</p>}
    </div>
  );

  // ─── Tab Content ───────────────────────────────────────────────────────────
  const renderTabContent = () => {
    switch (activeTab) {
      case "general":
        return (
          <div className="space-y-6">
            <Card variant="admin">
              <CardHeader>
                <CardTitle className="text-lg">Site Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {renderTextField("siteName", "Site Name", { placeholder: "The Integrity Man Network" })}
                {renderTextField("tagline", "Tagline", { placeholder: "A Community for Men of Integrity & Purpose" })}
                {renderTextarea("siteDescription", "Site Description", { placeholder: "Describe your website in a few sentences...", rows: 3 })}
                {renderTextField("siteUrl", "Site URL", { placeholder: "https://integritymannetwork.org", type: "url", description: "The full URL of your website" })}
                {renderTextField("copyrightText", "Copyright Text", { placeholder: "© 2025 The Integrity Man Network. All rights reserved.", description: "Displayed in the footer" })}
              </CardContent>
            </Card>
          </div>
        );

      case "contact":
        return (
          <div className="space-y-6">
            <Card variant="admin">
              <CardHeader>
                <CardTitle className="text-lg">Email Addresses</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {renderTextField("adminEmail", "Admin Email", { placeholder: "admin@integritymannetwork.org", type: "email", description: "Primary admin notifications" })}
                {renderTextField("supportEmail", "Support Email", { placeholder: "support@integritymannetwork.org", type: "email", description: "Displayed on contact pages" })}
              </CardContent>
            </Card>
            <Card variant="admin">
              <CardHeader>
                <CardTitle className="text-lg">Contact Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {renderTextField("phone", "Phone Number", { placeholder: "+233 20 123 4567" })}
                {renderTextField("whatsapp", "WhatsApp Number", { placeholder: "+233 20 123 4567", description: "Include country code for click-to-chat" })}
                {renderTextarea("address", "Physical Address", { placeholder: "123 Main Street\nAccra, Ghana", rows: 3 })}
              </CardContent>
            </Card>
          </div>
        );

      case "social":
        return (
          <Card variant="admin">
            <CardHeader>
              <CardTitle className="text-lg">Social Media Profiles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {renderTextField("socialFacebook", "Facebook", { placeholder: "https://facebook.com/integritymannetwork", type: "url" })}
              {renderTextField("socialTwitter", "X (Twitter)", { placeholder: "https://x.com/integritymannet", type: "url" })}
              {renderTextField("socialInstagram", "Instagram", { placeholder: "https://instagram.com/integritymannetwork", type: "url" })}
              {renderTextField("socialYoutube", "YouTube", { placeholder: "https://youtube.com/@integritymannetwork", type: "url" })}
              {renderTextField("socialLinkedin", "LinkedIn", { placeholder: "https://linkedin.com/company/integritymannetwork", type: "url" })}
              {renderTextField("socialTiktok", "TikTok", { placeholder: "https://tiktok.com/@integritymannetwork", type: "url" })}
            </CardContent>
          </Card>
        );

      case "seo":
        return (
          <div className="space-y-6">
            <Card variant="admin">
              <CardHeader>
                <CardTitle className="text-lg">Default Meta Tags</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {renderTextField("metaTitle", "Default Meta Title", { placeholder: "The Integrity Man Network", description: "Shown in search results (%s — page title)" })}
                {renderTextarea("metaDescription", "Default Meta Description", { placeholder: "A community for men of integrity and purpose...", rows: 3, description: "150-160 characters recommended" })}
                {renderTextField("metaKeywords", "Meta Keywords", { placeholder: "integrity, men, community, faith, purpose", description: "Comma-separated keywords" })}
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">Default OG Image</label>
                  <ImageUpload
                    value={settings.ogImage || ""}
                    onChange={(url) => handleChange("ogImage", url)}
                    context="blog-og"
                    hint="1200×630 recommended. Auto-optimized to WebP."
                    aspectClass="aspect-video"
                  />
                </div>
              </CardContent>
            </Card>
            <Card variant="admin">
              <CardHeader>
                <CardTitle className="text-lg">Analytics &amp; Verification</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {renderTextField("googleAnalyticsId", "Google Analytics ID", { placeholder: "G-XXXXXXXXXX", description: "Google Analytics 4 Measurement ID" })}
                {renderTextField("googleVerification", "Google Search Console", { placeholder: "verification-token", description: "Google site verification meta tag content" })}
              </CardContent>
            </Card>
            <Card variant="admin">
              <CardHeader>
                <CardTitle className="text-lg">Robots.txt</CardTitle>
              </CardHeader>
              <CardContent>
                {renderTextarea("robotsTxt", "robots.txt Rules", { rows: 5, description: "Custom robots.txt directives" })}
              </CardContent>
            </Card>
          </div>
        );

      case "appearance":
        return (
          <div className="space-y-6">
            <Card variant="admin">
              <CardHeader>
                <CardTitle className="text-lg">Brand Colors</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {renderColorField("primaryColor", "Primary Color")}
                {renderColorField("secondaryColor", "Secondary Color")}
                <div className="flex gap-3 mt-2">
                  <div className="w-16 h-16 rounded-xl shadow-inner border border-gray-200" style={{ backgroundColor: settings.primaryColor || "#f97316" }} />
                  <div className="w-16 h-16 rounded-xl shadow-inner border border-gray-200" style={{ backgroundColor: settings.secondaryColor || "#3b82f6" }} />
                  <div className="flex flex-col justify-center">
                    <span className="text-xs text-gray-500">Preview</span>
                    <span className="text-sm text-gray-700">Primary &amp; Secondary</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card variant="admin">
              <CardHeader>
                <CardTitle className="text-lg">Logo &amp; Favicon</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">Logo</label>
                  <ImageUpload
                    value={settings.logoUrl || ""}
                    onChange={(url) => handleChange("logoUrl", url)}
                    context="general"
                    hint="Upload your site logo. Auto-optimized to WebP."
                    aspectClass="aspect-[5/2]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">Favicon</label>
                  <ImageUpload
                    value={settings.faviconUrl || ""}
                    onChange={(url) => handleChange("faviconUrl", url)}
                    context="avatar"
                    hint="Square icon, ideally 512×512. Auto-optimized to WebP."
                    aspectClass="aspect-square"
                  />
                </div>
                <div className="flex items-center gap-4">
                  {settings.logoUrl && (
                    <div className="border border-gray-200 rounded-lg p-2 bg-gray-50">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={settings.logoUrl} alt="Logo preview" className="h-12 w-auto object-contain" />
                    </div>
                  )}
                  {settings.faviconUrl && (
                    <div className="border border-gray-200 rounded-lg p-2 bg-gray-50">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={settings.faviconUrl} alt="Favicon preview" className="h-8 w-8 object-contain" />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            <Card variant="admin">
              <CardHeader>
                <CardTitle className="text-lg">Homepage Content</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {renderTextField("heroTitle", "Hero Title", { placeholder: "Welcome to The Integrity Man Network" })}
                {renderTextField("heroSubtitle", "Hero Subtitle", { placeholder: "Building men of purpose and integrity" })}
                {renderTextField("footerText", "Custom Footer Text", { placeholder: "Built with purpose.", description: "Additional text shown above copyright" })}
              </CardContent>
            </Card>
          </div>
        );

      case "payments":
        return (
          <div className="space-y-6">
            <Card variant="admin">
              <CardHeader>
                <CardTitle className="text-lg">Currency</CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">Default Currency</label>
                  <select
                    value={settings.paymentCurrency || "GHS"}
                    onChange={(e) => handleChange("paymentCurrency", e.target.value)}
                    className="flex h-11 max-w-xs rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/25"
                  >
                    <option value="GHS">GHS — Ghana Cedis</option>
                    <option value="USD">USD — US Dollar</option>
                    <option value="EUR">EUR — Euro</option>
                    <option value="GBP">GBP — British Pound</option>
                    <option value="NGN">NGN — Nigerian Naira</option>
                    <option value="KES">KES — Kenyan Shilling</option>
                    <option value="ZAR">ZAR — South African Rand</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Paystack */}
            <Card variant="admin">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  Paystack
                  <span className={`text-xs px-2 py-0.5 rounded-full ${settings.paystackEnabled === "true" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {settings.paystackEnabled === "true" ? "Active" : "Inactive"}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {renderToggle("paystackEnabled", "Enable Paystack", "Accept payments via Paystack (cards, mobile money, bank transfers)")}
                {settings.paystackEnabled === "true" && (
                  <div className="space-y-4 pt-2 border-t border-gray-100">
                    {renderSecretField("paystackPublicKey", "Public Key", { placeholder: "pk_live_xxxxxxxxxxxxxxx" })}
                    {renderSecretField("paystackSecretKey", "Secret Key", { placeholder: "sk_live_xxxxxxxxxxxxxxx" })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Stripe */}
            <Card variant="admin">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  Stripe
                  <span className={`text-xs px-2 py-0.5 rounded-full ${settings.stripeEnabled === "true" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {settings.stripeEnabled === "true" ? "Active" : "Inactive"}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {renderToggle("stripeEnabled", "Enable Stripe", "Accept international card payments via Stripe")}
                {settings.stripeEnabled === "true" && (
                  <div className="space-y-4 pt-2 border-t border-gray-100">
                    {renderSecretField("stripePublicKey", "Publishable Key", { placeholder: "pk_live_xxxxxxx" })}
                    {renderSecretField("stripeSecretKey", "Secret Key", { placeholder: "sk_live_xxxxxxx" })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* PayPal */}
            <Card variant="admin">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  PayPal
                  <span className={`text-xs px-2 py-0.5 rounded-full ${settings.paypalEnabled === "true" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {settings.paypalEnabled === "true" ? "Active" : "Inactive"}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {renderToggle("paypalEnabled", "Enable PayPal", "Accept payments via PayPal")}
                {settings.paypalEnabled === "true" && (
                  <div className="space-y-4 pt-2 border-t border-gray-100">
                    {renderSecretField("paypalClientId", "Client ID", { placeholder: "AxxxxxxxxxxxxxxB" })}
                    {renderSecretField("paypalSecretKey", "Secret Key", { placeholder: "ExxxxxxxxxxxxxxF" })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );

      case "notifications":
        return (
          <div className="space-y-6">
            <Card variant="admin">
              <CardHeader>
                <CardTitle className="text-lg">Admin Notifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-500 mb-2">Choose which events send email notifications to admins.</p>
                {renderToggle("notifyNewMembers", "New member registrations", "Get notified when someone creates an account")}
                {renderToggle("notifyDonations", "New donations", "Get notified when a donation is received")}
                {renderToggle("notifyMessages", "Contact messages", "Get notified when someone submits a contact form")}
                {renderToggle("notifyOrders", "Store orders", "Get notified when a new order is placed")}
                {renderToggle("notifyEvents", "Event registrations", "Get notified when someone registers for an event")}
                {renderToggle("notifyCourseEnrollments", "Course enrollments", "Get notified when someone enrolls in a course")}
              </CardContent>
            </Card>
            <Card variant="admin">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  Email Configuration
                  <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">Advanced</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <p className="text-sm text-gray-500">Configure outgoing email settings. Leave blank to use system defaults.</p>
                {renderTextField("emailFromName", "From Name", { placeholder: "Integrity Man Network" })}
                {renderTextField("emailFromAddress", "From Email", { placeholder: "noreply@integritymannetwork.org", type: "email" })}
                <div className="border-t border-gray-100 pt-4">
                  <p className="text-sm font-medium text-gray-600 mb-3">SMTP Settings</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>{renderTextField("smtpHost", "Host", { placeholder: "smtp.gmail.com" })}</div>
                    <div>{renderNumberField("smtpPort", "Port", { min: 1, max: 65535 })}</div>
                  </div>
                  <div className="space-y-4 mt-4">
                    {renderTextField("smtpUser", "Username", { placeholder: "your@email.com" })}
                    {renderSecretField("smtpPassword", "Password", { placeholder: "••••••••" })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case "security":
        return (
          <div className="space-y-6">
            <Card variant="admin">
              <CardHeader>
                <CardTitle className="text-lg">Access Control</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {renderToggle("maintenanceMode", "Maintenance Mode", "Temporarily show a maintenance page to all visitors. Admins can still access the site.")}
                {renderToggle("allowRegistration", "Allow Public Registration", "Let new users create accounts on the website")}
                {renderToggle("requireEmailVerification", "Require Email Verification", "Users must verify their email before accessing their account")}
              </CardContent>
            </Card>
            <Card variant="admin">
              <CardHeader>
                <CardTitle className="text-lg">Login Security</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {renderNumberField("maxLoginAttempts", "Max Login Attempts", { min: 1, max: 20, description: "Number of failed attempts before account lockout" })}
                {renderNumberField("lockoutDuration", "Lockout Duration", { min: 1, max: 1440, suffix: "minutes", description: "How long an account is locked after too many failed attempts" })}
                {renderNumberField("sessionTimeout", "Session Timeout", { min: 15, max: 43200, suffix: "minutes", description: "Automatically log out inactive users after this duration" })}
                {renderToggle("twoFactorEnabled", "Two-Factor Authentication", "Require 2FA for admin accounts (coming soon)")}
              </CardContent>
            </Card>
            <Card variant="admin">
              <CardHeader>
                <CardTitle className="text-lg">CORS &amp; API</CardTitle>
              </CardHeader>
              <CardContent>
                {renderTextarea("allowedOrigins", "Allowed Origins", { placeholder: "https://integritymannetwork.org\nhttps://api.integritymannetwork.org", rows: 3, description: "One URL per line. Leave empty to allow all origins." })}
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card variant="admin" className="border-red-200">
              <CardHeader>
                <CardTitle className="text-lg text-red-600 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Danger Zone
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-100">
                  <div>
                    <p className="text-sm font-medium text-red-800">Reset All Settings</p>
                    <p className="text-xs text-red-600 mt-0.5">Restore all settings to their default values. This cannot be undone.</p>
                  </div>
                  <Button
                    variant="outline"
                    className="border-red-300 text-red-600 hover:bg-red-50"
                    onClick={() => {
                      if (confirm("Are you sure you want to reset ALL settings to defaults? This cannot be undone.")) {
                        setSettings({ ...DEFAULTS });
                      }
                    }}
                  >
                    Reset All
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  // ─── Loading State ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-display">Platform Settings</h1>
          <p className="text-sm text-gray-500 mt-1">
            Configure and manage all aspects of your platform.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleImport} className="text-gray-600">
            <Upload className="w-4 h-4" />
            Import
          </Button>
          <Button variant="outline" onClick={handleExport} className="text-gray-600">
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button variant="outline" onClick={handleReset} disabled={!hasChanges} className="text-gray-600">
            <RotateCcw className="w-4 h-4" />
            Discard
          </Button>
          <Button onClick={handleSave} disabled={saving || !hasChanges}>
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : saved ? (
              <Check className="w-4 h-4" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saved ? "Saved!" : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span className="text-sm">{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">✕</button>
        </div>
      )}

      {/* Unsaved Changes Banner */}
      {hasChanges && !error && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl flex items-center gap-2">
          <Database className="w-4 h-4 shrink-0" />
          <span className="text-sm">You have unsaved changes.</span>
        </div>
      )}

      {/* Tab Navigation + Content */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Tabs */}
        <nav className="lg:w-56 shrink-0">
          <div className="lg:sticky lg:top-6 space-y-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 text-left ${
                  activeTab === tab.id
                    ? "bg-blue-50 text-blue-700 shadow-sm"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <span className={activeTab === tab.id ? "text-blue-600" : "text-gray-400"}>{tab.icon}</span>
                <div>
                  <span className="block">{tab.label}</span>
                  <span className="text-[11px] font-normal text-gray-400 mt-0.5 leading-tight hidden xl:block">
                    {tab.description}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </nav>

        {/* Tab Content */}
        <div className="flex-1 max-w-3xl">{renderTabContent()}</div>
      </div>
    </div>
  );
}
