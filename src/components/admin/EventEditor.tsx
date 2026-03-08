"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  ArrowLeft,
  Save,
  Eye,
  Loader2,
  ImageIcon,
  X,
  Upload,
  RefreshCw,
  Trash2,
  Calendar,
  MapPin,
  Users,
  DollarSign,
  Clock,
  Star,
  Globe,
  Phone,
  Mail,
  Building2,
  Ticket,
  CheckCircle2,
  AlertCircle,
  FileText,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { slugify, formatCurrency } from "@/lib/utils";

const RichTextEditor = dynamic(() => import("@/components/admin/RichTextEditor"), { ssr: false });

const EVENT_TYPES = [
  { value: "INTEGRITY_SUMMIT", label: "Integrity Summit" },
  { value: "MENS_RETREAT", label: "Men's Retreat" },
  { value: "CORPORATE_BREAKFAST", label: "Corporate Breakfast" },
  { value: "CORPORATE_LUNCH", label: "Corporate Lunch" },
  { value: "WORKSHOP", label: "Workshop" },
  { value: "OTHER", label: "Other" },
];

const EVENT_STATUSES = [
  { value: "UPCOMING", label: "Upcoming" },
  { value: "ONGOING", label: "Ongoing" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

interface EventEditorProps {
  eventId?: string;
}

export default function EventEditor({ eventId }: EventEditorProps) {
  const router = useRouter();
  const isEditing = !!eventId;

  // Form state
  const [title, setTitle] = useState("");
  const [slug, setSlugState] = useState("");
  const [description, setDescription] = useState("");
  const [summary, setSummary] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [uploadingCover, setUploadingCover] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [type, setType] = useState("INTEGRITY_SUMMIT");
  const [status, setStatus] = useState("UPCOMING");
  const [featured, setFeatured] = useState(false);
  const [location, setLocation] = useState("");
  const [venue, setVenue] = useState("");
  const [address, setAddress] = useState("");
  const [locationUrl, setLocationUrl] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [capacity, setCapacity] = useState("");
  const [maxPerPerson, setMaxPerPerson] = useState("5");
  const [price, setPrice] = useState("0");
  const [isFree, setIsFree] = useState(true);
  const [organizer, setOrganizer] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [schedule, setSchedule] = useState("");

  // UI state
  const [activeTab, setActiveTab] = useState<"details" | "location" | "tickets" | "settings">("details");
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingEvent, setLoadingEvent] = useState(isEditing);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [registrationCount, setRegistrationCount] = useState(0);

  // Load event for editing
  useEffect(() => {
    if (!eventId) return;
    const loadEvent = async () => {
      try {
        const res = await fetch(`/api/admin/events/${eventId}`);
        if (!res.ok) throw new Error();
        const { event } = await res.json();
        setTitle(event.title);
        setSlugState(event.slug);
        setDescription(event.description || "");
        setSummary(event.summary || "");
        setCoverImage(event.coverImage || "");
        setType(event.type);
        setStatus(event.status);
        setFeatured(event.featured || false);
        setLocation(event.location || "");
        setVenue(event.venue || "");
        setAddress(event.address || "");
        setLocationUrl(event.locationUrl || "");
        setStartDate(event.startDate ? event.startDate.slice(0, 16) : "");
        setEndDate(event.endDate ? event.endDate.slice(0, 16) : "");
        setCapacity(event.capacity ? String(event.capacity) : "");
        setMaxPerPerson(String(event.maxPerPerson || 5));
        setPrice(String(Number(event.price || 0)));
        setIsFree(event.isFree);
        setOrganizer(event.organizer || "");
        setContactEmail(event.contactEmail || "");
        setContactPhone(event.contactPhone || "");
        setSchedule(event.schedule || "");
        setRegistrationCount(event._count?.registrations || 0);
      } catch {
        alert("Failed to load event");
        router.push("/admin/events");
      } finally {
        setLoadingEvent(false);
      }
    };
    loadEvent();
  }, [eventId, router]);

  // Auto-slug
  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!isEditing) {
      setSlugState(slugify(val));
    }
  };

  // Save
  const handleSave = async () => {
    if (!title.trim() || !startDate) {
      alert("Title and start date are required.");
      return;
    }

    setSaving(true);
    setSaveStatus("saving");

    const body = {
      title,
      slug,
      description: description || "<p>Event details coming soon.</p>",
      summary: summary || null,
      coverImage: coverImage || null,
      type,
      status,
      featured,
      location: location || null,
      venue: venue || null,
      address: address || null,
      locationUrl: locationUrl || null,
      startDate,
      endDate: endDate || null,
      capacity: capacity ? parseInt(capacity) : null,
      maxPerPerson: parseInt(maxPerPerson) || 5,
      price: parseFloat(price) || 0,
      isFree,
      organizer: organizer || null,
      contactEmail: contactEmail || null,
      contactPhone: contactPhone || null,
      schedule: schedule || null,
    };

    try {
      const res = await fetch(
        isEditing ? `/api/admin/events/${eventId}` : "/api/admin/events",
        {
          method: isEditing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save");
      }
      const data = await res.json();
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 3000);

      if (!isEditing) {
        router.push(`/admin/events/${data.event.id}/edit`);
      }
    } catch (err) {
      setSaveStatus("error");
      alert(err instanceof Error ? err.message : "Failed to save event");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } finally {
      setSaving(false);
    }
  };

  if (loadingEvent) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
      </div>
    );
  }

  const tabs = [
    { key: "details" as const, label: "Details", icon: FileText },
    { key: "location" as const, label: "Location", icon: MapPin },
    { key: "tickets" as const, label: "Tickets", icon: Ticket },
    { key: "settings" as const, label: "Settings", icon: Settings },
  ];

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/admin/events")} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900 font-display">{isEditing ? "Edit Event" : "New Event"}</h1>
            {isEditing && <p className="text-xs text-gray-500 mt-0.5">{registrationCount} registrations · /events/{slug}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {saveStatus === "saved" && (
            <span className="flex items-center gap-1 text-xs text-emerald-600"><CheckCircle2 className="w-3.5 h-3.5" />Saved</span>
          )}
          {saveStatus === "error" && (
            <span className="flex items-center gap-1 text-xs text-red-600"><AlertCircle className="w-3.5 h-3.5" />Error</span>
          )}
          {isEditing && (
            <a href={`/events/${slug}`} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm"><Eye className="w-4 h-4" />Preview</Button>
            </a>
          )}
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isEditing ? "Update" : "Create Event"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title & Slug */}
          <Card variant="admin">
            <CardContent className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Event Title</label>
                <Input variant="admin" value={title} onChange={(e) => handleTitleChange(e.target.value)} placeholder="e.g. The Integrity Summit 2026" className="text-lg font-medium" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">/events/</span>
                <Input variant="admin" value={slug} onChange={(e) => setSlugState(e.target.value)} className="text-xs flex-1" />
              </div>
            </CardContent>
          </Card>

          {/* Cover Image — File Upload */}
          <Card variant="admin">
            <CardContent className="p-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">Cover Image</label>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                onChange={async (e) => {
                  if (!e.target.files?.length) return;
                  setUploadingCover(true);
                  try {
                    const fd = new FormData();
                    fd.append("files", e.target.files[0]);
                    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
                    if (!res.ok) throw new Error();
                    const data = await res.json();
                    if (data.urls?.[0]) setCoverImage(data.urls[0]);
                  } catch { alert("Image upload failed"); }
                  finally { setUploadingCover(false); e.target.value = ""; }
                }}
                className="hidden"
              />
              {coverImage ? (
                <div className="relative rounded-lg overflow-hidden group">
                  <img src={coverImage} alt="Cover" className="w-full aspect-video object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button onClick={() => coverInputRef.current?.click()} className="px-4 py-2 bg-white rounded-lg text-sm font-medium text-gray-900 hover:bg-gray-100 flex items-center gap-2">
                      <RefreshCw className="w-4 h-4" />Change
                    </button>
                    <button onClick={() => setCoverImage("")} className="px-4 py-2 bg-red-500 rounded-lg text-sm font-medium text-white hover:bg-red-600 flex items-center gap-2">
                      <Trash2 className="w-4 h-4" />Remove
                    </button>
                  </div>
                  {uploadingCover && (
                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                      <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => coverInputRef.current?.click()}
                  disabled={uploadingCover}
                  className="w-full aspect-video border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-blue-400/50 hover:bg-blue-50/30 transition-all cursor-pointer group"
                >
                  {uploadingCover ? (
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-gray-300 group-hover:text-blue-500 transition-colors" />
                      <span className="text-sm text-gray-400 group-hover:text-blue-600 font-medium">Upload cover image</span>
                      <span className="text-xs text-gray-300">JPEG, PNG, WebP, GIF, AVIF · Max 5MB</span>
                    </>
                  )}
                </button>
              )}
            </CardContent>
          </Card>

          {/* Description (Rich text) */}
          <Card variant="admin">
            <CardContent className="p-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">Event Description</label>
              {showPreview ? (
                <div className="prose prose-gray max-w-none min-h-75 p-6 border border-gray-200 rounded-xl bg-gray-50">
                  <div dangerouslySetInnerHTML={{ __html: description }} />
                </div>
              ) : (
                <RichTextEditor content={description} onChange={setDescription} placeholder="Describe the event in detail..." />
              )}
              <div className="flex items-center justify-end mt-2">
                <Button variant="ghost" size="sm" onClick={() => setShowPreview(!showPreview)}>
                  <Eye className="w-3.5 h-3.5" />{showPreview ? "Edit" : "Preview"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column (1/3) — Sidebar */}
        <div className="space-y-6">
          {/* Tabs */}
          <Card variant="admin" className="overflow-hidden">
            <div className="flex border-b border-gray-200">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-3 text-xs font-medium transition-colors border-b-2 ${
                    activeTab === tab.key
                      ? "border-orange-500 text-orange-600 bg-orange-50/50"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>

            <CardContent className="p-5 space-y-4">
              {/* Details Tab */}
              {activeTab === "details" && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">Event Type</label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      className="w-full h-10 rounded-lg border border-gray-300 bg-white text-gray-700 text-sm px-3 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                    >
                      {EVENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full h-10 rounded-lg border border-gray-300 bg-white text-gray-700 text-sm px-3 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                    >
                      {EVENT_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <div className={`w-8 h-5 rounded-full transition-colors ${featured ? "bg-amber-500" : "bg-gray-300"} relative`}
                        onClick={() => setFeatured(!featured)}>
                        <div className={`w-4 h-4 rounded-full bg-white shadow-sm absolute top-0.5 transition-transform ${featured ? "translate-x-3.5" : "translate-x-0.5"}`} />
                      </div>
                      <Star className={`w-3.5 h-3.5 ${featured ? "text-amber-500" : "text-gray-400"}`} />
                      <span className="text-sm text-gray-700">Featured Event</span>
                    </label>
                  </div>
                  <hr className="border-gray-200" />
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1.5"><Clock className="w-3 h-3 inline mr-1" />Start</label>
                      <Input variant="admin" type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="text-xs" required />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1.5"><Clock className="w-3 h-3 inline mr-1" />End</label>
                      <Input variant="admin" type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="text-xs" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">Summary (short excerpt)</label>
                    <Textarea variant="admin" value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="Brief 1-2 sentence summary..." rows={3} className="text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">Schedule Info</label>
                    <Input variant="admin" value={schedule} onChange={(e) => setSchedule(e.target.value)} placeholder="e.g. Annual — November" className="text-sm" />
                  </div>
                </>
              )}

              {/* Location Tab */}
              {activeTab === "location" && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5"><MapPin className="w-3 h-3 inline mr-1" />City / Region</label>
                    <Input variant="admin" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Accra, Ghana" className="text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5"><Building2 className="w-3 h-3 inline mr-1" />Venue Name</label>
                    <Input variant="admin" value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="e.g. Kempinski Hotel Gold Coast City" className="text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">Full Address</label>
                    <Textarea variant="admin" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street address..." rows={2} className="text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5"><Globe className="w-3 h-3 inline mr-1" />Map / Location URL</label>
                    <Input variant="admin" type="url" value={locationUrl} onChange={(e) => setLocationUrl(e.target.value)} placeholder="https://maps.google.com/..." className="text-sm" />
                  </div>
                  <hr className="border-gray-200" />
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">Organizer</label>
                    <Input variant="admin" value={organizer} onChange={(e) => setOrganizer(e.target.value)} placeholder="The Integrity Man Network" className="text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5"><Mail className="w-3 h-3 inline mr-1" />Contact Email</label>
                    <Input variant="admin" type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="events@timn.org" className="text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5"><Phone className="w-3 h-3 inline mr-1" />Contact Phone</label>
                    <Input variant="admin" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="+233 ..." className="text-sm" />
                  </div>
                </>
              )}

              {/* Tickets Tab */}
              {activeTab === "tickets" && (
                <>
                  <div>
                    <label className="flex items-center gap-2 cursor-pointer mb-4">
                      <div className={`w-8 h-5 rounded-full transition-colors ${isFree ? "bg-emerald-500" : "bg-gray-300"} relative`}
                        onClick={() => { setIsFree(!isFree); if (!isFree) setPrice("0"); }}>
                        <div className={`w-4 h-4 rounded-full bg-white shadow-sm absolute top-0.5 transition-transform ${isFree ? "translate-x-3.5" : "translate-x-0.5"}`} />
                      </div>
                      <span className="text-sm text-gray-700">Free Event</span>
                    </label>
                  </div>
                  {!isFree && (
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1.5"><DollarSign className="w-3 h-3 inline mr-1" />Ticket Price (GHS)</label>
                      <Input variant="admin" type="number" step="0.01" min="0" value={price} onChange={(e) => setPrice(e.target.value)} className="text-sm" />
                      {price && parseFloat(price) > 0 && (
                        <p className="text-xs text-gray-400 mt-1">Display: {formatCurrency(parseFloat(price))}</p>
                      )}
                    </div>
                  )}
                  <hr className="border-gray-200" />
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5"><Users className="w-3 h-3 inline mr-1" />Total Capacity</label>
                    <Input variant="admin" type="number" min="1" value={capacity} onChange={(e) => setCapacity(e.target.value)} placeholder="Unlimited" className="text-sm" />
                    <p className="text-xs text-gray-400 mt-1">Leave empty for unlimited capacity.</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">Max Tickets Per Person</label>
                    <Input variant="admin" type="number" min="1" max="20" value={maxPerPerson} onChange={(e) => setMaxPerPerson(e.target.value)} className="text-sm" />
                  </div>
                  {isEditing && (
                    <>
                      <hr className="border-gray-200" />
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-xs font-medium text-gray-500 mb-2">Booking Stats</p>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-700">Registrations</span>
                          <Badge>{registrationCount}</Badge>
                        </div>
                        {capacity && (
                          <div className="mt-2">
                            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                              <span>Capacity</span>
                              <span>{Math.round((registrationCount / parseInt(capacity)) * 100)}%</span>
                            </div>
                            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div className="h-full bg-orange-500 rounded-full" style={{ width: `${Math.min((registrationCount / parseInt(capacity)) * 100, 100)}%` }} />
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </>
              )}

              {/* Settings Tab */}
              {activeTab === "settings" && (
                <>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <p className="text-xs font-medium text-amber-700 mb-1">Event URL</p>
                    <p className="text-xs text-amber-600 break-all">/events/{slug || "..."}</p>
                  </div>
                  {isEditing && (
                    <>
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-xs font-medium text-red-700 mb-2">Danger Zone</p>
                        <p className="text-xs text-red-600 mb-3">Deleting an event removes all registrations permanently.</p>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={async () => {
                            if (!confirm("Are you sure you want to delete this event? This action cannot be undone.")) return;
                            try {
                              const res = await fetch(`/api/admin/events/${eventId}`, { method: "DELETE" });
                              if (!res.ok) throw new Error();
                              router.push("/admin/events");
                            } catch {
                              alert("Failed to delete event");
                            }
                          }}
                        >
                          Delete Event
                        </Button>
                      </div>
                    </>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
