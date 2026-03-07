"use client";

import { useState, useEffect } from "react";
import {
  BarChart3,
  Users,
  ShoppingBag,
  Heart,
  ArrowUpRight,
  FileText,
  Calendar,
  MessageSquare,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

interface Stats {
  users: { total: number; thisMonth: number; change: number };
  blog: { total: number; published: number };
  events: { total: number; upcoming: number };
  products: { total: number; active: number };
  orders: { total: number; thisMonth: number; change: number };
  donations: { total: number; thisMonth: number; change: number };
  messages: { total: number; unread: number };
  revenue: { thisMonth: number; lastMonth: number; change: number };
  donationSum: { thisMonth: number; lastMonth: number; change: number };
}

function SimpleBarChart({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end gap-3 h-40">
      {data.map((d) => (
        <div key={d.label} className="flex-1 flex flex-col items-center gap-2">
          <span className="text-[10px] text-gray-500">{d.value.toLocaleString()}</span>
          <div
            className="w-full rounded-t-md bg-linear-to-t from-orange-500/60 to-orange-400 transition-all"
            style={{ height: `${Math.max((d.value / max) * 100, 4)}%` }}
          />
          <span className="text-xs text-gray-500">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/stats");
      if (!res.ok) throw new Error();
      setStats(await res.json());
    } catch {
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-red-400 text-sm">Failed to load analytics</p>
        <Button variant="outline" onClick={fetchStats}><RefreshCw className="w-4 h-4" />Retry</Button>
      </div>
    );
  }

  const keyMetrics = [
    { label: "Total Members", value: stats.users.total.toLocaleString(), change: `+${stats.users.change}%`, icon: Users },
    { label: "Revenue (This Month)", value: formatCurrency(stats.revenue.thisMonth / 100), change: `${stats.revenue.change >= 0 ? "+" : ""}${stats.revenue.change}%`, icon: ShoppingBag },
    { label: "Donations (This Month)", value: formatCurrency(stats.donationSum.thisMonth / 100), change: `${stats.donationSum.change >= 0 ? "+" : ""}${stats.donationSum.change}%`, icon: Heart },
    { label: "Total Orders", value: stats.orders.total.toLocaleString(), change: `${stats.orders.change >= 0 ? "+" : ""}${stats.orders.change}%`, icon: ShoppingBag },
  ];

  const overviewData = [
    { label: "Users", value: stats.users.total },
    { label: "Posts", value: stats.blog.total },
    { label: "Events", value: stats.events.total },
    { label: "Products", value: stats.products.total },
    { label: "Orders", value: stats.orders.total },
    { label: "Donations", value: stats.donations.total },
  ];

  const summaryItems = [
    { label: "Published Posts", value: `${stats.blog.published} / ${stats.blog.total}`, icon: FileText },
    { label: "Upcoming Events", value: `${stats.events.upcoming} / ${stats.events.total}`, icon: Calendar },
    { label: "Active Products", value: `${stats.products.active} / ${stats.products.total}`, icon: ShoppingBag },
    { label: "Unread Messages", value: `${stats.messages.unread} / ${stats.messages.total}`, icon: MessageSquare },
    { label: "Members This Month", value: stats.users.thisMonth.toLocaleString(), icon: Users },
    { label: "Orders This Month", value: stats.orders.thisMonth.toLocaleString(), icon: ShoppingBag },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-display">Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">Platform performance metrics and insights.</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchStats}><RefreshCw className="w-3.5 h-3.5" />Refresh</Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {keyMetrics.map((metric) => (
          <Card key={metric.label} variant="admin">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <metric.icon className="w-5 h-5 text-orange-500" />
                <span className="flex items-center gap-0.5 text-xs text-green-500 font-medium">
                  <ArrowUpRight className="w-3 h-3" />{metric.change}
                </span>
              </div>
              <p className="text-xs text-gray-500">{metric.label}</p>
              <p className="text-xl font-bold text-gray-900 font-display mt-1">{metric.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Overview Chart */}
        <Card variant="admin" className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-orange-500" />
              Platform Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleBarChart data={overviewData} />
          </CardContent>
        </Card>

        {/* Summary */}
        <Card variant="admin">
          <CardHeader><CardTitle className="text-lg">Summary</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {summaryItems.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <item.icon className="w-4 h-4 text-gray-400" />
                    <p className="text-sm text-gray-700">{item.label}</p>
                  </div>
                  <span className="text-sm text-gray-900 font-medium">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
