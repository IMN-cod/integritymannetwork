"use client";

import { useState, useEffect } from "react";
import { Save, Globe, Mail, Bell, Shield, Loader2, RefreshCw, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [siteName, setSiteName] = useState("The Integrity Man Network");
  const [tagline, setTagline] = useState("A Community for Men of Integrity & Purpose");
  const [siteDescription, setSiteDescription] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notifyNewMembers, setNotifyNewMembers] = useState(true);
  const [notifyDonations, setNotifyDonations] = useState(true);
  const [notifyMessages, setNotifyMessages] = useState(true);
  const [notifyOrders, setNotifyOrders] = useState(true);
  const [notifyEvents, setNotifyEvents] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [allowRegistration, setAllowRegistration] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/admin/settings");
        if (!res.ok) throw new Error();
        const data = await res.json();
        const s = data.settings || {};
        if (s.siteName) setSiteName(s.siteName);
        if (s.tagline) setTagline(s.tagline);
        if (s.siteDescription) setSiteDescription(s.siteDescription);
        if (s.adminEmail) setAdminEmail(s.adminEmail);
        if (s.phone) setPhone(s.phone);
        if (s.address) setAddress(s.address);
        if (s.notifyNewMembers !== undefined) setNotifyNewMembers(s.notifyNewMembers === "true");
        if (s.notifyDonations !== undefined) setNotifyDonations(s.notifyDonations === "true");
        if (s.notifyMessages !== undefined) setNotifyMessages(s.notifyMessages === "true");
        if (s.notifyOrders !== undefined) setNotifyOrders(s.notifyOrders === "true");
        if (s.notifyEvents !== undefined) setNotifyEvents(s.notifyEvents === "true");
        if (s.maintenanceMode !== undefined) setMaintenanceMode(s.maintenanceMode === "true");
        if (s.allowRegistration !== undefined) setAllowRegistration(s.allowRegistration === "true");
      } catch {
        // Use defaults
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings: {
            siteName,
            tagline,
            siteDescription,
            adminEmail,
            phone,
            address,
            notifyNewMembers: String(notifyNewMembers),
            notifyDonations: String(notifyDonations),
            notifyMessages: String(notifyMessages),
            notifyOrders: String(notifyOrders),
            notifyEvents: String(notifyEvents),
            maintenanceMode: String(maintenanceMode),
            allowRegistration: String(allowRegistration),
          },
        }),
      });
      if (!res.ok) throw new Error();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      alert("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-display">Settings</h1>
          <p className="text-sm text-gray-500 mt-1">Configure platform settings and preferences.</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? "Saved!" : "Save Changes"}
        </Button>
      </div>

      {/* General Settings */}
      <Card variant="admin">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Globe className="w-4 h-4 text-orange-500" />General
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm text-gray-500 mb-1.5">Site Name</label>
            <Input variant="admin" value={siteName} onChange={(e) => setSiteName(e.target.value)} className="max-w-md" />
          </div>
          <div>
            <label className="block text-sm text-gray-500 mb-1.5">Tagline</label>
            <Input variant="admin" value={tagline} onChange={(e) => setTagline(e.target.value)} className="max-w-md" />
          </div>
          <div>
            <label className="block text-sm text-gray-500 mb-1.5">Site Description</label>
            <Textarea variant="admin" rows={3} value={siteDescription} onChange={(e) => setSiteDescription(e.target.value)} className="max-w-md" />
          </div>
        </CardContent>
      </Card>

      {/* Contact */}
      <Card variant="admin">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Mail className="w-4 h-4 text-orange-500" />Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm text-gray-500 mb-1.5">Admin Email</label>
            <Input variant="admin" type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} className="max-w-md" placeholder="admin@integritymannetwork.org" />
          </div>
          <div>
            <label className="block text-sm text-gray-500 mb-1.5">Phone Number</label>
            <Input variant="admin" value={phone} onChange={(e) => setPhone(e.target.value)} className="max-w-md" placeholder="+234 812 345 6789" />
          </div>
          <div>
            <label className="block text-sm text-gray-500 mb-1.5">Address</label>
            <Input variant="admin" value={address} onChange={(e) => setAddress(e.target.value)} className="max-w-md" placeholder="Accra, Ghana" />
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card variant="admin">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="w-4 h-4 text-orange-500" />Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { label: "New member registrations", value: notifyNewMembers, setter: setNotifyNewMembers },
            { label: "New donations", value: notifyDonations, setter: setNotifyDonations },
            { label: "New contact messages", value: notifyMessages, setter: setNotifyMessages },
            { label: "Store orders", value: notifyOrders, setter: setNotifyOrders },
            { label: "Event registrations", value: notifyEvents, setter: setNotifyEvents },
          ].map((pref) => (
            <label key={pref.label} className="flex items-center gap-3 cursor-pointer group">
              <input type="checkbox" checked={pref.value} onChange={(e) => pref.setter(e.target.checked)} className="w-4 h-4 rounded bg-white border-gray-300 text-orange-500 focus:ring-orange-500/20" />
              <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">{pref.label}</span>
            </label>
          ))}
        </CardContent>
      </Card>

      {/* Security */}
      <Card variant="admin">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="w-4 h-4 text-orange-500" />Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm text-gray-500 mb-1.5">Maintenance Mode</label>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input type="checkbox" checked={maintenanceMode} onChange={(e) => setMaintenanceMode(e.target.checked)} className="w-4 h-4 rounded bg-white border-gray-300 text-orange-500 focus:ring-orange-500/20" />
              <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">Enable maintenance mode (shows a maintenance page to visitors)</span>
            </label>
          </div>
          <div>
            <label className="block text-sm text-gray-500 mb-1.5">Registration</label>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input type="checkbox" checked={allowRegistration} onChange={(e) => setAllowRegistration(e.target.checked)} className="w-4 h-4 rounded bg-white border-gray-300 text-orange-500 focus:ring-orange-500/20" />
              <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">Allow public user registration</span>
            </label>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
