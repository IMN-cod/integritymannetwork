"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Heart,
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  Loader2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
  X,
  ShieldCheck,
  ArrowUpRight,
  CreditCard,
  Smartphone,
  Building2,
  ExternalLink,
  Filter,
  Trash2,
  AlertTriangle,
  Download,
  BarChart3,
  Wallet,
  Zap,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Donation {
  id: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  paymentId: string | null;
  status: string;
  isRecurring: boolean;
  anonymous: boolean;
  donorName: string | null;
  donorEmail: string | null;
  message: string | null;
  createdAt: string;
  user: { firstName: string; lastName: string; email: string } | null;
}

interface DonationStats {
  total: number;
  thisMonth: number;
  lastMonth: number;
  recurringDonors: number;
  count: number;
  paid: number;
  pending: number;
  failed: number;
}

interface PaystackVerifyResult {
  status: string;
  reference: string;
  amount: number;
  currency: string;
  channel: string;
  paidAt: string;
  customer: { email: string; first_name: string; last_name: string };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; variant: "success" | "warning" | "destructive"; icon: typeof CheckCircle2; color: string; bg: string }
> = {
  PAID: { label: "Paid", variant: "success", icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
  PENDING: { label: "Pending", variant: "warning", icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
  FAILED: { label: "Failed", variant: "destructive", icon: XCircle, color: "text-red-600", bg: "bg-red-50" },
  REFUNDED: { label: "Refunded", variant: "destructive", icon: XCircle, color: "text-gray-600", bg: "bg-gray-50" },
};

const CHANNEL_ICONS: Record<string, typeof CreditCard> = {
  card: CreditCard,
  mobile_money: Smartphone,
  bank_transfer: Building2,
  bank: Building2,
};

export default function AdminDonationsPage() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [stats, setStats] = useState<DonationStats | null>(null);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [methodFilter, setMethodFilter] = useState("");
  const [selectedDonation, setSelectedDonation] = useState<Donation | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<PaystackVerifyResult | null>(null);
  const [activeTab, setActiveTab] = useState<"donations" | "paystack">("donations");
  const [paystackTxns, setPaystackTxns] = useState<Record<string, unknown>[]>([]);
  const [paystackLoading, setPaystackLoading] = useState(false);
  const [showCleanup, setShowCleanup] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [cleanupResult, setCleanupResult] = useState<string | null>(null);

  const fetchDonations = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ page: String(page), limit: "20" });
        if (searchQuery) params.set("search", searchQuery);
        if (statusFilter) params.set("status", statusFilter);
        if (methodFilter) params.set("method", methodFilter);
        const res = await fetch(`/api/admin/donations?${params}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        setDonations(data.donations);
        setStats(data.stats);
        setPagination(data.pagination);
      } catch {
        setDonations([]);
      } finally {
        setLoading(false);
      }
    },
    [searchQuery, statusFilter, methodFilter]
  );

  const fetchPaystackTransactions = async () => {
    setPaystackLoading(true);
    try {
      const res = await fetch("/api/admin/donations/transactions?perPage=50");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setPaystackTxns(data.transactions || []);
    } catch {
      setPaystackTxns([]);
    } finally {
      setPaystackLoading(false);
    }
  };

  const verifyDonation = async (donation: Donation) => {
    setVerifying(true);
    setVerifyResult(null);
    try {
      const res = await fetch("/api/admin/donations/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ donationId: donation.id }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Verification failed");
      }
      const data = await res.json();
      setVerifyResult(data.paystack);
      await fetchDonations(pagination.page);
      setSelectedDonation((prev) =>
        prev ? { ...prev, status: data.donation.status } : null
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setVerifying(false);
    }
  };

  const cleanupDonations = async (status: string) => {
    setCleaning(true);
    setCleanupResult(null);
    try {
      const res = await fetch(`/api/admin/donations/cleanup?status=${status}&olderThanHours=1`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Cleanup failed");
      setCleanupResult(data.message);
      await fetchDonations(pagination.page);
    } catch (err) {
      setCleanupResult(err instanceof Error ? err.message : "Cleanup failed");
    } finally {
      setCleaning(false);
    }
  };

  useEffect(() => {
    fetchDonations();
  }, [fetchDonations]);

  const monthTrend =
    stats && stats.lastMonth > 0
      ? ((stats.thisMonth - stats.lastMonth) / stats.lastMonth) * 100
      : stats?.thisMonth && stats.thisMonth > 0
        ? 100
        : 0;

  const successRate = stats && stats.count > 0
    ? Math.round((stats.paid / stats.count) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* â•â•â• HEADER â•â•â• */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-display">Donations</h1>
          <p className="text-sm text-gray-500 mt-1">
            Track payments, verify transactions, and manage donor records.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {stats && (stats.pending > 0 || stats.failed > 0) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCleanup(!showCleanup)}
              className="text-amber-600 border-amber-200 hover:bg-amber-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clean Up
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => fetchDonations()}>
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </Button>
        </div>
      </div>

      {/* â•â•â• CLEANUP CONFIRMATION â•â•â• */}
      {showCleanup && (
        <Card variant="admin" className="border-amber-200 bg-amber-50/50">
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-gray-900 mb-1">Clean Up Stale Donations</h3>
                <p className="text-xs text-gray-600 mb-4">
                  Remove incomplete donations older than 1 hour. This cannot be undone.
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  {stats && stats.pending > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => cleanupDonations("PENDING")}
                      disabled={cleaning}
                      className="text-amber-700 border-amber-300 hover:bg-amber-100"
                    >
                      {cleaning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Clock className="w-3.5 h-3.5" />}
                      Remove {stats.pending} Pending
                    </Button>
                  )}
                  {stats && stats.failed > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => cleanupDonations("FAILED")}
                      disabled={cleaning}
                      className="text-red-700 border-red-300 hover:bg-red-100"
                    >
                      {cleaning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                      Remove {stats.failed} Failed
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => { setShowCleanup(false); setCleanupResult(null); }}
                  >
                    Cancel
                  </Button>
                </div>
                {cleanupResult && (
                  <p className="text-xs text-emerald-600 font-medium mt-3 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {cleanupResult}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* â•â•â• STATS CARDS â•â•â• */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Total Revenue */}
          <Card variant="admin" className="relative overflow-hidden lg:col-span-1">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-9 h-9 rounded-xl bg-linear-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <Wallet className="w-4.5 h-4.5 text-white" />
                </div>
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Total Revenue</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 font-display">{formatCurrency(stats.total)}</p>
              <p className="text-[10px] text-gray-400 mt-1.5">{stats.paid} confirmed payments</p>
            </CardContent>
          </Card>

          {/* This Month */}
          <Card variant="admin" className="relative overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-9 h-9 rounded-xl bg-linear-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
                  <Calendar className="w-4.5 h-4.5 text-white" />
                </div>
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">This Month</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 font-display">{formatCurrency(stats.thisMonth)}</p>
              <div className="flex items-center gap-1 mt-1.5">
                {monthTrend >= 0 ? (
                  <ArrowUpRight className="w-3 h-3 text-emerald-500" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-red-500" />
                )}
                <span className={`text-[10px] font-semibold ${monthTrend >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                  {monthTrend >= 0 ? "+" : ""}{monthTrend.toFixed(0)}%
                </span>
                <span className="text-[10px] text-gray-400">vs last month</span>
              </div>
            </CardContent>
          </Card>

          {/* Recurring Donors */}
          <Card variant="admin" className="relative overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-9 h-9 rounded-xl bg-linear-to-br from-violet-500 to-violet-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                  <Users className="w-4.5 h-4.5 text-white" />
                </div>
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Recurring</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 font-display">{stats.recurringDonors}</p>
              <p className="text-[10px] text-gray-400 mt-1.5">Active subscribers</p>
            </CardContent>
          </Card>

          {/* Success Rate */}
          <Card variant="admin" className="relative overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-9 h-9 rounded-xl bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <BarChart3 className="w-4.5 h-4.5 text-white" />
                </div>
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Success Rate</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 font-display">{successRate}%</p>
              <div className="w-full h-1.5 bg-gray-100 rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full bg-linear-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-1000"
                  style={{ width: `${successRate}%` }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Needs Attention */}
          <Card variant="admin" className="relative overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-9 h-9 rounded-xl bg-linear-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                  <Zap className="w-4.5 h-4.5 text-white" />
                </div>
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Attention</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 font-display">{stats.pending + stats.failed}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  {stats.pending} pending
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] text-red-600 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  {stats.failed} failed
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* â•â•â• TABS â•â•â• */}
      <div className="flex items-center gap-1 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("donations")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
            activeTab === "donations"
              ? "border-orange-500 text-orange-600"
              : "border-transparent text-gray-400 hover:text-gray-600"
          }`}
        >
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4" />
            All Donations
            {stats && <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full font-semibold">{stats.count}</span>}
          </div>
        </button>
        <button
          onClick={() => {
            setActiveTab("paystack");
            if (paystackTxns.length === 0) fetchPaystackTransactions();
          }}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
            activeTab === "paystack"
              ? "border-orange-500 text-orange-600"
              : "border-transparent text-gray-400 hover:text-gray-600"
          }`}
        >
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" />
            Paystack Transactions
          </div>
        </button>
      </div>

      {/* â•â•â• DONATIONS TAB â•â•â• */}
      {activeTab === "donations" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className={selectedDonation ? "lg:col-span-2" : "lg:col-span-3"}>
            <Card variant="admin">
              {/* Filters */}
              <div className="p-4 border-b border-gray-100">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      variant="admin"
                      placeholder="Search by donor, email, or reference..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="pl-8 pr-8 py-2 text-xs rounded-lg border border-gray-200 bg-white text-gray-700 focus:outline-none focus:border-orange-300 appearance-none cursor-pointer"
                      >
                        <option value="">All Status</option>
                        <option value="PAID">Paid</option>
                        <option value="PENDING">Pending</option>
                        <option value="FAILED">Failed</option>
                        <option value="REFUNDED">Refunded</option>
                      </select>
                    </div>
                    <select
                      value={methodFilter}
                      onChange={(e) => setMethodFilter(e.target.value)}
                      className="px-3 py-2 text-xs rounded-lg border border-gray-200 bg-white text-gray-700 focus:outline-none focus:border-orange-300 appearance-none cursor-pointer"
                    >
                      <option value="">All Methods</option>
                      <option value="PAYSTACK">Paystack</option>
                      <option value="STRIPE">Stripe</option>
                      <option value="PAYPAL">PayPal</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
                  </div>
                ) : donations.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                      <Heart className="w-7 h-7 text-gray-300" />
                    </div>
                    <p className="text-sm font-medium text-gray-900">No donations found</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {searchQuery || statusFilter || methodFilter
                        ? "Try adjusting your filters."
                        : "Donations will appear here when people contribute."}
                    </p>
                  </div>
                ) : (
                  <>
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50/80">
                          <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Donor</th>
                          <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                          <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Reference</th>
                          <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Method</th>
                          <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Date</th>
                          <th className="px-5 py-3 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {donations.map((donation) => {
                          const statusInfo = STATUS_CONFIG[donation.status] || STATUS_CONFIG.PENDING;
                          const StatusIcon = statusInfo.icon;
                          return (
                            <tr
                              key={donation.id}
                              className={`hover:bg-orange-50/30 transition-colors cursor-pointer ${
                                selectedDonation?.id === donation.id ? "bg-orange-50/50 ring-1 ring-inset ring-orange-200" : ""
                              }`}
                              onClick={() => {
                                setSelectedDonation(donation);
                                setVerifyResult(null);
                              }}
                            >
                              <td className="px-5 py-3.5">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-full bg-linear-to-br from-orange-100 to-amber-100 flex items-center justify-center shrink-0 ring-2 ring-white shadow-sm">
                                    <span className="text-xs font-bold text-orange-600">
                                      {donation.anonymous
                                        ? "A"
                                        : donation.user
                                          ? `${donation.user.firstName[0]}${donation.user.lastName[0]}`
                                          : donation.donorName
                                            ? donation.donorName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
                                            : "G"}
                                    </span>
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-sm font-semibold text-gray-900 truncate">
                                      {donation.anonymous
                                        ? "Anonymous"
                                        : donation.user
                                          ? `${donation.user.firstName} ${donation.user.lastName}`
                                          : donation.donorName || "Guest Donor"}
                                    </p>
                                    {!donation.anonymous && (
                                      <p className="text-[11px] text-gray-400 truncate">
                                        {donation.user?.email || donation.donorEmail || ""}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-5 py-3.5">
                                <div>
                                  <p className="text-sm font-bold text-gray-900">
                                    {formatCurrency(Number(donation.amount), donation.currency)}
                                  </p>
                                  {donation.isRecurring && (
                                    <span className="inline-flex items-center gap-1 text-[9px] font-bold text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded-full mt-0.5 uppercase tracking-wider">
                                      <RefreshCw className="w-2.5 h-2.5" />
                                      Monthly
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-5 py-3.5 hidden md:table-cell">
                                {donation.paymentId ? (
                                  <code className="text-[11px] text-gray-500 bg-gray-50 px-2 py-1 rounded-md font-mono border border-gray-100">
                                    {donation.paymentId.length > 20 ? `${donation.paymentId.slice(0, 20)}â€¦` : donation.paymentId}
                                  </code>
                                ) : (
                                  <span className="text-xs text-gray-300">â€”</span>
                                )}
                              </td>
                              <td className="px-5 py-3.5 hidden sm:table-cell">
                                <Badge variant="outline" className="text-[10px] font-semibold">{donation.paymentMethod}</Badge>
                              </td>
                              <td className="px-5 py-3.5">
                                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${statusInfo.bg}`}>
                                  <StatusIcon className={`w-3 h-3 ${statusInfo.color}`} />
                                  <span className={`text-[10px] font-bold ${statusInfo.color}`}>{statusInfo.label}</span>
                                </div>
                              </td>
                              <td className="px-5 py-3.5 hidden lg:table-cell">
                                <div>
                                  <p className="text-xs text-gray-700 font-medium">
                                    {formatDate(donation.createdAt, { month: "short", day: "numeric" })}
                                  </p>
                                  <p className="text-[10px] text-gray-400">
                                    {formatDate(donation.createdAt, { hour: "numeric", minute: "numeric" })}
                                  </p>
                                </div>
                              </td>
                              <td className="px-5 py-3.5 text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="hover:bg-orange-50"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedDonation(donation);
                                    setVerifyResult(null);
                                  }}
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>

                    {/* Pagination */}
                    {pagination.pages > 1 && (
                      <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
                        <p className="text-xs text-gray-500">
                          <span className="font-semibold text-gray-700">{(pagination.page - 1) * pagination.limit + 1}â€“{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of {pagination.total}
                        </p>
                        <div className="flex items-center gap-1">
                          <Button variant="outline" size="sm" disabled={pagination.page <= 1} onClick={() => fetchDonations(pagination.page - 1)} className="h-8 w-8 p-0">
                            <ChevronLeft className="w-4 h-4" />
                          </Button>
                          {Array.from({ length: Math.min(pagination.pages, 5) }, (_, i) => {
                            const pageNum = pagination.pages <= 5 ? i + 1 : Math.max(1, Math.min(pagination.page - 2 + i, pagination.pages));
                            return (
                              <Button
                                key={pageNum}
                                variant={pageNum === pagination.page ? "default" : "outline"}
                                size="sm"
                                className={`h-8 w-8 p-0 text-xs ${pageNum === pagination.page ? "bg-orange-500 hover:bg-orange-600 text-white" : ""}`}
                                onClick={() => fetchDonations(pageNum)}
                              >
                                {pageNum}
                              </Button>
                            );
                          })}
                          <Button variant="outline" size="sm" disabled={pagination.page >= pagination.pages} onClick={() => fetchDonations(pagination.page + 1)} className="h-8 w-8 p-0">
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </Card>
          </div>

          {/* â•â•â• DETAIL PANEL â•â•â• */}
          {selectedDonation && (
            <div className="lg:col-span-1">
              <div className="sticky top-20 space-y-4">
                {/* Donation Details */}
                <Card variant="admin">
                  <CardContent className="p-0">
                    {/* Header with gradient */}
                    <div className="relative overflow-hidden rounded-t-xl bg-linear-to-br from-orange-500 via-orange-600 to-amber-600 px-5 py-6">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                      <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
                      <div className="relative">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-[10px] font-bold text-white/70 uppercase tracking-wider">Donation</span>
                          <button onClick={() => { setSelectedDonation(null); setVerifyResult(null); }} className="text-white/60 hover:text-white transition-colors">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-3xl font-bold text-white font-display">
                          {formatCurrency(Number(selectedDonation.amount), selectedDonation.currency)}
                        </p>
                        <div className="flex items-center gap-2 mt-3">
                          {(() => {
                            const info = STATUS_CONFIG[selectedDonation.status] || STATUS_CONFIG.PENDING;
                            const Icon = info.icon;
                            return (
                              <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-white/20 text-white px-2.5 py-1 rounded-full backdrop-blur-sm">
                                <Icon className="w-3 h-3" />
                                {info.label}
                              </span>
                            );
                          })()}
                          {selectedDonation.isRecurring && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-white/20 text-white px-2.5 py-1 rounded-full backdrop-blur-sm">
                              <RefreshCw className="w-3 h-3" />
                              Monthly
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="p-5 space-y-0">
                      {[
                        {
                          label: "Donor",
                          value: selectedDonation.anonymous ? "Anonymous" : selectedDonation.user ? `${selectedDonation.user.firstName} ${selectedDonation.user.lastName}` : selectedDonation.donorName || "Guest",
                        },
                        ...(!selectedDonation.anonymous ? [{
                          label: "Email",
                          value: selectedDonation.user?.email || selectedDonation.donorEmail || "—",
                        }] : []),
                        { label: "Payment Method", value: selectedDonation.paymentMethod },
                        { label: "Reference", value: selectedDonation.paymentId || "â€”", mono: true },
                        { label: "Date", value: formatDate(selectedDonation.createdAt) },
                      ].map((item) => (
                        <div key={item.label} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                          <span className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">{item.label}</span>
                          <span className={`text-xs font-medium text-gray-900 text-right max-w-50 truncate ${(item as { mono?: boolean }).mono ? "font-mono bg-gray-50 px-2 py-0.5 rounded" : ""}`}>
                            {item.value}
                          </span>
                        </div>
                      ))}

                      {selectedDonation.message && (
                        <div className="pt-3">
                          <span className="text-[11px] text-gray-400 font-medium uppercase tracking-wider block mb-2">Message</span>
                          <div className="bg-linear-to-br from-orange-50 to-amber-50 border border-orange-100 rounded-lg p-3">
                            <p className="text-xs text-gray-700 italic leading-relaxed">
                              &ldquo;{selectedDonation.message}&rdquo;
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Paystack Verification */}
                {selectedDonation.paymentMethod === "PAYSTACK" && selectedDonation.paymentId && (
                  <Card variant="admin">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-7 h-7 rounded-lg bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                          <ShieldCheck className="w-3.5 h-3.5 text-white" />
                        </div>
                        <h3 className="text-sm font-bold text-gray-900">Paystack Verification</h3>
                      </div>

                      {!verifyResult ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full group"
                          onClick={() => verifyDonation(selectedDonation)}
                          disabled={verifying}
                        >
                          {verifying ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" />
                          ) : (
                            <ShieldCheck className="w-3.5 h-3.5 mr-2 group-hover:text-orange-500 transition-colors" />
                          )}
                          {verifying ? "Verifying..." : "Verify with Paystack"}
                        </Button>
                      ) : (
                        <div className="space-y-3">
                          <div className={`flex items-center gap-2 p-3 rounded-lg ${
                            verifyResult.status === "success"
                              ? "bg-emerald-50 border border-emerald-200"
                              : "bg-red-50 border border-red-200"
                          }`}>
                            {verifyResult.status === "success" ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                            )}
                            <span className={`text-xs font-bold ${verifyResult.status === "success" ? "text-emerald-700" : "text-red-700"}`}>
                              {verifyResult.status === "success" ? "Payment Verified âœ“" : `Status: ${verifyResult.status}`}
                            </span>
                          </div>

                          <div className="space-y-0 text-xs">
                            {[
                              { label: "Amount", value: formatCurrency(verifyResult.amount, verifyResult.currency) },
                              { label: "Channel", value: verifyResult.channel.replace("_", " "), icon: CHANNEL_ICONS[verifyResult.channel] || CreditCard },
                              { label: "Reference", value: verifyResult.reference, mono: true },
                              ...(verifyResult.paidAt ? [{ label: "Paid At", value: formatDate(verifyResult.paidAt, { month: "short", day: "numeric", hour: "numeric", minute: "numeric" }) }] : []),
                              ...(verifyResult.customer?.email ? [{ label: "Customer", value: verifyResult.customer.email }] : []),
                            ].map((item) => (
                              <div key={item.label} className="flex justify-between py-2 border-b border-gray-50 last:border-0">
                                <span className="text-gray-500">{item.label}</span>
                                <div className="flex items-center gap-1">
                                  {(item as { icon?: typeof CreditCard }).icon && (() => {
                                    const Icon = (item as { icon: typeof CreditCard }).icon;
                                    return <Icon className="w-3 h-3 text-gray-400" />;
                                  })()}
                                  <span className={`font-medium text-gray-900 capitalize ${(item as { mono?: boolean }).mono ? "font-mono text-[10px] bg-gray-50 px-1.5 py-0.5 rounded" : ""}`}>
                                    {item.value}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>

                          <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => verifyDonation(selectedDonation)} disabled={verifying}>
                            <RefreshCw className={`w-3 h-3 mr-1.5 ${verifying ? "animate-spin" : ""}`} />
                            Re-verify
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* â•â•â• PAYSTACK TRANSACTIONS TAB â•â•â• */}
      {activeTab === "paystack" && (
        <Card variant="admin">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">Paystack Transactions</h3>
                <p className="text-[11px] text-gray-500">Live data synced from your Paystack account</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {paystackTxns.length > 0 && (
                <span className="text-[10px] text-gray-400 font-semibold">{paystackTxns.length} transactions</span>
              )}
              <Button variant="outline" size="sm" onClick={fetchPaystackTransactions} disabled={paystackLoading}>
                <RefreshCw className={`w-3.5 h-3.5 ${paystackLoading ? "animate-spin" : ""}`} />
                Sync
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            {paystackLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
                <p className="text-xs text-gray-400">Fetching transactions from Paystack...</p>
              </div>
            ) : paystackTxns.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck className="w-7 h-7 text-blue-300" />
                </div>
                <p className="text-sm font-medium text-gray-900">No transactions found</p>
                <p className="text-xs text-gray-500 mt-1">Click Sync to fetch transactions from Paystack.</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50/80">
                    <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Reference</th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Channel</th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Date</th>
                    <th className="px-5 py-3 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Link</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paystackTxns.map((txn) => {
                    const txnStatus = String(txn.status || "");
                    const txnChannel = String(txn.channel || "");
                    const ChannelIcon = CHANNEL_ICONS[txnChannel] || CreditCard;
                    const customer = txn.customer as Record<string, string> | undefined;
                    return (
                      <tr key={String(txn.id)} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-3.5">
                          <code className="text-[11px] font-mono text-gray-700 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100">
                            {String(txn.reference || "").slice(0, 24)}
                          </code>
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="text-xs font-medium text-gray-900">{customer?.email || "â€”"}</p>
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="text-sm font-bold text-gray-900">
                            {formatCurrency(Number(txn.amount || 0) / 100, String(txn.currency || "GHS"))}
                          </p>
                        </td>
                        <td className="px-5 py-3.5 hidden sm:table-cell">
                          <div className="inline-flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-md">
                            <ChannelIcon className="w-3.5 h-3.5 text-gray-400" />
                            <span className="text-[11px] text-gray-600 capitalize font-medium">{txnChannel.replace("_", " ") || "â€”"}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${
                            txnStatus === "success" ? "bg-emerald-50" : txnStatus === "failed" ? "bg-red-50" : "bg-amber-50"
                          }`}>
                            {txnStatus === "success" ? (
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            ) : txnStatus === "failed" ? (
                              <XCircle className="w-3 h-3 text-red-600" />
                            ) : (
                              <Clock className="w-3 h-3 text-amber-600" />
                            )}
                            <span className={`text-[10px] font-bold capitalize ${
                              txnStatus === "success" ? "text-emerald-600" : txnStatus === "failed" ? "text-red-600" : "text-amber-600"
                            }`}>
                              {txnStatus || "unknown"}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 hidden md:table-cell">
                          <p className="text-xs text-gray-500">
                            {txn.paid_at
                              ? formatDate(String(txn.paid_at), { month: "short", day: "numeric", hour: "numeric", minute: "numeric" })
                              : txn.created_at
                                ? formatDate(String(txn.created_at), { month: "short", day: "numeric", hour: "numeric", minute: "numeric" })
                                : "â€”"}
                          </p>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <a
                            href={`https://dashboard.paystack.com/#/transactions/${txn.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-gray-400 hover:text-orange-500 hover:bg-orange-50 transition-all"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
