"use client";

import { use, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Search,
  Users,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  RefreshCw,
  Mail,
  Phone,
  Ticket,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  X,
  CheckSquare,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Registration {
  id: string;
  guestName: string | null;
  guestEmail: string | null;
  guestPhone: string | null;
  ticketCount: number;
  ticketType: string | null;
  status: string;
  paidAmount: number | null;
  paymentRef: string | null;
  notes: string | null;
  checkInAt: string | null;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar: string | null;
  } | null;
}

interface EventInfo {
  id: string;
  title: string;
  slug: string;
  capacity: number | null;
  price: number;
  isFree: boolean;
  startDate: string;
  status: string;
}

interface Stats {
  total: number;
  registered: number;
  attended: number;
  cancelled: number;
  waitlisted: number;
  revenue: number;
}

const statusVariant: Record<string, "success" | "warning" | "secondary" | "destructive"> = {
  REGISTERED: "success",
  ATTENDED: "warning",
  WAITLISTED: "secondary",
  CANCELLED: "destructive",
};

const STATUS_TABS = [
  { key: "all", label: "All" },
  { key: "REGISTERED", label: "Registered" },
  { key: "ATTENDED", label: "Attended" },
  { key: "WAITLISTED", label: "Waitlisted" },
  { key: "CANCELLED", label: "Cancelled" },
];

export default function EventRegistrationsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [event, setEvent] = useState<EventInfo | null>(null);
  const [stats, setStats] = useState<Stats>({ total: 0, registered: 0, attended: 0, cancelled: 0, waitlisted: 0, revenue: 0 });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showBulkMenu, setShowBulkMenu] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "50" });
      if (searchQuery) params.set("search", searchQuery);
      if (statusFilter !== "all") params.set("status", statusFilter);
      const res = await fetch(`/api/admin/events/${id}/registrations?${params}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setRegistrations(data.registrations);
      setTotal(data.pagination.total);
      setTotalPages(data.pagination.pages);
      if (data.event) setEvent(data.event);
      if (data.stats) setStats(data.stats);
    } catch {
      setRegistrations([]);
    } finally {
      setLoading(false);
    }
  }, [id, page, searchQuery, statusFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { setPage(1); }, [searchQuery, statusFilter]);

  const handleAction = async (registrationId: string, action: string) => {
    try {
      const res = await fetch(`/api/admin/events/${id}/registrations`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationId, action }),
      });
      if (!res.ok) throw new Error();
      await fetchData();
    } catch {
      alert("Failed to update registration");
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedIds.length === 0) return;
    try {
      const res = await fetch(`/api/admin/events/${id}/registrations`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationIds: selectedIds, action }),
      });
      if (!res.ok) throw new Error();
      setSelectedIds([]);
      setShowBulkMenu(false);
      await fetchData();
    } catch {
      alert("Failed to perform bulk action");
    }
  };

  const handleDelete = async (registrationId: string) => {
    if (!confirm("Remove this registration permanently?")) return;
    try {
      const res = await fetch(`/api/admin/events/${id}/registrations`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationId }),
      });
      if (!res.ok) throw new Error();
      await fetchData();
    } catch {
      alert("Failed to delete registration");
    }
  };

  const exportCSV = () => {
    const headers = ["Name", "Email", "Phone", "Tickets", "Type", "Status", "Paid", "Payment Ref", "Check-In", "Registered At"];
    const rows = registrations.map((r) => [
      r.user ? `${r.user.firstName} ${r.user.lastName}` : r.guestName || "",
      r.user?.email || r.guestEmail || "",
      r.guestPhone || "",
      String(r.ticketCount),
      r.ticketType || "General",
      r.status,
      r.paidAmount ? String(r.paidAmount) : "0",
      r.paymentRef || "",
      r.checkInAt ? new Date(r.checkInAt).toLocaleString() : "",
      new Date(r.createdAt).toLocaleString(),
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `registrations-${event?.slug || id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleSelect = (regId: string) => {
    setSelectedIds((prev) => prev.includes(regId) ? prev.filter((i) => i !== regId) : [...prev, regId]);
  };

  const toggleSelectAll = () => {
    setSelectedIds(selectedIds.length === registrations.length ? [] : registrations.map((r) => r.id));
  };

  const getPersonName = (r: Registration) => r.user ? `${r.user.firstName} ${r.user.lastName}` : r.guestName || "Unknown";
  const getPersonEmail = (r: Registration) => r.user?.email || r.guestEmail || "";

  const statCards = [
    { label: "Total", value: stats.total, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Registered", value: stats.registered, icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Attended", value: stats.attended, icon: UserCheck, color: "text-orange-600", bg: "bg-orange-50" },
    { label: "Revenue", value: formatCurrency(stats.revenue), icon: DollarSign, color: "text-purple-600", bg: "bg-purple-50" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/admin/events")} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900 font-display">Registrations</h1>
            {event && <p className="text-xs text-gray-500 mt-0.5">{event.title}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV}><Download className="w-4 h-4" />Export CSV</Button>
          <Link href={`/admin/events/${id}/edit`}>
            <Button variant="outline" size="sm">Edit Event</Button>
          </Link>
        </div>
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

      {/* Table */}
      <Card variant="admin">
        <CardHeader className="pb-0">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-1 overflow-x-auto">
              {STATUS_TABS.map((tab) => {
                const count = tab.key === "all" ? stats.total : stats[tab.key.toLowerCase() as keyof Stats];
                return (
                  <button key={tab.key} onClick={() => setStatusFilter(tab.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                      statusFilter === tab.key ? "bg-orange-500 text-white" : "text-gray-500 hover:bg-gray-100"
                    }`}>
                    {tab.label} {typeof count === "number" && <span className="opacity-70">({count})</span>}
                  </button>
                );
              })}
            </div>
            <div className="flex-1" />
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input variant="admin" placeholder="Search registrations..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
            </div>
            <Button variant="outline" size="sm" onClick={fetchData}><RefreshCw className="w-3.5 h-3.5" /></Button>
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
                  <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1">
                    <button onClick={() => handleBulkAction("checkin")} className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50">Check In All</button>
                    <button onClick={() => handleBulkAction("cancel")} className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50">Cancel All</button>
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
                        <input type="checkbox" checked={registrations.length > 0 && selectedIds.length === registrations.length} onChange={toggleSelectAll}
                          className="rounded border-gray-300 text-orange-500 focus:ring-orange-500" />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attendee</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tickets</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paid</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registered</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {registrations.map((reg) => (
                      <tr key={reg.id} className={`hover:bg-gray-50/80 transition-colors ${selectedIds.includes(reg.id) ? "bg-orange-50/50" : ""}`}>
                        <td className="px-4 py-3">
                          <input type="checkbox" checked={selectedIds.includes(reg.id)} onChange={() => toggleSelect(reg.id)}
                            className="rounded border-gray-300 text-orange-500 focus:ring-orange-500" />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                              {reg.user?.avatar ? (
                                <img src={reg.user.avatar} alt="" className="w-full h-full object-cover rounded-full" />
                              ) : (
                                <Users className="w-4 h-4 text-gray-400" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{getPersonName(reg)}</p>
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                {getPersonEmail(reg) && (
                                  <span className="flex items-center gap-1 truncate"><Mail className="w-3 h-3" />{getPersonEmail(reg)}</span>
                                )}
                                {reg.guestPhone && (
                                  <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{reg.guestPhone}</span>
                                )}
                              </div>
                              {!reg.user && <span className="text-[10px] text-gray-400">Guest</span>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 text-sm">
                            <Ticket className="w-3.5 h-3.5 text-orange-500" />
                            <span className="font-medium">{reg.ticketCount}</span>
                            {reg.ticketType && reg.ticketType !== "General" && (
                              <span className="text-xs text-gray-400">({reg.ticketType})</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={statusVariant[reg.status] || "secondary"}>
                            {reg.status}
                          </Badge>
                          {reg.checkInAt && (
                            <p className="text-[10px] text-gray-400 mt-0.5">
                              Checked in {new Date(reg.checkInAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {reg.paidAmount && Number(reg.paidAmount) > 0 ? (
                            <span className="font-medium text-gray-900">{formatCurrency(Number(reg.paidAmount))}</span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                          {reg.paymentRef && (
                            <p className="text-[10px] text-gray-400 mt-0.5 truncate max-w-25">{reg.paymentRef}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {formatDate(reg.createdAt, { month: "short", day: "numeric", year: "numeric" })}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-0.5">
                            {reg.status !== "ATTENDED" && (
                              <Button variant="ghost" size="icon" title="Check In" onClick={() => handleAction(reg.id, "checkin")}>
                                <UserCheck className="w-4 h-4 text-emerald-500" />
                              </Button>
                            )}
                            {reg.status !== "CANCELLED" && (
                              <Button variant="ghost" size="icon" title="Cancel" onClick={() => handleAction(reg.id, "cancel")}>
                                <XCircle className="w-4 h-4 text-red-400" />
                              </Button>
                            )}
                            {reg.status === "CANCELLED" && (
                              <Button variant="ghost" size="icon" title="Re-register" onClick={() => handleAction(reg.id, "register")}>
                                <CheckCircle className="w-4 h-4 text-emerald-500" />
                              </Button>
                            )}
                            <Button variant="ghost" size="icon" title="Delete" onClick={() => handleDelete(reg.id)}>
                              <X className="w-4 h-4 text-gray-400" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {registrations.length === 0 && (
                <div className="text-center py-16">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm font-medium text-gray-700 mb-1">No registrations yet</p>
                  <p className="text-xs text-gray-500">Registrations will appear here once people book this event.</p>
                </div>
              )}

              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500">Showing {registrations.length} of {total}</p>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm text-gray-600 px-2">Page {page} of {totalPages}</span>
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
