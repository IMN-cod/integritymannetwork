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
  Star,
  ArrowUpDown,
  CheckSquare,
  MoreHorizontal,
  Clock,
  DollarSign,
  Ticket,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

interface Event {
  id: string;
  title: string;
  slug: string;
  type: string;
  location: string | null;
  coverImage: string | null;
  startDate: string;
  endDate: string | null;
  capacity: number | null;
  price: number;
  isFree: boolean;
  featured: boolean;
  status: string;
  viewCount: number;
  createdAt: string;
  _count: { registrations: number };
}

interface Stats {
  total: number;
  upcoming: number;
  ongoing: number;
  completed: number;
  cancelled: number;
  totalRegistrations: number;
  totalRevenue: number;
}

const EVENT_TYPES: Record<string, string> = {
  INTEGRITY_SUMMIT: "Integrity Summit",
  MENS_RETREAT: "Men's Retreat",
  CORPORATE_BREAKFAST: "Corporate Breakfast",
  CORPORATE_LUNCH: "Corporate Lunch",
  WORKSHOP: "Workshop",
  OTHER: "Other",
};

const statusVariant: Record<string, "success" | "warning" | "secondary" | "destructive"> = {
  UPCOMING: "success",
  ONGOING: "warning",
  COMPLETED: "secondary",
  CANCELLED: "destructive",
};

const STATUS_TABS = [
  { key: "all", label: "All Events" },
  { key: "UPCOMING", label: "Upcoming" },
  { key: "ONGOING", label: "Ongoing" },
  { key: "COMPLETED", label: "Completed" },
  { key: "CANCELLED", label: "Cancelled" },
];

export default function AdminEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, upcoming: 0, ongoing: 0, completed: 0, cancelled: 0, totalRegistrations: 0, totalRevenue: 0 });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("startDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showBulkMenu, setShowBulkMenu] = useState(false);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20", sortBy, sortOrder });
      if (searchQuery) params.set("search", searchQuery);
      if (statusFilter !== "all") params.set("status", statusFilter);
      const res = await fetch(`/api/admin/events?${params}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setEvents(data.events);
      setTotalPages(data.pagination.pages);
      setTotal(data.pagination.total);
      if (data.stats) setStats(data.stats);
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery, statusFilter, sortBy, sortOrder]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  useEffect(() => { setPage(1); }, [searchQuery, statusFilter]);

  const toggleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    setSelectedIds(selectedIds.length === events.length ? [] : events.map((e) => e.id));
  };

  const handleBulkAction = async (action: string) => {
    if (selectedIds.length === 0) return;
    if (action === "delete" && !confirm(`Delete ${selectedIds.length} event(s) permanently?`)) return;
    try {
      const res = await fetch("/api/admin/events/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, eventIds: selectedIds }),
      });
      if (!res.ok) throw new Error();
      setSelectedIds([]);
      setShowBulkMenu(false);
      await fetchEvents();
    } catch {
      alert("Failed to perform bulk action");
    }
  };

  const deleteEvent = async (id: string) => {
    if (!confirm("Delete this event permanently?")) return;
    try {
      const res = await fetch(`/api/admin/events/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      await fetchEvents();
    } catch {
      alert("Failed to delete event");
    }
  };

  const formatEventDate = (start: string, end: string | null) => {
    const s = new Date(start);
    const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" };
    if (!end) return s.toLocaleDateString("en-US", opts);
    const e = new Date(end);
    if (s.toDateString() === e.toDateString()) {
      return `${s.toLocaleDateString("en-US", opts)} · ${s.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })} – ${e.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
    }
    return `${s.toLocaleDateString("en-US", opts)} – ${e.toLocaleDateString("en-US", opts)}`;
  };

  const statCards = [
    { label: "Total Events", value: stats.total, icon: Calendar, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Upcoming", value: stats.upcoming, icon: Clock, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Registrations", value: stats.totalRegistrations, icon: Users, color: "text-orange-600", bg: "bg-orange-50" },
    { label: "Revenue", value: formatCurrency(stats.totalRevenue), icon: DollarSign, color: "text-purple-600", bg: "bg-purple-50" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-display">Event Center</h1>
          <p className="text-sm text-gray-500 mt-1">Create events, manage registrations, and track bookings.</p>
        </div>
        <Link href="/admin/events/new">
          <Button><Plus className="w-4 h-4" />New Event</Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <Card key={s.label} variant="admin">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-xs text-gray-500">{s.label}</p>
                <p className="text-lg font-bold text-gray-900">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card variant="admin">
        <CardHeader className="pb-0">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-1 overflow-x-auto">
              {STATUS_TABS.map((tab) => {
                const count = tab.key === "all" ? stats.total : stats[tab.key.toLowerCase() as keyof Stats];
                return (
                  <button
                    key={tab.key}
                    onClick={() => setStatusFilter(tab.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                      statusFilter === tab.key
                        ? "bg-orange-500 text-white"
                        : "text-gray-500 hover:bg-gray-100"
                    }`}
                  >
                    {tab.label}
                    {typeof count === "number" && <span className="ml-1.5 opacity-70">({count})</span>}
                  </button>
                );
              })}
            </div>
            <div className="flex-1" />
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input variant="admin" placeholder="Search events..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
            </div>
            <Button variant="outline" size="sm" onClick={fetchEvents}><RefreshCw className="w-3.5 h-3.5" /></Button>
          </div>

          {selectedIds.length > 0 && (
            <div className="flex items-center gap-3 mt-3 py-2 px-3 bg-orange-50 rounded-lg border border-orange-200">
              <CheckSquare className="w-4 h-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-700">{selectedIds.length} selected</span>
              <div className="flex-1" />
              <div className="relative">
                <Button variant="outline" size="sm" onClick={() => setShowBulkMenu(!showBulkMenu)}>
                  Actions <MoreHorizontal className="w-3.5 h-3.5" />
                </Button>
                {showBulkMenu && (
                  <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1">
                    <button onClick={() => handleBulkAction("upcoming")} className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50">Set Upcoming</button>
                    <button onClick={() => handleBulkAction("ongoing")} className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50">Set Ongoing</button>
                    <button onClick={() => handleBulkAction("completed")} className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50">Set Completed</button>
                    <button onClick={() => handleBulkAction("cancelled")} className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50">Cancel Events</button>
                    <button onClick={() => handleBulkAction("feature")} className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50">Feature</button>
                    <hr className="my-1" />
                    <button onClick={() => handleBulkAction("delete")} className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50">Delete</button>
                  </div>
                )}
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedIds([])}><X className="w-3.5 h-3.5" /></Button>
            </div>
          )}
        </CardHeader>

        <CardContent className="p-0 mt-4">
          {loading ? (
            <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 text-orange-500 animate-spin" /></div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-y border-gray-200 bg-gray-50/50">
                      <th className="px-4 py-3 w-10">
                        <input type="checkbox" checked={events.length > 0 && selectedIds.length === events.length} onChange={toggleSelectAll}
                          className="rounded border-gray-300 text-orange-500 focus:ring-orange-500" />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none" onClick={() => toggleSort("startDate")}>
                        <span className="inline-flex items-center gap-1">Date <ArrowUpDown className="w-3 h-3" /></span>
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bookings</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {events.map((event) => {
                      const regPercent = event.capacity ? Math.round((event._count.registrations / event.capacity) * 100) : null;
                      return (
                        <tr key={event.id} className={`hover:bg-gray-50/80 transition-colors ${selectedIds.includes(event.id) ? "bg-orange-50/50" : ""}`}>
                          <td className="px-4 py-3">
                            <input type="checkbox" checked={selectedIds.includes(event.id)} onChange={() => toggleSelect(event.id)}
                              className="rounded border-gray-300 text-orange-500 focus:ring-orange-500" />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                                {event.coverImage ? (
                                  <img src={event.coverImage} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <Calendar className="w-5 h-5 text-gray-400" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <Link href={`/admin/events/${event.id}/edit`} className="text-sm font-medium text-gray-900 hover:text-orange-600 transition-colors truncate">
                                    {event.title}
                                  </Link>
                                  {event.featured && <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />}
                                </div>
                                <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                                  <span className="px-1.5 py-0.5 bg-gray-100 rounded text-[10px]">{EVENT_TYPES[event.type] || event.type}</span>
                                  {event.location && (
                                    <span className="flex items-center gap-1 truncate"><MapPin className="w-3 h-3" />{event.location}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm text-gray-700">{formatEventDate(event.startDate, event.endDate)}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1 text-sm">
                                <Ticket className="w-3.5 h-3.5 text-orange-500" />
                                <span className="font-medium text-gray-900">{event._count.registrations}</span>
                                {event.capacity && <span className="text-gray-400">/ {event.capacity}</span>}
                              </div>
                              {regPercent !== null && (
                                <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all ${regPercent >= 90 ? "bg-red-500" : regPercent >= 60 ? "bg-amber-500" : "bg-emerald-500"}`}
                                    style={{ width: `${Math.min(regPercent, 100)}%` }}
                                  />
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {event.isFree ? (
                              <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50">Free</Badge>
                            ) : (
                              <span className="font-medium text-gray-900">{formatCurrency(Number(event.price))}</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={statusVariant[event.status] || "secondary"}>{event.status}</Badge>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-0.5">
                              <Link href={`/admin/events/${event.id}/registrations`}>
                                <Button variant="ghost" size="icon" title="View Registrations"><Users className="w-4 h-4" /></Button>
                              </Link>
                              <a href={`/events/${event.slug}`} target="_blank" rel="noopener noreferrer">
                                <Button variant="ghost" size="icon" title="Preview"><Eye className="w-4 h-4" /></Button>
                              </a>
                              <Link href={`/admin/events/${event.id}/edit`}>
                                <Button variant="ghost" size="icon" title="Edit"><Edit className="w-4 h-4" /></Button>
                              </Link>
                              <Button variant="ghost" size="icon" onClick={() => deleteEvent(event.id)} title="Delete"><Trash2 className="w-4 h-4 text-red-400" /></Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {events.length === 0 && (
                <div className="text-center py-16">
                  <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm font-medium text-gray-700 mb-1">No events found</p>
                  <p className="text-xs text-gray-500">Create your first event to get started.</p>
                  <Link href="/admin/events/new" className="inline-block mt-4">
                    <Button size="sm"><Plus className="w-4 h-4" />New Event</Button>
                  </Link>
                </div>
              )}

              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500">Showing {events.length} of {total} events</p>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      const p = totalPages <= 5 ? i + 1 : page <= 3 ? i + 1 : page >= totalPages - 2 ? totalPages - 4 + i : page - 2 + i;
                      return (
                        <Button key={p} variant={p === page ? "default" : "outline"} size="sm" onClick={() => setPage(p)}
                          className={`w-8 h-8 p-0 ${p === page ? "" : "text-gray-600"}`}>{p}</Button>
                      );
                    })}
                    <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
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
