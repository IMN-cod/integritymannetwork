"use client";

import { useState, useEffect } from "react";
import {
  Users,
  FileText,
  Calendar,
  ShoppingBag,
  Heart,
  MessageSquare,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Loader2,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
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

interface Activity {
  type: string;
  message: string;
  time: string;
}

function timeAgo(dateString: string) {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function StatCard({
  label,
  value,
  change,
  icon: Icon,
}: {
  label: string;
  value: string;
  change: number;
  icon: React.ElementType;
}) {
  const trend = change >= 0 ? "up" : "down";
  return (
    <Card variant="admin">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-500 mb-1">{label}</p>
            <p className="text-2xl font-bold text-gray-900 font-display">{value}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
            <Icon className="w-5 h-5 text-orange-500" />
          </div>
        </div>
        <div className="mt-3 flex items-center gap-1.5">
          {trend === "up" ? (
            <ArrowUpRight className="w-3.5 h-3.5 text-green-500" />
          ) : (
            <ArrowDownRight className="w-3.5 h-3.5 text-red-500" />
          )}
          <span className={`text-xs font-medium ${trend === "up" ? "text-green-500" : "text-red-500"}`}>
            {change >= 0 ? "+" : ""}{change}%
          </span>
          <span className="text-xs text-gray-400">vs last month</span>
        </div>
      </CardContent>
    </Card>
  );
}

const quickActions = [
  { label: "New Blog Post", icon: FileText, href: "/admin/blog" },
  { label: "Add Product", icon: ShoppingBag, href: "/admin/products" },
  { label: "Create Event", icon: Calendar, href: "/admin/events" },
  { label: "View Messages", icon: MessageSquare, href: "/admin/messages" },
];

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [statsRes, activityRes] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch("/api/admin/activity"),
      ]);
      if (!statsRes.ok) throw new Error();
      const statsData = await statsRes.json();
      setStats(statsData);
      if (activityRes.ok) {
        const actData = await activityRes.json();
        setActivity(actData.activity || []);
      }
    } catch {
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-red-500">{error}</p>
        <Button onClick={fetchData} variant="secondary">
          <RefreshCw className="w-4 h-4" /> Retry
        </Button>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-display">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Overview of your platform.</p>
        </div>
        <Button onClick={fetchData} variant="ghost" size="sm">
          <RefreshCw className="w-4 h-4" /> Refresh
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Members" value={stats.users.total.toLocaleString()} change={stats.users.change} icon={Users} />
        <StatCard label="Revenue" value={formatCurrency(stats.revenue.thisMonth / 100)} change={stats.revenue.change} icon={DollarSign} />
        <StatCard label="Donations" value={formatCurrency(stats.donationSum.thisMonth / 100)} change={stats.donationSum.change} icon={Heart} />
        <StatCard label="Unread Messages" value={stats.messages.unread.toString()} change={0} icon={MessageSquare} />
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Blog Posts", metric: `${stats.blog.published} published`, total: stats.blog.total, icon: FileText, href: "/admin/blog" },
          { label: "Events", metric: `${stats.events.upcoming} upcoming`, total: stats.events.total, icon: Calendar, href: "/admin/events" },
          { label: "Products", metric: `${stats.products.active} active`, total: stats.products.total, icon: ShoppingBag, href: "/admin/products" },
          { label: "Orders", metric: `${stats.orders.thisMonth} this month`, total: stats.orders.total, icon: DollarSign, href: "/admin/products" },
        ].map((item) => (
          <Link key={item.label} href={item.href}>
            <Card variant="admin" className="hover:border-orange-500/30 cursor-pointer group">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <item.icon className="w-4 h-4 text-orange-500" />
                  <span className="text-sm font-semibold text-gray-900">{item.label}</span>
                </div>
                <p className="text-2xl font-bold text-gray-900 font-display">{item.total}</p>
                <p className="text-xs text-gray-500 mt-1">{item.metric}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card variant="admin">
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {activity.length === 0 ? (
              <p className="text-sm text-gray-500 py-4 text-center">No recent activity</p>
            ) : (
              <div className="space-y-3">
                {activity.map((item, i) => (
                  <div key={i} className="flex items-start gap-3 py-2 border-b border-gray-100 last:border-0">
                    <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-[10px] font-bold text-orange-500 uppercase">{item.type.slice(0, 2)}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-gray-700 truncate">{item.message}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{timeAgo(item.time)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card variant="admin">
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((action) => (
                <Link key={action.label} href={action.href}>
                  <div className="p-4 rounded-lg border border-gray-200 hover:border-orange-500/30 hover:bg-orange-50 transition-all cursor-pointer text-center group">
                    <action.icon className="w-5 h-5 text-gray-400 mx-auto mb-2 group-hover:text-orange-500" />
                    <span className="text-xs font-medium text-gray-500 group-hover:text-gray-900">{action.label}</span>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
