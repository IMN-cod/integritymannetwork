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
  { label: string; variant: "success" | "warning" | "destructive"; icon: typeof CheckCircle2; color: string }
> = {
  PAID: { label: "Paid", variant: "success", icon: CheckCircle2, color: "text-emerald-600" },
  PENDING: { label: "Pending", variant: "warning", icon: Clock, color: "text-amber-600" },
  FAILED: { label: "Failed", variant: "destructive", icon: XCircle, color: "text-red-600" },
  REFUNDED: { label: "Refunded", variant: "destructive", icon: XCircle, color: "text-gray-600" },
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

  useEffect(() => {
    fetchDonations();
  }, [fetchDonations]);

  const monthTrend =
    stats && stats.lastMonth > 0
      ? ((stats.thisMonth - stats.lastMonth) / stats.lastMonth) * 100
      : stats?.thisMonth && stats.thisMonth > 0
        ? 100
        : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-display">Donations</h1>
          <p className="text-sm text-gray-500 mt-1">Track payments, verify transactions, and manage donor records.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => fetchDonations()}>
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card variant="admin" className="relative overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(stats.total)}</p>
                  <p className="text-xs text-gray-400 mt-1">{stats.paid} paid donations</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card variant="admin" className="relative overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">This Month</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(stats.thisMonth)}</p>
                  <div className="flex items-center gap-1 mt-1">
                    {monthTrend >= 0 ? (
                      <ArrowUpRight className="w-3 h-3 text-emerald-500" />
                    ) : (
                      <TrendingDown className="w-3 h-3 text-red-500" />
                    )}
                    <span className={`text-xs font-medium ${monthTrend >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                      {monthTrend >= 0 ? "+" : ""}{monthTrend.toFixed(1)}% vs last month
                    </span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card variant="admin" className="relative overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Recurring Donors</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stats.recurringDonors}</p>
                  <p className="text-xs text-gray-400 mt-1">Active subscriptions</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                  <Users className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card variant="admin" className="relative overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Needs Attention</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stats.pending + stats.failed}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-amber-600">{stats.pending} pending</span>
                    <span className="text-xs text-gray-300">&middot;</span>
                    <span className="text-xs text-red-600">{stats.failed} failed</span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                  <Clock className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
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

      {/* Donations Tab */}
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
                      <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
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
                                selectedDonation?.id === donation.id ? "bg-orange-50/50" : ""
                              }`}
                              onClick={() => {
                                setSelectedDonation(donation);
                                setVerifyResult(null);
                              }}
                            >
                              <td className="px-5 py-3.5">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                                    <span className="text-xs font-bold text-orange-600">
                                      {donation.anonymous
                                        ? "A"
                                        : donation.user
                                          ? `${donation.user.firstName[0]}${donation.user.lastName[0]}`
                                          : "G"}
                                    </span>
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                      {donation.anonymous
                                        ? "Anonymous"
                                        : donation.user
                                          ? `${donation.user.firstName} ${donation.user.lastName}`
                                          : "Guest Donor"}
                                    </p>
                                    {!donation.anonymous && donation.user && (
                                      <p className="text-xs text-gray-400 truncate">{donation.user.email}</p>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-5 py-3.5">
                                <p className="text-sm font-bold text-gray-900">
                                  {formatCurrency(Number(donation.amount), donation.currency)}
                                </p>
                                {donation.isRecurring && (
                                  <span className="text-[10px] font-medium text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded-full">
                                    Recurring
                                  </span>
                                )}
                              </td>
                              <td className="px-5 py-3.5 hidden md:table-cell">
                                {donation.paymentId ? (
                                  <code className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded font-mono">
                                    {donation.paymentId.length > 16 ? `${donation.paymentId.slice(0, 16)}...` : donation.paymentId}
                                  </code>
                                ) : (
                                  <span className="text-xs text-gray-300">&mdash;</span>
                                )}
                              </td>
                              <td className="px-5 py-3.5 hidden sm:table-cell">
                                <Badge variant="outline" className="text-[10px] font-medium">{donation.paymentMethod}</Badge>
                              </td>
                              <td className="px-5 py-3.5">
                                <div className="flex items-center gap-1.5">
                                  <StatusIcon className={`w-3.5 h-3.5 ${statusInfo.color}`} />
                                  <Badge variant={statusInfo.variant} className="text-[10px]">{statusInfo.label}</Badge>
                                </div>
                              </td>
                              <td className="px-5 py-3.5 hidden lg:table-cell">
                                <p className="text-xs text-gray-500">{formatDate(donation.createdAt, { month: "short", day: "numeric", year: "numeric" })}</p>
                              </td>
                              <td className="px-5 py-3.5 text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
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

                    {pagination.pages > 1 && (
                      <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
                        <p className="text-xs text-gray-500">
                          Showing {(pagination.page - 1) * pagination.limit + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} donations
                        </p>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" disabled={pagination.page <= 1} onClick={() => fetchDonations(pagination.page - 1)}>
                            <ChevronLeft className="w-4 h-4" />
                          </Button>
                          <span className="text-xs text-gray-500 font-medium">{pagination.page} / {pagination.pages}</span>
                          <Button variant="outline" size="sm" disabled={pagination.page >= pagination.pages} onClick={() => fetchDonations(pagination.page + 1)}>
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

          {/* Detail Panel */}
          {selectedDonation && (
            <div className="lg:col-span-1">
              <div className="sticky top-20 space-y-4">
                <Card variant="admin">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="text-sm font-bold text-gray-900">Donation Details</h3>
                      <button onClick={() => { setSelectedDonation(null); setVerifyResult(null); }} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="text-center py-4 mb-4 rounded-xl bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100">
                      <p className="text-3xl font-bold text-gray-900">
                        {formatCurrency(Number(selectedDonation.amount), selectedDonation.currency)}
                      </p>
                      <div className="flex items-center justify-center gap-2 mt-2">
                        {(() => {
                          const info = STATUS_CONFIG[selectedDonation.status] || STATUS_CONFIG.PENDING;
                          const Icon = info.icon;
                          return (
                            <Badge variant={info.variant}>
                              <Icon className="w-3 h-3 mr-1" />
                              {info.label}
                            </Badge>
                          );
                        })()}
                        {selectedDonation.isRecurring && (
                          <Badge variant="default" className="bg-violet-100 text-violet-700 border-violet-200">Recurring</Badge>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between py-2 border-b border-gray-50">
                        <span className="text-xs text-gray-500">Donor</span>
                        <span className="text-xs font-medium text-gray-900">
                          {selectedDonation.anonymous ? "Anonymous" : selectedDonation.user ? `${selectedDonation.user.firstName} ${selectedDonation.user.lastName}` : "Guest"}
                        </span>
                      </div>
                      {!selectedDonation.anonymous && selectedDonation.user && (
                        <div className="flex items-center justify-between py-2 border-b border-gray-50">
                          <span className="text-xs text-gray-500">Email</span>
                          <span className="text-xs font-medium text-gray-900">{selectedDonation.user.email}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between py-2 border-b border-gray-50">
                        <span className="text-xs text-gray-500">Payment Method</span>
                        <Badge variant="outline" className="text-[10px]">{selectedDonation.paymentMethod}</Badge>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b border-gray-50">
                        <span className="text-xs text-gray-500">Reference</span>
                        <code className="text-xs text-gray-700 bg-gray-100 px-2 py-0.5 rounded font-mono">
                          {selectedDonation.paymentId || "\u2014"}
                        </code>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b border-gray-50">
                        <span className="text-xs text-gray-500">Date</span>
                        <span className="text-xs font-medium text-gray-900">{formatDate(selectedDonation.createdAt)}</span>
                      </div>
                      {selectedDonation.message && (
                        <div className="pt-2">
                          <span className="text-xs text-gray-500 block mb-1">Message</span>
                          <p className="text-xs text-gray-700 bg-gray-50 p-3 rounded-lg italic">
                            &ldquo;{selectedDonation.message}&rdquo;
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {selectedDonation.paymentMethod === "PAYSTACK" && selectedDonation.paymentId && (
                  <Card variant="admin">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-2 mb-4">
                        <ShieldCheck className="w-4 h-4 text-orange-500" />
                        <h3 className="text-sm font-bold text-gray-900">Paystack Verification</h3>
                      </div>

                      {!verifyResult ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => verifyDonation(selectedDonation)}
                          disabled={verifying}
                        >
                          {verifying ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> : <ShieldCheck className="w-3.5 h-3.5 mr-2" />}
                          {verifying ? "Verifying..." : "Verify with Paystack"}
                        </Button>
                      ) : (
                        <div className="space-y-3">
                          <div className={`flex items-center gap-2 p-3 rounded-lg ${
                            verifyResult.status === "success" ? "bg-emerald-50 border border-emerald-200" : "bg-red-50 border border-red-200"
                          }`}>
                            {verifyResult.status === "success" ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-600" />
                            )}
                            <span className={`text-xs font-medium ${verifyResult.status === "success" ? "text-emerald-700" : "text-red-700"}`}>
                              {verifyResult.status === "success" ? "Payment Verified" : `Status: ${verifyResult.status}`}
                            </span>
                          </div>

                          <div className="space-y-2 text-xs">
                            <div className="flex justify-between py-1.5 border-b border-gray-50">
                              <span className="text-gray-500">Amount</span>
                              <span className="font-medium text-gray-900">{formatCurrency(verifyResult.amount, verifyResult.currency)}</span>
                            </div>
                            <div className="flex justify-between py-1.5 border-b border-gray-50">
                              <span className="text-gray-500">Channel</span>
                              <div className="flex items-center gap-1">
                                {(() => {
                                  const ChannelIcon = CHANNEL_ICONS[verifyResult.channel] || CreditCard;
                                  return <ChannelIcon className="w-3 h-3 text-gray-400" />;
                                })()}
                                <span className="font-medium text-gray-900 capitalize">{verifyResult.channel.replace("_", " ")}</span>
                              </div>
                            </div>
                            <div className="flex justify-between py-1.5 border-b border-gray-50">
                              <span className="text-gray-500">Reference</span>
                              <code className="font-mono text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded">{verifyResult.reference}</code>
                            </div>
                            {verifyResult.paidAt && (
                              <div className="flex justify-between py-1.5 border-b border-gray-50">
                                <span className="text-gray-500">Paid At</span>
                                <span className="font-medium text-gray-900">{formatDate(verifyResult.paidAt, { month: "short", day: "numeric", hour: "numeric", minute: "numeric" })}</span>
                              </div>
                            )}
                            {verifyResult.customer?.email && (
                              <div className="flex justify-between py-1.5">
                                <span className="text-gray-500">Customer</span>
                                <span className="font-medium text-gray-900">{verifyResult.customer.email}</span>
                              </div>
                            )}
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

      {/* Paystack Transactions Tab */}
      {activeTab === "paystack" && (
        <Card variant="admin">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">Paystack Transactions</h3>
                <p className="text-xs text-gray-500">Live data from your Paystack account</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={fetchPaystackTransactions} disabled={paystackLoading}>
              <RefreshCw className={`w-3.5 h-3.5 ${paystackLoading ? "animate-spin" : ""}`} />
              Sync
            </Button>
          </div>

          <div className="overflow-x-auto">
            {paystackLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
              </div>
            ) : paystackTxns.length === 0 ? (
              <div className="text-center py-16">
                <ShieldCheck className="w-10 h-10 text-gray-300 mx-auto mb-3" />
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
                          <code className="text-xs font-mono text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                            {String(txn.reference || "").slice(0, 20)}
                          </code>
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="text-xs font-medium text-gray-900">{customer?.email || "\u2014"}</p>
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="text-sm font-bold text-gray-900">
                            {formatCurrency(Number(txn.amount || 0) / 100, String(txn.currency || "GHS"))}
                          </p>
                        </td>
                        <td className="px-5 py-3.5 hidden sm:table-cell">
                          <div className="flex items-center gap-1.5">
                            <ChannelIcon className="w-3.5 h-3.5 text-gray-400" />
                            <span className="text-xs text-gray-600 capitalize">{txnChannel.replace("_", " ") || "\u2014"}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <Badge
                            variant={txnStatus === "success" ? "success" : txnStatus === "failed" ? "destructive" : "warning"}
                            className="text-[10px]"
                          >
                            {txnStatus || "unknown"}
                          </Badge>
                        </td>
                        <td className="px-5 py-3.5 hidden md:table-cell">
                          <p className="text-xs text-gray-500">
                            {txn.paid_at
                              ? formatDate(String(txn.paid_at), { month: "short", day: "numeric", hour: "numeric", minute: "numeric" })
                              : txn.created_at
                                ? formatDate(String(txn.created_at), { month: "short", day: "numeric", hour: "numeric", minute: "numeric" })
                                : "\u2014"}
                          </p>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <a
                            href={`https://dashboard.paystack.com/#/transactions/${txn.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-400 hover:text-orange-500 transition-colors"
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
