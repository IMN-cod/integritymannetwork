"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Heart,
  TrendingUp,
  Users,
  Calendar,
  Loader2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

interface Donation {
  id: string;
  amount: number;
  currency: string;
  paymentMethod: string;
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
  recurringDonors: number;
  count: number;
}

interface Pagination { page: number; limit: number; total: number; pages: number; }

export default function AdminDonationsPage() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [stats, setStats] = useState<DonationStats | null>(null);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);

  const fetchDonations = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
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
  }, []);

  useEffect(() => { fetchDonations(); }, [fetchDonations]);

  const statCards = stats ? [
    { label: "Total Donations", value: formatCurrency(stats.total / 100), icon: Heart },
    { label: "This Month", value: formatCurrency(stats.thisMonth / 100), icon: Calendar },
    { label: "Recurring Donors", value: String(stats.recurringDonors), icon: Users },
    { label: "Total Count", value: String(stats.count), icon: TrendingUp },
  ] : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-display">Donations</h1>
          <p className="text-sm text-gray-500 mt-1">Track donations, donors, and funding campaigns.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => fetchDonations()}>
          <RefreshCw className="w-3.5 h-3.5" />Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 text-orange-500 animate-spin" /></div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((stat) => (
              <Card key={stat.label} variant="admin">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
                    <stat.icon className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">{stat.label}</p>
                    <p className="text-lg font-bold text-gray-900">{stat.value}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Donations Table */}
          <Card variant="admin">
            <CardHeader><CardTitle className="text-lg">Recent Donations</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Donor</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {donations.map((donation) => (
                      <tr key={donation.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {donation.anonymous ? "Anonymous" : donation.user ? `${donation.user.firstName} ${donation.user.lastName}` : "Guest"}
                            </p>
                            {!donation.anonymous && donation.user && (
                              <p className="text-xs text-gray-500">{donation.user.email}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 font-semibold">
                          {formatCurrency(Number(donation.amount) / 100, donation.currency)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">{donation.paymentMethod}</td>
                        <td className="px-6 py-4">
                          <Badge variant={donation.isRecurring ? "default" : "outline"}>
                            {donation.isRecurring ? "Recurring" : "One-time"}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={donation.status === "PAID" ? "success" : donation.status === "PENDING" ? "warning" : "destructive"}>
                            {donation.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {new Date(donation.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {donations.length === 0 && (
                <div className="text-center py-12"><Heart className="w-10 h-10 text-gray-300 mx-auto mb-3" /><p className="text-sm text-gray-500">No donations yet.</p></div>
              )}

              {pagination.pages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500">Page {pagination.page} of {pagination.pages}</p>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" disabled={pagination.page <= 1} onClick={() => fetchDonations(pagination.page - 1)}><ChevronLeft className="w-4 h-4" /></Button>
                    <Button variant="outline" size="sm" disabled={pagination.page >= pagination.pages} onClick={() => fetchDonations(pagination.page + 1)}><ChevronRight className="w-4 h-4" /></Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
