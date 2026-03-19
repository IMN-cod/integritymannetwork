"use client";

import { useState, useEffect, useCallback } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import type { PieLabelRenderProps } from "recharts";
import {
  Shield, Search, Filter, Download, RefreshCw, Loader2,
  ChevronLeft, ChevronRight, Clock, Activity, AlertTriangle,
  CheckCircle2, XCircle, User, FileText, Edit3, Trash2,
  Settings, Upload, LogIn, LogOut, ShoppingBag, Heart, Calendar,
  MessageSquare, Bot, Megaphone, UserPlus, Lock, Globe,
  TrendingUp, ArrowUpRight, Hash,
  ChevronDown, X,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  details: Record<string, unknown> | null;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
  admin: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar: string | null;
  };
}

interface LoginAttempt {
  id: string;
  email: string;
  success: boolean;
  ip: string | null;
  userAgent: string | null;
  reason: string | null;
  createdAt: string;
}

interface AdminUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface StatsData {
  totalLogs: number;
  todayLogs: number;
  weekLogs: number;
  monthLogs: number;
  failedLogins24h: number;
  totalLogins: number;
  successLogins: number;
  failedLogins: number;
  actionBreakdown: { action: string; count: number }[];
  entityBreakdown: { entity: string; count: number }[];
  topAdmins: { admin: AdminUser & { avatar?: string | null }; count: number }[];
  recentLogins: LoginAttempt[];
  dailyActivity: { date: string; count: number }[];
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

const ACTION_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  CREATE: { icon: UserPlus, color: "text-green-600", bg: "bg-green-100", label: "Created" },
  UPDATE: { icon: Edit3, color: "text-blue-600", bg: "bg-blue-100", label: "Updated" },
  DELETE: { icon: Trash2, color: "text-red-600", bg: "bg-red-100", label: "Deleted" },
  LOGIN: { icon: LogIn, color: "text-emerald-600", bg: "bg-emerald-100", label: "Login" },
  LOGOUT: { icon: LogOut, color: "text-gray-600", bg: "bg-gray-100", label: "Logout" },
  EXPORT: { icon: Download, color: "text-purple-600", bg: "bg-purple-100", label: "Exported" },
  STATUS_CHANGE: { icon: Activity, color: "text-amber-600", bg: "bg-amber-100", label: "Status Changed" },
  ROLE_CHANGE: { icon: Shield, color: "text-orange-600", bg: "bg-orange-100", label: "Role Changed" },
  SETTINGS_UPDATE: { icon: Settings, color: "text-indigo-600", bg: "bg-indigo-100", label: "Settings Updated" },
  BULK_ACTION: { icon: Hash, color: "text-cyan-600", bg: "bg-cyan-100", label: "Bulk Action" },
  UPLOAD: { icon: Upload, color: "text-teal-600", bg: "bg-teal-100", label: "Uploaded" },
  BROADCAST: { icon: Megaphone, color: "text-pink-600", bg: "bg-pink-100", label: "Broadcast" },
  BOT_CREATE: { icon: Bot, color: "text-green-600", bg: "bg-green-100", label: "Bot Created" },
  BOT_UPDATE: { icon: Bot, color: "text-blue-600", bg: "bg-blue-100", label: "Bot Updated" },
  BOT_DELETE: { icon: Bot, color: "text-red-600", bg: "bg-red-100", label: "Bot Deleted" },
  SEND_MESSAGE: { icon: MessageSquare, color: "text-violet-600", bg: "bg-violet-100", label: "Message Sent" },
  CHECKIN: { icon: CheckCircle2, color: "text-lime-600", bg: "bg-lime-100", label: "Check-in" },
};

const ENTITY_ICONS: Record<string, React.ElementType> = {
  User: User,
  BlogPost: FileText,
  BlogCategory: Hash,
  BlogTag: Hash,
  Event: Calendar,
  EventRegistration: Calendar,
  Product: ShoppingBag,
  ProductCategory: Hash,
  Order: ShoppingBag,
  Donation: Heart,
  ContactMessage: MessageSquare,
  SiteSetting: Settings,
  Session: Lock,
  DonationCampaign: Heart,
  DirectMessage: MessageSquare,
  BotResponse: Bot,
  Upload: Upload,
};

const CHART_COLORS = [
  "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6",
  "#06b6d4", "#ec4899", "#14b8a6", "#f97316", "#6366f1",
];

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "numeric", minute: "2-digit", second: "2-digit",
  });
}

function formatDateTime(dateStr: string) {
  return `${formatDate(dateStr)} at ${formatTime(dateStr)}`;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(dateStr);
}

function getInitials(firstName: string, lastName: string) {
  return `${firstName[0] || ""}${lastName[0] || ""}`.toUpperCase();
}

function parseBrowser(ua: string | null): string {
  if (!ua) return "Unknown";
  if (ua.includes("Chrome") && !ua.includes("Edge")) return "Chrome";
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Safari") && !ua.includes("Chrome")) return "Safari";
  if (ua.includes("Edge")) return "Edge";
  if (ua.includes("Opera") || ua.includes("OPR")) return "Opera";
  return "Other";
}

function parseOS(ua: string | null): string {
  if (!ua) return "Unknown";
  if (ua.includes("Windows")) return "Windows";
  if (ua.includes("Mac OS")) return "macOS";
  if (ua.includes("Linux")) return "Linux";
  if (ua.includes("Android")) return "Android";
  if (ua.includes("iPhone") || ua.includes("iPad")) return "iOS";
  return "Other";
}

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

export default function AuditLogPage() {
  const [tab, setTab] = useState<"audit" | "logins" | "stats">("audit");
  const [loading, setLoading] = useState(true);

  // Audit state
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 25, total: 0, pages: 0 });
  const [adminList, setAdminList] = useState<AdminUser[]>([]);
  const [filters, setFilters] = useState({ action: "", entity: "", adminId: "", from: "", to: "", search: "" });
  const [showFilters, setShowFilters] = useState(false);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  // Login state
  const [logins, setLogins] = useState<LoginAttempt[]>([]);
  const [loginPagination, setLoginPagination] = useState<Pagination>({ page: 1, limit: 25, total: 0, pages: 0 });
  const [loginFilter, setLoginFilter] = useState<"" | "success" | "failed">("");
  const [loginSearch, setLoginSearch] = useState("");

  // Stats state
  const [stats, setStats] = useState<StatsData | null>(null);

  // ── Fetch audit logs ──
  const fetchLogs = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        view: "audit",
        page: page.toString(),
        limit: "25",
      });
      if (filters.action) params.set("action", filters.action);
      if (filters.entity) params.set("entity", filters.entity);
      if (filters.adminId) params.set("adminId", filters.adminId);
      if (filters.from) params.set("from", filters.from);
      if (filters.to) params.set("to", filters.to);
      if (filters.search) params.set("search", filters.search);

      const res = await fetch(`/api/admin/audit-log?${params}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs);
        setPagination(data.pagination);
        setAdminList(data.adminList || []);
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // ── Fetch login attempts ──
  const fetchLogins = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        view: "logins",
        page: page.toString(),
        limit: "25",
      });
      if (loginFilter) params.set("action", loginFilter);
      if (loginSearch) params.set("search", loginSearch);

      const res = await fetch(`/api/admin/audit-log?${params}`);
      if (res.ok) {
        const data = await res.json();
        setLogins(data.logins);
        setLoginPagination(data.pagination);
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, [loginFilter, loginSearch]);

  // ── Fetch stats ──
  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/audit-log?view=stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === "audit") fetchLogs(pagination.page);
    if (tab === "logins") fetchLogins(loginPagination.page);
    if (tab === "stats") fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  // ── Export CSV ──
  const exportCSV = async () => {
    const params = new URLSearchParams({ view: "audit", format: "csv" });
    if (filters.action) params.set("action", filters.action);
    if (filters.entity) params.set("entity", filters.entity);
    if (filters.adminId) params.set("adminId", filters.adminId);
    if (filters.from) params.set("from", filters.from);
    if (filters.to) params.set("to", filters.to);
    if (filters.search) params.set("search", filters.search);

    const res = await fetch(`/api/admin/audit-log?${params}`);
    if (res.ok) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit-log-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  // ── Clear filters ──
  const clearFilters = () => {
    setFilters({ action: "", entity: "", adminId: "", from: "", to: "", search: "" });
    setTimeout(() => fetchLogs(1), 0);
  };

  const hasActiveFilters = Object.values(filters).some(Boolean);

  // ═══════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-600" />
            Audit Log
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Track all administrative actions, login attempts, and security events
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={exportCSV}
            className="border-blue-200 text-blue-600 hover:bg-blue-50"
          >
            <Download className="w-4 h-4 mr-1.5" /> Export CSV
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              if (tab === "audit") fetchLogs(pagination.page);
              if (tab === "logins") fetchLogins(loginPagination.page);
              if (tab === "stats") fetchStats();
            }}
            className="border-gray-200"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* ── Tab Toggle ── */}
      <div className="flex rounded-xl bg-gray-100 p-1 max-w-lg">
        {[
          { id: "audit" as const, label: "Audit Trail", icon: Shield },
          { id: "logins" as const, label: "Login Attempts", icon: LogIn },
          { id: "stats" as const, label: "Dashboard", icon: TrendingUp },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-1.5",
              tab === t.id ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            )}
          >
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════ */}
      {/* AUDIT TRAIL TAB */}
      {/* ═══════════════════════════════════════ */}
      {tab === "audit" && (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <Card variant="admin" className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  variant="admin"
                  placeholder="Search logs by entity, admin name, or email..."
                  className="pl-10"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  onKeyDown={(e) => { if (e.key === "Enter") fetchLogs(1); }}
                />
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className={cn("border-gray-200", showFilters && "bg-blue-50 border-blue-200 text-blue-600")}
                >
                  <Filter className="w-4 h-4 mr-1" />
                  Filters
                  {hasActiveFilters && (
                    <span className="ml-1 w-5 h-5 rounded-full bg-blue-500 text-white text-[10px] flex items-center justify-center">
                      {Object.values(filters).filter(Boolean).length}
                    </span>
                  )}
                </Button>
                <Button size="sm" onClick={() => fetchLogs(1)} className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Search className="w-4 h-4 mr-1" /> Search
                </Button>
              </div>
            </div>

            {/* Expanded Filters */}
            {showFilters && (
              <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-gray-500 mb-1 uppercase tracking-wider">Action</label>
                  <select
                    value={filters.action}
                    onChange={(e) => setFilters({ ...filters, action: e.target.value })}
                    className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 text-gray-700 bg-white focus:outline-none focus:border-blue-400"
                  >
                    <option value="">All Actions</option>
                    {Object.keys(ACTION_CONFIG).map((a) => (
                      <option key={a} value={a}>{ACTION_CONFIG[a].label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-gray-500 mb-1 uppercase tracking-wider">Entity</label>
                  <select
                    value={filters.entity}
                    onChange={(e) => setFilters({ ...filters, entity: e.target.value })}
                    className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 text-gray-700 bg-white focus:outline-none focus:border-blue-400"
                  >
                    <option value="">All Entities</option>
                    {Object.keys(ENTITY_ICONS).map((e) => (
                      <option key={e} value={e}>{e}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-gray-500 mb-1 uppercase tracking-wider">Admin</label>
                  <select
                    value={filters.adminId}
                    onChange={(e) => setFilters({ ...filters, adminId: e.target.value })}
                    className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 text-gray-700 bg-white focus:outline-none focus:border-blue-400"
                  >
                    <option value="">All Admins</option>
                    {adminList.map((a) => (
                      <option key={a.id} value={a.id}>{a.firstName} {a.lastName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-gray-500 mb-1 uppercase tracking-wider">From Date</label>
                  <Input
                    variant="admin"
                    type="date"
                    value={filters.from}
                    onChange={(e) => setFilters({ ...filters, from: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-gray-500 mb-1 uppercase tracking-wider">To Date</label>
                  <Input
                    variant="admin"
                    type="date"
                    value={filters.to}
                    onChange={(e) => setFilters({ ...filters, to: e.target.value })}
                  />
                </div>
                {hasActiveFilters && (
                  <div className="sm:col-span-2 lg:col-span-5 flex justify-end">
                    <button onClick={clearFilters} className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1">
                      <X className="w-3 h-3" /> Clear all filters
                    </button>
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Results Count */}
          <div className="flex items-center justify-between text-sm">
            <p className="text-gray-500">
              Showing <span className="font-medium text-gray-900">{logs.length}</span> of{" "}
              <span className="font-medium text-gray-900">{pagination.total}</span> entries
            </p>
          </div>

          {/* Audit Log Table */}
          <Card variant="admin" className="overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
              </div>
            ) : logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Shield className="w-12 h-12 text-gray-300 mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-1">No Audit Logs</h3>
                <p className="text-sm text-gray-500">
                  {hasActiveFilters ? "No logs match your filters. Try adjusting them." : "No administrative actions have been logged yet."}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {logs.map((log) => {
                  const config = ACTION_CONFIG[log.action] || { icon: Activity, color: "text-gray-600", bg: "bg-gray-100", label: log.action };
                  const ActionIcon = config.icon;
                  const EntityIcon = ENTITY_ICONS[log.entity] || Hash;
                  const isExpanded = expandedLog === log.id;

                  return (
                    <div key={log.id}>
                      <button
                        onClick={() => setExpandedLog(isExpanded ? null : log.id)}
                        className={cn(
                          "w-full px-5 py-4 flex items-start gap-4 text-left hover:bg-gray-50/50 transition-colors",
                          isExpanded && "bg-blue-50/30"
                        )}
                      >
                        {/* Action Icon */}
                        <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5", config.bg)}>
                          <ActionIcon className={cn("w-4 h-4", config.color)} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-gray-900">{log.admin.firstName} {log.admin.lastName}</span>
                            <Badge className={cn("text-[10px] border", config.bg, config.color, config.bg.replace("100", "200"))}>
                              {config.label}
                            </Badge>
                            <span className="text-sm text-gray-500 flex items-center gap-1">
                              <EntityIcon className="w-3.5 h-3.5" />
                              {log.entity}
                            </span>
                            {log.entityId && (
                              <span className="text-[11px] text-gray-400 font-mono bg-gray-100 px-1.5 py-0.5 rounded">
                                #{log.entityId.slice(0, 8)}
                              </span>
                            )}
                          </div>

                          {/* Details preview */}
                          {log.details && typeof log.details === "object" && (
                            <p className="text-xs text-gray-500 mt-1 truncate max-w-xl">
                              {Object.entries(log.details)
                                .slice(0, 3)
                                .map(([k, v]) => `${k}: ${typeof v === "string" ? v : JSON.stringify(v)}`)
                                .join(" · ")}
                            </p>
                          )}
                        </div>

                        {/* Right side */}
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className="text-xs text-gray-400">{timeAgo(log.createdAt)}</span>
                          <div className="flex items-center gap-1.5">
                            {log.ip && (
                              <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                                <Globe className="w-3 h-3" /> {log.ip}
                              </span>
                            )}
                            <ChevronDown className={cn("w-3.5 h-3.5 text-gray-400 transition-transform", isExpanded && "rotate-180")} />
                          </div>
                        </div>
                      </button>

                      {/* Expanded Detail */}
                      {isExpanded && (
                        <div className="px-5 pb-5 bg-gray-50/50 border-t border-gray-100">
                          <div className="ml-13 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                            <div>
                              <p className="text-[10px] text-gray-400 uppercase font-medium mb-1">Timestamp</p>
                              <p className="text-sm text-gray-700">{formatDateTime(log.createdAt)}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-gray-400 uppercase font-medium mb-1">Admin</p>
                              <p className="text-sm text-gray-700">{log.admin.email}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-gray-400 uppercase font-medium mb-1">IP Address</p>
                              <p className="text-sm text-gray-700 font-mono">{log.ip || "—"}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-gray-400 uppercase font-medium mb-1">Browser / OS</p>
                              <p className="text-sm text-gray-700">
                                {parseBrowser(log.userAgent)} on {parseOS(log.userAgent)}
                              </p>
                            </div>
                            {log.entityId && (
                              <div>
                                <p className="text-[10px] text-gray-400 uppercase font-medium mb-1">Entity ID</p>
                                <p className="text-sm text-gray-700 font-mono">{log.entityId}</p>
                              </div>
                            )}
                            {log.details && Object.keys(log.details).length > 0 && (
                              <div className="sm:col-span-2 lg:col-span-4">
                                <p className="text-[10px] text-gray-400 uppercase font-medium mb-1.5">Details</p>
                                <div className="bg-white rounded-lg border border-gray-200 p-3 overflow-x-auto">
                                  <pre className="text-xs text-gray-600 font-mono whitespace-pre-wrap">
                                    {JSON.stringify(log.details, null, 2)}
                                  </pre>
                                </div>
                              </div>
                            )}
                            {log.userAgent && (
                              <div className="sm:col-span-2 lg:col-span-4">
                                <p className="text-[10px] text-gray-400 uppercase font-medium mb-1">User Agent</p>
                                <p className="text-xs text-gray-500 font-mono break-all">{log.userAgent}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">
                Page {pagination.page} of {pagination.pages}
              </p>
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pagination.page <= 1}
                  onClick={() => fetchLogs(pagination.page - 1)}
                  className="border-gray-200"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                  let pageNum: number;
                  if (pagination.pages <= 5) {
                    pageNum = i + 1;
                  } else if (pagination.page <= 3) {
                    pageNum = i + 1;
                  } else if (pagination.page >= pagination.pages - 2) {
                    pageNum = pagination.pages - 4 + i;
                  } else {
                    pageNum = pagination.page - 2 + i;
                  }
                  return (
                    <Button
                      key={pageNum}
                      size="sm"
                      variant={pageNum === pagination.page ? "default" : "outline"}
                      onClick={() => fetchLogs(pageNum)}
                      className={cn(
                        "w-8 px-0",
                        pageNum === pagination.page
                          ? "bg-blue-600 text-white hover:bg-blue-700"
                          : "border-gray-200"
                      )}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pagination.page >= pagination.pages}
                  onClick={() => fetchLogs(pagination.page + 1)}
                  className="border-gray-200"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════ */}
      {/* LOGIN ATTEMPTS TAB */}
      {/* ═══════════════════════════════════════ */}
      {tab === "logins" && (
        <div className="space-y-4">
          {/* Filters */}
          <Card variant="admin" className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  variant="admin"
                  placeholder="Search by email..."
                  className="pl-10"
                  value={loginSearch}
                  onChange={(e) => setLoginSearch(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") fetchLogins(1); }}
                />
              </div>
              <div className="flex items-center gap-2">
                {(["", "success", "failed"] as const).map((f) => (
                  <button
                    key={f || "all"}
                    onClick={() => { setLoginFilter(f); setTimeout(() => fetchLogins(1), 0); }}
                    className={cn(
                      "text-xs px-3 py-2 rounded-lg transition-colors capitalize",
                      loginFilter === f
                        ? "bg-blue-100 text-blue-600 font-medium"
                        : "text-gray-500 hover:bg-gray-100"
                    )}
                  >
                    {f === "" ? "All" : f === "success" ? "Successful" : "Failed"}
                  </button>
                ))}
                <Button size="sm" onClick={() => fetchLogins(1)} className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Search className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>

          {/* Login Attempts Table */}
          <Card variant="admin" className="overflow-hidden">
            {/* Header */}
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 grid grid-cols-12 gap-4 text-[11px] font-medium text-gray-500 uppercase tracking-wider">
              <div className="col-span-1">Status</div>
              <div className="col-span-3">Email</div>
              <div className="col-span-2">IP Address</div>
              <div className="col-span-2">Browser/OS</div>
              <div className="col-span-2">Reason</div>
              <div className="col-span-2">Time</div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
              </div>
            ) : logins.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <LogIn className="w-12 h-12 text-gray-300 mb-3" />
                <p className="text-sm text-gray-500">No login attempts found</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {logins.map((login) => (
                  <div key={login.id} className="px-5 py-3.5 grid grid-cols-12 gap-4 items-center hover:bg-gray-50/50 transition-colors">
                    <div className="col-span-1">
                      {login.success ? (
                        <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center">
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-red-100 flex items-center justify-center">
                          <XCircle className="w-4 h-4 text-red-600" />
                        </div>
                      )}
                    </div>
                    <div className="col-span-3">
                      <p className="text-sm font-medium text-gray-900 truncate">{login.email}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-gray-500 font-mono">{login.ip || "—"}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-gray-500">
                        {parseBrowser(login.userAgent)} / {parseOS(login.userAgent)}
                      </p>
                    </div>
                    <div className="col-span-2">
                      {login.reason ? (
                        <Badge className={cn(
                          "text-[10px]",
                          login.success
                            ? "bg-green-100 text-green-600 border-green-200"
                            : "bg-red-100 text-red-600 border-red-200"
                        )}>
                          {login.reason.replace(/_/g, " ")}
                        </Badge>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-gray-500">{timeAgo(login.createdAt)}</p>
                      <p className="text-[10px] text-gray-400">{formatTime(login.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Pagination */}
          {loginPagination.pages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">
                Page {loginPagination.page} of {loginPagination.pages} ({loginPagination.total} total)
              </p>
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={loginPagination.page <= 1}
                  onClick={() => fetchLogins(loginPagination.page - 1)}
                  className="border-gray-200"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={loginPagination.page >= loginPagination.pages}
                  onClick={() => fetchLogins(loginPagination.page + 1)}
                  className="border-gray-200"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════ */}
      {/* STATS DASHBOARD TAB */}
      {/* ═══════════════════════════════════════ */}
      {tab === "stats" && (
        <div className="space-y-6">
          {loading || !stats ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
            </div>
          ) : (
            <>
              {/* KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: "Total Events", value: stats.totalLogs, icon: Shield, color: "blue" },
                  { label: "Today", value: stats.todayLogs, icon: Clock, color: "green" },
                  { label: "This Week", value: stats.weekLogs, icon: TrendingUp, color: "purple" },
                  { label: "Failed Logins (24h)", value: stats.failedLogins24h, icon: AlertTriangle, color: stats.failedLogins24h > 10 ? "red" : "amber" },
                ].map((kpi) => (
                  <Card key={kpi.label} variant="admin" className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className={cn(
                        "w-9 h-9 rounded-xl flex items-center justify-center",
                        kpi.color === "blue" && "bg-blue-100",
                        kpi.color === "green" && "bg-green-100",
                        kpi.color === "purple" && "bg-purple-100",
                        kpi.color === "amber" && "bg-amber-100",
                        kpi.color === "red" && "bg-red-100",
                      )}>
                        <kpi.icon className={cn(
                          "w-4 h-4",
                          kpi.color === "blue" && "text-blue-600",
                          kpi.color === "green" && "text-green-600",
                          kpi.color === "purple" && "text-purple-600",
                          kpi.color === "amber" && "text-amber-600",
                          kpi.color === "red" && "text-red-600",
                        )} />
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{kpi.value.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">{kpi.label}</p>
                  </Card>
                ))}
              </div>

              {/* Login Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card variant="admin" className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                      <LogIn className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-gray-900">{stats.totalLogins}</p>
                      <p className="text-xs text-gray-500">Total Login Attempts</p>
                    </div>
                  </div>
                </Card>
                <Card variant="admin" className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-gray-900">{stats.successLogins}</p>
                      <p className="text-xs text-gray-500">Successful Logins</p>
                    </div>
                  </div>
                </Card>
                <Card variant="admin" className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                      <XCircle className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-gray-900">{stats.failedLogins}</p>
                      <p className="text-xs text-gray-500">Failed Logins</p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Daily Activity Chart */}
                <Card variant="admin" className="p-5">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-blue-600" /> Daily Activity (30 days)
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={stats.dailyActivity}>
                        <defs>
                          <linearGradient id="activityGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 10, fill: "#9ca3af" }}
                          tickFormatter={(v) => new Date(v).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        />
                        <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} />
                        <Tooltip
                          contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
                          labelFormatter={(v) => formatDate(v)}
                        />
                        <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} fill="url(#activityGrad)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                {/* Action Breakdown */}
                <Card variant="admin" className="p-5">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-blue-600" /> Action Breakdown
                  </h3>
                  {stats.actionBreakdown.length > 0 ? (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={stats.actionBreakdown}
                            dataKey="count"
                            nameKey="action"
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={85}
                            paddingAngle={2}
                            label={(props: PieLabelRenderProps) => `${props.name || ""} (${props.value || 0})`}
                          >
                            {stats.actionBreakdown.map((_, i) => (
                              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-64 flex items-center justify-center text-sm text-gray-400">No data yet</div>
                  )}
                </Card>
              </div>

              {/* Entity Breakdown & Top Admins */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Entity Breakdown */}
                <Card variant="admin" className="p-5">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Hash className="w-4 h-4 text-blue-600" /> Entity breakdown
                  </h3>
                  {stats.entityBreakdown.length > 0 ? (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.entityBreakdown} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                          <XAxis type="number" tick={{ fontSize: 10, fill: "#9ca3af" }} />
                          <YAxis type="category" dataKey="entity" tick={{ fontSize: 10, fill: "#6b7280" }} width={100} />
                          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }} />
                          <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={18} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-64 flex items-center justify-center text-sm text-gray-400">No data yet</div>
                  )}
                </Card>

                {/* Top Admins */}
                <Card variant="admin" className="p-5">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-600" /> Most Active Admins
                  </h3>
                  {stats.topAdmins.length > 0 ? (
                    <div className="space-y-3">
                      {stats.topAdmins.map((item, i) => {
                        const maxCount = stats.topAdmins[0]?.count || 1;
                        const pct = Math.round((item.count / maxCount) * 100);
                        return (
                          <div key={item.admin.id || i} className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-xs font-bold text-blue-600 shrink-0">
                              {getInitials(item.admin.firstName, item.admin.lastName)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {item.admin.firstName} {item.admin.lastName}
                                </p>
                                <span className="text-xs font-medium text-gray-600">{item.count}</span>
                              </div>
                              <div className="w-full bg-gray-100 rounded-full h-1.5">
                                <div
                                  className="bg-blue-500 rounded-full h-1.5 transition-all"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center py-10 text-sm text-gray-400">No admin activity yet</div>
                  )}
                </Card>
              </div>

              {/* Recent Login Attempts */}
              <Card variant="admin" className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <LogIn className="w-4 h-4 text-blue-600" /> Recent Login Attempts
                  </h3>
                  <button
                    onClick={() => setTab("logins")}
                    className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    View All <ArrowUpRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="divide-y divide-gray-100">
                  {stats.recentLogins.map((login) => (
                    <div key={login.id} className="py-2.5 flex items-center gap-3">
                      {login.success ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                      )}
                      <span className="text-sm text-gray-700 flex-1 truncate">{login.email}</span>
                      {login.reason && (
                        <Badge className={cn("text-[10px]",
                          login.success ? "bg-green-100 text-green-600 border-green-200" : "bg-red-100 text-red-600 border-red-200"
                        )}>
                          {login.reason.replace(/_/g, " ")}
                        </Badge>
                      )}
                      <span className="text-xs text-gray-400 shrink-0">{timeAgo(login.createdAt)}</span>
                    </div>
                  ))}
                  {stats.recentLogins.length === 0 && (
                    <p className="text-center py-6 text-sm text-gray-400">No login attempts recorded yet</p>
                  )}
                </div>
              </Card>
            </>
          )}
        </div>
      )}
    </div>
  );
}
