"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Calendar,
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  Users,
  MapPin,
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

interface Event {
  id: string;
  title: string;
  slug: string;
  type: string;
  location: string | null;
  startDate: string;
  endDate: string | null;
  capacity: number | null;
  price: number;
  isFree: boolean;
  status: string;
  createdAt: string;
  _count: { registrations: number };
}

interface Pagination { page: number; limit: number; total: number; pages: number; }

const EVENT_TYPES = ["INTEGRITY_SUMMIT", "MENS_RETREAT", "CORPORATE_BREAKFAST", "CORPORATE_LUNCH", "WORKSHOP", "OTHER"];
const EVENT_STATUSES = ["UPCOMING", "ONGOING", "COMPLETED", "CANCELLED"];

const statusVariant: Record<string, "success" | "warning" | "secondary" | "destructive"> = {
  UPCOMING: "success",
  ONGOING: "warning",
  COMPLETED: "secondary",
  CANCELLED: "destructive",
};

export default function AdminEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, pages: 0 });
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formType, setFormType] = useState("INTEGRITY_SUMMIT");
  const [formLocation, setFormLocation] = useState("");
  const [formStartDate, setFormStartDate] = useState("");
  const [formEndDate, setFormEndDate] = useState("");
  const [formCapacity, setFormCapacity] = useState("");
  const [formPrice, setFormPrice] = useState("0");
  const [formIsFree, setFormIsFree] = useState(true);
  const [formStatus, setFormStatus] = useState("UPCOMING");

  const fetchEvents = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (searchQuery) params.set("search", searchQuery);
      const res = await fetch(`/api/admin/events?${params}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setEvents(data.events);
      setPagination(data.pagination);
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const openCreate = () => {
    setEditingEvent(null);
    setFormTitle(""); setFormDescription(""); setFormType("INTEGRITY_SUMMIT");
    setFormLocation(""); setFormStartDate(""); setFormEndDate("");
    setFormCapacity(""); setFormPrice("0"); setFormIsFree(true); setFormStatus("UPCOMING");
    setShowModal(true);
  };

  const openEdit = (event: Event) => {
    setEditingEvent(event);
    setFormTitle(event.title);
    setFormDescription("");
    setFormType(event.type);
    setFormLocation(event.location || "");
    setFormStartDate(event.startDate.slice(0, 16));
    setFormEndDate(event.endDate ? event.endDate.slice(0, 16) : "");
    setFormCapacity(event.capacity ? String(event.capacity) : "");
    setFormPrice(String(Number(event.price)));
    setFormIsFree(event.isFree);
    setFormStatus(event.status);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const body = {
        ...(editingEvent && { id: editingEvent.id }),
        title: formTitle,
        description: formDescription || "Event description",
        type: formType,
        location: formLocation || null,
        startDate: formStartDate,
        endDate: formEndDate || null,
        capacity: formCapacity || null,
        price: parseFloat(formPrice) || 0,
        isFree: formIsFree,
        ...(editingEvent && { status: formStatus }),
      };
      const res = await fetch("/api/admin/events", {
        method: editingEvent ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      setShowModal(false);
      await fetchEvents(pagination.page);
    } catch {
      alert("Failed to save event");
    } finally {
      setFormLoading(false);
    }
  };

  const deleteEvent = async (id: string) => {
    if (!confirm("Delete this event permanently?")) return;
    try {
      const res = await fetch("/api/admin/events", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error();
      await fetchEvents(pagination.page);
    } catch {
      alert("Failed to delete event");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-display">Events</h1>
          <p className="text-sm text-gray-500 mt-1">Manage events, registrations, and schedules.</p>
        </div>
        <Button onClick={openCreate}><Plus className="w-4 h-4" />New Event</Button>
      </div>

      <Card variant="admin">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input variant="admin" placeholder="Search events..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
            </div>
            <Button variant="outline" size="sm" onClick={() => fetchEvents()}><RefreshCw className="w-3.5 h-3.5" /></Button>
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registrations</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {events.map((event) => (
                      <tr key={event.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{event.title}</p>
                            {event.location && (
                              <p className="text-xs text-gray-500 flex items-center gap-1 mt-1"><MapPin className="w-3 h-3" />{event.location}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {new Date(event.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </td>
                        <td className="px-6 py-4">
                          <span className="flex items-center gap-1.5 text-sm text-gray-500">
                            <Users className="w-3.5 h-3.5 text-orange-500" />{event._count.registrations}
                            {event.capacity && <span className="text-gray-400">/ {event.capacity}</span>}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {event.isFree ? <Badge variant="outline">Free</Badge> : formatCurrency(Number(event.price))}
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={statusVariant[event.status] || "secondary"}>{event.status}</Badge>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <a href={`/events`} target="_blank" rel="noopener noreferrer">
                              <Button variant="ghost" size="icon"><Eye className="w-4 h-4" /></Button>
                            </a>
                            <Button variant="ghost" size="icon" onClick={() => openEdit(event)}><Edit className="w-4 h-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => deleteEvent(event.id)}><Trash2 className="w-4 h-4 text-red-400" /></Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {events.length === 0 && (
                <div className="text-center py-12"><Calendar className="w-10 h-10 text-gray-300 mx-auto mb-3" /><p className="text-sm text-gray-500">No events found.</p></div>
              )}

              {pagination.pages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500">Page {pagination.page} of {pagination.pages}</p>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" disabled={pagination.page <= 1} onClick={() => fetchEvents(pagination.page - 1)}><ChevronLeft className="w-4 h-4" /></Button>
                    <Button variant="outline" size="sm" disabled={pagination.page >= pagination.pages} onClick={() => fetchEvents(pagination.page + 1)}><ChevronRight className="w-4 h-4" /></Button>
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
              <h2 className="text-lg font-bold text-gray-900 font-display">{editingEvent ? "Edit Event" : "New Event"}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-900"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-500 mb-1.5">Title</label>
                <Input variant="admin" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="Event title..." required />
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1.5">Description</label>
                <Textarea variant="admin" value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="Event description..." rows={4} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-500 mb-1.5">Type</label>
                  <select value={formType} onChange={(e) => setFormType(e.target.value)}
                    className="w-full h-11 rounded-lg border border-gray-300 bg-white text-gray-700 text-sm px-3">
                    {EVENT_TYPES.map((t) => (<option key={t} value={t}>{t.replace(/_/g, " ")}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1.5">Location</label>
                  <Input variant="admin" value={formLocation} onChange={(e) => setFormLocation(e.target.value)} placeholder="City, Country" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-500 mb-1.5">Start Date</label>
                  <Input variant="admin" type="datetime-local" value={formStartDate} onChange={(e) => setFormStartDate(e.target.value)} required />
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1.5">End Date</label>
                  <Input variant="admin" type="datetime-local" value={formEndDate} onChange={(e) => setFormEndDate(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-500 mb-1.5">Capacity</label>
                  <Input variant="admin" type="number" value={formCapacity} onChange={(e) => setFormCapacity(e.target.value)} placeholder="Unlimited" />
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1.5">Price</label>
                  <Input variant="admin" type="number" step="0.01" value={formPrice} onChange={(e) => { setFormPrice(e.target.value); setFormIsFree(parseFloat(e.target.value) === 0); }} />
                </div>
                {editingEvent && (
                  <div>
                    <label className="block text-sm text-gray-500 mb-1.5">Status</label>
                    <select value={formStatus} onChange={(e) => setFormStatus(e.target.value)}
                      className="w-full h-11 rounded-lg border border-gray-300 bg-white text-gray-700 text-sm px-3">
                      {EVENT_STATUSES.map((s) => (<option key={s} value={s}>{s}</option>))}
                    </select>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3 pt-2">
                <Button type="submit" disabled={formLoading}>
                  {formLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingEvent ? "Update Event" : "Create Event"}
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
