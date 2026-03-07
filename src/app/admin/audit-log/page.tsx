"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Shield,
  Search,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  Globe,
  FileText,
  Calendar,
  ShoppingBag,
  Heart,
  MessageSquare,
  Settings,
  LogIn,
  Trash2,
  Edit,
  Plus,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AuditLog {
  id: string;
  adminId: string;
  action: string;
  entity: string;
  entityId: string | null;
  details: Record<string, unknown> | null;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
  admin: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    avatar: string | null;
  };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

const ACTIONS = [
  "CREATE",
  "UPDATE",
  "DELETE",
  "LOGIN",
  "LOGOUT",
  "EXPORT",
  "STATUS_CHANGE",
  "ROLE_CHANGE",
  "SETTINGS_UPDATE",
  "BULK_ACTION",
];

const ENTITIES = [
  "User",
  "BlogPost",
  "Event",
  "Product",
  "Order",
  "Donation",
  "ContactMessage",
  "SiteSetting",
  "Session",
  "DonationCampaign",
];

const actionIcons: Record<string, typeof Plus> = {
  CREATE: Plus,
  UPDATE: Edit,
  DELETE: Trash2,
  LOGIN: LogIn,
  LOGOUT: LogIn,
  EXPORT: Eye,
  STATUS_CHANGE: RefreshCw,
  ROLE_CHANGE: Shield,
  SETTINGS_UPDATE: Settings,
  BULK_ACTION: FileText,
};

const actionColors: Record<string, string> = {
  CREATE: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  UPDATE: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  DELETE: "text-red-400 bg-red-500/10 border-red-500/20",
  LOGIN: "text-orange-400 bg-orange-500/10 border-orange-500/20",
  LOGOUT: "text-gray-500 bg-gray-500/10 border-gray-500/20",
  EXPORT: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  STATUS_CHANGE: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  ROLE_CHANGE: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
  SETTINGS_UPDATE: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
  BULK_ACTION: "text-pink-400 bg-pink-500/10 border-pink-500/20",
};

const entityIcons: Record<string, typeof User> = {
  User: User,
  BlogPost: FileText,
  Event: Calendar,
  Product: ShoppingBag,
  Order: ShoppingBag,
  Donation: Heart,
  ContactMessage: MessageSquare,
  SiteSetting: Settings,
  Session: Globe,
  DonationCampaign: Heart,
};

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 25,
    total: 0,
    pages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    action: "",
    entity: "",
    from: "",
    to: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const fetchLogs = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: "25",
        });
        if (filters.action) params.set("action", filters.action);
        if (filters.entity) params.set("entity", filters.entity);
        if (filters.from) params.set("from", filters.from);
        if (filters.to) params.set("to", filters.to);

        const res = await fetch(`/api/admin/audit-log?${params}`);
        const data = await res.json();
        setLogs(data.logs || []);
        setPagination(data.pagination || { page: 1, limit: 25, total: 0, pages: 0 });
      } catch (err) {
        console.error("Failed to fetch audit logs:", err);
      } finally {
        setLoading(false);
      }
    },
    [filters]
  );

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-GH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatAction = (action: string) => {
    return action.replace(/_/g, " ");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">
            Audit Log
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Track all admin actions and system changes
          </p>
        </div>
        <button
          onClick={() => fetchLogs(pagination.page)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 w-full px-5 py-3 text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          <Filter className="w-4 h-4" />
          Filters
          {(filters.action || filters.entity || filters.from || filters.to) && (
            <span className="ml-1 px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-500 text-xs font-medium">
              Active
            </span>
          )}
        </button>

        {showFilters && (
          <div className="px-5 pb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 border-t border-gray-200 pt-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Action</label>
              <select
                value={filters.action}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, action: e.target.value }))
                }
                className="w-full px-3 py-2 text-sm rounded-lg bg-white border border-gray-300 text-gray-700 focus:outline-none focus:border-orange-500/50"
              >
                <option value="">All Actions</option>
                {ACTIONS.map((a) => (
                  <option key={a} value={a}>
                    {a.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Entity</label>
              <select
                value={filters.entity}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, entity: e.target.value }))
                }
                className="w-full px-3 py-2 text-sm rounded-lg bg-white border border-gray-300 text-gray-700 focus:outline-none focus:border-orange-500/50"
              >
                <option value="">All Entities</option>
                {ENTITIES.map((e) => (
                  <option key={e} value={e}>
                    {e}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1.5">From</label>
              <input
                type="date"
                value={filters.from}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, from: e.target.value }))
                }
                className="w-full px-3 py-2 text-sm rounded-lg bg-white border border-gray-300 text-gray-700 focus:outline-none focus:border-orange-500/50"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1.5">To</label>
              <input
                type="date"
                value={filters.to}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, to: e.target.value }))
                }
                className="w-full px-3 py-2 text-sm rounded-lg bg-white border border-gray-300 text-gray-700 focus:outline-none focus:border-orange-500/50"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-4 flex gap-2 pt-2">
              <button
                onClick={() =>
                  setFilters({ action: "", entity: "", from: "", to: "" })
                }
                className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-900 bg-gray-100 rounded-lg transition-colors"
              >
                Clear Filters
              </button>
              <button
                onClick={() => fetchLogs(1)}
                className="px-3 py-1.5 text-xs text-orange-500 hover:text-orange-400 bg-orange-500/10 rounded-lg transition-colors"
              >
                Apply
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Results summary */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>
          {pagination.total} total record{pagination.total !== 1 ? "s" : ""}
        </span>
        <span>
          Page {pagination.page} of {pagination.pages || 1}
        </span>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-6 h-6 text-gray-400 animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <Shield className="w-10 h-10 mb-3 text-gray-300" />
            <p className="text-sm font-medium">No audit logs found</p>
            <p className="text-xs mt-1">
              Actions will appear here as admins use the system
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {logs.map((log) => {
              const ActionIcon = actionIcons[log.action] || Shield;
              const EntityIcon = entityIcons[log.entity] || FileText;
              const colorClass =
                actionColors[log.action] || actionColors.UPDATE;
              const isExpanded = expandedRow === log.id;

              return (
                <div key={log.id}>
                  <button
                    onClick={() =>
                      setExpandedRow(isExpanded ? null : log.id)
                    }
                    className="w-full px-5 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors text-left"
                  >
                    {/* Action icon */}
                    <div
                      className={cn(
                        "w-9 h-9 rounded-lg border flex items-center justify-center shrink-0",
                        colorClass
                      )}
                    >
                      <ActionIcon className="w-4 h-4" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={cn(
                            "text-xs font-mono font-bold uppercase tracking-wider",
                            colorClass.split(" ")[0]
                          )}
                        >
                          {formatAction(log.action)}
                        </span>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <EntityIcon className="w-3 h-3" />
                          {log.entity}
                        </div>
                        {log.entityId && (
                          <span className="text-[10px] font-mono text-gray-400 truncate max-w-32">
                            {log.entityId}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {log.admin.firstName} {log.admin.lastName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(log.createdAt)}
                        </span>
                        {log.ip && (
                          <span className="hidden sm:flex items-center gap-1">
                            <Globe className="w-3 h-3" />
                            {log.ip}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Expand indicator */}
                    <ChevronRight
                      className={cn(
                        "w-4 h-4 text-gray-400 transition-transform shrink-0",
                        isExpanded && "rotate-90"
                      )}
                    />
                  </button>

                  {/* Expanded details */}
                  {isExpanded && log.details && (
                    <div className="px-5 pb-4 pl-18">
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <p className="text-xs text-gray-500 font-medium mb-2">
                          Details
                        </p>
                        <pre className="text-xs text-gray-600 whitespace-pre-wrap wrap-break-word font-mono leading-relaxed">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                        {log.userAgent && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <p className="text-[10px] text-gray-400 truncate">
                              UA: {log.userAgent}
                            </p>
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
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => fetchLogs(pagination.page - 1)}
            disabled={pagination.page <= 1}
            className="flex items-center gap-1 px-3 py-2 text-xs text-gray-500 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-3 h-3" />
            Previous
          </button>

          {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
            let pageNum = i + 1;
            if (pagination.pages > 5) {
              const start = Math.max(
                1,
                Math.min(pagination.page - 2, pagination.pages - 4)
              );
              pageNum = start + i;
            }
            return (
              <button
                key={pageNum}
                onClick={() => fetchLogs(pageNum)}
                className={cn(
                  "w-8 h-8 text-xs rounded-lg transition-colors",
                  pageNum === pagination.page
                    ? "bg-orange-500 text-white"
                    : "text-gray-500 hover:bg-gray-100"
                )}
              >
                {pageNum}
              </button>
            );
          })}

          <button
            onClick={() => fetchLogs(pagination.page + 1)}
            disabled={pagination.page >= pagination.pages}
            className="flex items-center gap-1 px-3 py-2 text-xs text-gray-500 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Next
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
}
