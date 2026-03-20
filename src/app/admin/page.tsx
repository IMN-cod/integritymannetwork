"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
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
  TrendingUp,
  Eye,
  Clock,
  Zap,
  CircleDot,
  ExternalLink,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

/* ─────────────────────────── TYPES ─────────────────────────── */

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

interface ChartData {
  revenueChart: { month: string; revenue: number; donations: number }[];
  growthChart: { month: string; users: number; orders: number }[];
  dailySignupsChart: { day: string; signups: number }[];
  contentBreakdown: { name: string; value: number; color: string }[];
  eventBreakdown: { name: string; value: number; color: string }[];
  productBreakdown: { name: string; value: number; color: string }[];
  topDonors: { name: string; email: string; total: number; count: number }[];
  recentOrders: { id: string; orderNumber: string; total: number; status: string; date: string; customer: string }[];
  totals: { posts: number; events: number; products: number };
}

interface Activity {
  type: string;
  message: string;
  time: string;
}

/* ────────────────────────── HELPERS ────────────────────────── */

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function timeAgo(dateString: string) {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const activityIcons: Record<string, typeof Users> = {
  user: Users,
  blog: FileText,
  order: ShoppingBag,
  donation: Heart,
  contact: MessageSquare,
  event: Calendar,
};

const activityColors: Record<string, string> = {
  user: "bg-blue-50 text-blue-500",
  blog: "bg-purple-50 text-purple-500",
  order: "bg-green-50 text-green-500",
  donation: "bg-pink-50 text-pink-500",
  contact: "bg-amber-50 text-amber-500",
  event: "bg-indigo-50 text-indigo-500",
};

const statusColors: Record<string, string> = {
  PAID: "bg-emerald-50 text-emerald-600",
  PENDING: "bg-amber-50 text-amber-600",
  FAILED: "bg-red-50 text-red-600",
  REFUNDED: "bg-gray-100 text-gray-600",
};

/* ──────────────────── CUSTOM CHART TOOLTIP ──────────────── */

function ChartTooltipContent({ active, payload, label, formatter }: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
  formatter?: (value: number) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-lg shadow-gray-200/60 px-4 py-3 text-xs">
      <p className="text-gray-500 font-medium mb-1.5">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-gray-600">{entry.name}:</span>
          <span className="font-semibold text-gray-900">
            {formatter ? formatter(entry.value) : entry.value.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ─────────────────── PROGRESS RING COMPONENT ─────────────────── */

function ProgressRing({
  percentage,
  size = 56,
  strokeWidth = 4,
  color = "#f97316",
}: {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(percentage, 100) / 100) * circumference;

  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#f3f4f6" strokeWidth={strokeWidth} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-1000 ease-out"
      />
    </svg>
  );
}

/* ──────────────────── MINI DONUT COMPONENT ──────────────────── */

function MiniDonut({ data, size = 100 }: { data: { name: string; value: number; color: string }[]; size?: number }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) {
    return (
      <div className="flex items-center justify-center" style={{ width: size, height: size }}>
        <span className="text-xs text-gray-400">No data</span>
      </div>
    );
  }
  return (
    <PieChart width={size} height={size}>
      <Pie
        data={data}
        cx={size / 2}
        cy={size / 2}
        innerRadius={size * 0.3}
        outerRadius={size * 0.45}
        paddingAngle={3}
        dataKey="value"
        strokeWidth={0}
      >
        {data.map((entry, i) => (
          <Cell key={i} fill={entry.color} />
        ))}
      </Pie>
    </PieChart>
  );
}

/* ════════════════════════ MAIN DASHBOARD ════════════════════════ */

export default function AdminDashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<Stats | null>(null);
  const [charts, setCharts] = useState<ChartData | null>(null);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [statsRes, chartsRes, activityRes] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch("/api/admin/charts"),
        fetch("/api/admin/activity"),
      ]);
      if (!statsRes.ok || !chartsRes.ok) throw new Error();
      setStats(await statsRes.json());
      setCharts(await chartsRes.json());
      if (activityRes.ok) {
        const actData = await activityRes.json();
        setActivity(actData.activities || actData.activity || []);
      }
    } catch {
      setError("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Loader2 className="w-7 h-7 text-white animate-spin" />
          </div>
        </div>
        <p className="text-sm text-gray-400 font-medium">Loading dashboard...</p>
      </div>
    );
  }

  if (error || !stats || !charts) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
        <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center">
          <Zap className="w-7 h-7 text-red-400" />
        </div>
        <p className="text-sm text-red-500 font-medium">{error || "Something went wrong"}</p>
        <button
          onClick={fetchData}
          className="px-4 py-2 text-sm font-medium text-orange-600 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  const adminFirstName = session?.user?.name?.split(" ")[0] || "Admin";
  const todayStr = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="space-y-6 pb-8">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 font-display tracking-tight">
            {getGreeting()}, {adminFirstName}
          </h1>
          <p className="text-sm text-gray-400 mt-1 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5" />
            {todayStr}
          </p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-gray-500 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Data
        </button>
      </div>

      {/* ── KPI ROW ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Revenue */}
        <div className="group relative bg-linear-to-br from-orange-500 to-orange-600 rounded-2xl p-5 text-white shadow-lg shadow-orange-500/15 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-white/15 backdrop-blur flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
              <span className="text-xs font-medium text-white/70 uppercase tracking-wider">Revenue</span>
            </div>
            <p className="text-2xl font-bold font-display">{formatCurrency(stats.revenue.thisMonth / 100)}</p>
            <div className="flex items-center gap-1 mt-2">
              {stats.revenue.change >= 0 ? (
                <ArrowUpRight className="w-3.5 h-3.5 text-white/80" />
              ) : (
                <ArrowDownRight className="w-3.5 h-3.5 text-white/80" />
              )}
              <span className="text-xs text-white/80">
                {stats.revenue.change >= 0 ? "+" : ""}
                {stats.revenue.change}% from last month
              </span>
            </div>
          </div>
        </div>

        {/* Donations */}
        <div className="group relative bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-linear-to-br from-pink-50 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-pink-50 flex items-center justify-center">
                <Heart className="w-4 h-4 text-pink-500" />
              </div>
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Donations</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 font-display">
              {formatCurrency(stats.donationSum.thisMonth / 100)}
            </p>
            <div className="flex items-center gap-1 mt-2">
              {stats.donationSum.change >= 0 ? (
                <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <ArrowDownRight className="w-3.5 h-3.5 text-red-500" />
              )}
              <span
                className={`text-xs font-medium ${stats.donationSum.change >= 0 ? "text-emerald-500" : "text-red-500"}`}
              >
                {stats.donationSum.change >= 0 ? "+" : ""}
                {stats.donationSum.change}%
              </span>
              <span className="text-xs text-gray-400">vs last month</span>
            </div>
          </div>
        </div>

        {/* Members */}
        <div className="group relative bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-linear-to-br from-blue-50 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <Users className="w-4 h-4 text-blue-500" />
              </div>
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Members</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 font-display">{stats.users.total.toLocaleString()}</p>
            <div className="flex items-center gap-1 mt-2">
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-xs font-medium text-emerald-500">+{stats.users.thisMonth}</span>
              <span className="text-xs text-gray-400">this month</span>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="group relative bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-linear-to-br from-amber-50 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-amber-500" />
              </div>
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Messages</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 font-display">{stats.messages.total.toLocaleString()}</p>
            <div className="flex items-center gap-1 mt-2">
              {stats.messages.unread > 0 ? (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                  </span>
                  <span className="text-xs font-medium text-amber-600">{stats.messages.unread} unread</span>
                </>
              ) : (
                <span className="text-xs text-gray-400">All caught up!</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN CHARTS ROW ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue & Donations Area Chart — 2 cols */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Revenue & Donations</h2>
              <p className="text-xs text-gray-400 mt-0.5">Last 6 months performance</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                Revenue
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-pink-400" />
                Donations
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={charts.revenueChart} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f97316" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradDonations" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ec4899" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#ec4899" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#9ca3af", fontSize: 11 }}
                dy={8}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#9ca3af", fontSize: 11 }}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                dx={-4}
              />
              <Tooltip content={<ChartTooltipContent formatter={(v) => formatCurrency(v)} />} />
              <Area
                type="monotone"
                dataKey="revenue"
                name="Revenue"
                stroke="#f97316"
                strokeWidth={2.5}
                fill="url(#gradRevenue)"
                dot={false}
                activeDot={{ r: 5, fill: "#f97316", strokeWidth: 2, stroke: "#fff" }}
              />
              <Area
                type="monotone"
                dataKey="donations"
                name="Donations"
                stroke="#ec4899"
                strokeWidth={2}
                fill="url(#gradDonations)"
                dot={false}
                activeDot={{ r: 4, fill: "#ec4899", strokeWidth: 2, stroke: "#fff" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Daily Signups Sparkline — 1 col */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-gray-900">New Members</h2>
            <p className="text-xs text-gray-400 mt-0.5">Last 14 days signups</p>
          </div>
          <div className="flex-1 flex items-end">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={charts.dailySignupsChart} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#9ca3af", fontSize: 9 }}
                  interval={1}
                  dy={4}
                />
                <YAxis hide />
                <Tooltip content={<ChartTooltipContent />} />
                <Bar dataKey="signups" name="Signups" radius={[4, 4, 0, 0]} maxBarSize={24}>
                  {charts.dailySignupsChart.map((_, i) => (
                    <Cell key={i} fill={i === charts.dailySignupsChart.length - 1 ? "#f97316" : "#fed7aa"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── MIDDLE ROW: Growth + Content ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Growth Chart — 2 cols */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Growth Overview</h2>
              <p className="text-xs text-gray-400 mt-0.5">Users & orders over 6 months</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                Users
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                Orders
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={charts.growthChart} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#9ca3af", fontSize: 11 }}
                dy={8}
              />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "#9ca3af", fontSize: 11 }} dx={-4} />
              <Tooltip content={<ChartTooltipContent />} />
              <Bar dataKey="users" name="Users" fill="#3b82f6" radius={[6, 6, 0, 0]} maxBarSize={32} />
              <Bar dataKey="orders" name="Orders" fill="#22c55e" radius={[6, 6, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Content Breakdown — 1 col */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-1">Content Status</h2>
          <p className="text-xs text-gray-400 mb-5">Posts, events &amp; products</p>

          <div className="space-y-5">
            {/* Blog Posts */}
            <div className="flex items-center gap-4">
              <MiniDonut data={charts.contentBreakdown} size={64} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">{charts.totals.posts} Posts</p>
                <div className="flex items-center gap-3 mt-1">
                  {charts.contentBreakdown.map((d) => (
                    <span key={d.name} className="text-[10px] flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: d.color }} />
                      <span className="text-gray-500">
                        {d.name}: {d.value}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Events */}
            <div className="flex items-center gap-4">
              <MiniDonut data={charts.eventBreakdown} size={64} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">{charts.totals.events} Events</p>
                <div className="flex items-center gap-3 mt-1">
                  {charts.eventBreakdown.map((d) => (
                    <span key={d.name} className="text-[10px] flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: d.color }} />
                      <span className="text-gray-500">
                        {d.name}: {d.value}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Products */}
            <div className="flex items-center gap-4">
              <MiniDonut data={charts.productBreakdown} size={64} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">{charts.totals.products} Products</p>
                <div className="flex items-center gap-3 mt-1">
                  {charts.productBreakdown.map((d) => (
                    <span key={d.name} className="text-[10px] flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: d.color }} />
                      <span className="text-gray-500">
                        {d.name}: {d.value}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── BOTTOM ROW: Orders + Activity + Quick Links ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Orders */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 pt-6 pb-4">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Recent Orders</h2>
              <p className="text-xs text-gray-400 mt-0.5">{stats.orders.thisMonth} this month</p>
            </div>
            <Link
              href="/admin/orders"
              className="text-xs text-orange-500 hover:text-orange-600 font-medium flex items-center gap-1"
            >
              View all <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
          <div className="px-6 pb-6 space-y-3">
            {charts.recentOrders.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No orders yet</p>
            ) : (
              charts.recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-gray-50/80 hover:bg-gray-100/80 transition-colors"
                >
                  <div className="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center shadow-sm">
                    <ShoppingBag className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{order.customer}</p>
                    <p className="text-[10px] text-gray-400 font-mono">{order.orderNumber}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">{formatCurrency(order.total)}</p>
                    <span
                      className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-medium ${statusColors[order.status] || "bg-gray-100 text-gray-500"}`}
                    >
                      {order.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Activity Feed */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 pt-6 pb-4">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Activity Feed</h2>
              <p className="text-xs text-gray-400 mt-0.5">Latest platform events</p>
            </div>
          </div>
          <div className="px-6 pb-6">
            {activity.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No recent activity</p>
            ) : (
              <div className="space-y-0.5">
                {activity.slice(0, 6).map((item, i) => {
                  const Icon = activityIcons[item.type] || CircleDot;
                  const color = activityColors[item.type] || "bg-gray-50 text-gray-500";
                  return (
                    <div key={i} className="flex items-start gap-3 py-2.5 group">
                      <div
                        className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center shrink-0 mt-0.5 transition-transform group-hover:scale-105`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-700 truncate leading-snug">{item.message}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{timeAgo(item.time)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Quick Links & Stats */}
        <div className="lg:col-span-1 space-y-4">
          {/* Quick Navigate */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Quick Navigate</h2>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Blog", icon: FileText, href: "/admin/blog", color: "text-purple-500 bg-purple-50" },
                {
                  label: "Products",
                  icon: ShoppingBag,
                  href: "/admin/products",
                  color: "text-emerald-500 bg-emerald-50",
                },
                { label: "Events", icon: Calendar, href: "/admin/events", color: "text-blue-500 bg-blue-50" },
                {
                  label: "Messages",
                  icon: MessageSquare,
                  href: "/admin/messages",
                  color: "text-amber-500 bg-amber-50",
                },
                { label: "Donations", icon: Heart, href: "/admin/donations", color: "text-pink-500 bg-pink-50" },
                {
                  label: "Analytics",
                  icon: TrendingUp,
                  href: "/admin/analytics",
                  color: "text-indigo-500 bg-indigo-50",
                },
              ].map((item) => (
                <Link key={item.label} href={item.href}>
                  <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors group cursor-pointer border border-transparent hover:border-gray-200">
                    <div
                      className={`w-7 h-7 rounded-lg ${item.color} flex items-center justify-center shrink-0`}
                    >
                      <item.icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-medium text-gray-600 group-hover:text-gray-900">
                      {item.label}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Top Donors */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900">Top Donors</h2>
              <Link href="/admin/donations" className="text-xs text-orange-500 hover:text-orange-600 font-medium">
                View all
              </Link>
            </div>
            {charts.topDonors.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">No donations yet</p>
            ) : (
              <div className="space-y-3">
                {charts.topDonors.slice(0, 4).map((donor, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-linear-to-br from-orange-100 to-pink-100 flex items-center justify-center">
                      <span className="text-[10px] font-bold text-orange-600">#{i + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{donor.name}</p>
                      <p className="text-[10px] text-gray-400">
                        {donor.count} donation{donor.count !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{formatCurrency(donor.total)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── PLATFORM STATS STRIP ── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-5">
          <Eye className="w-4 h-4 text-gray-400" />
          <h2 className="text-base font-semibold text-gray-900">Platform Overview</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            {
              label: "Blog Posts",
              value: stats.blog.total,
              sub: `${stats.blog.published} published`,
              icon: FileText,
              color: "#8b5cf6",
              pct: stats.blog.total > 0 ? Math.round((stats.blog.published / stats.blog.total) * 100) : 0,
            },
            {
              label: "Events",
              value: stats.events.total,
              sub: `${stats.events.upcoming} upcoming`,
              icon: Calendar,
              color: "#3b82f6",
              pct: stats.events.total > 0 ? Math.round((stats.events.upcoming / stats.events.total) * 100) : 0,
            },
            {
              label: "Products",
              value: stats.products.total,
              sub: `${stats.products.active} active`,
              icon: ShoppingBag,
              color: "#22c55e",
              pct:
                stats.products.total > 0
                  ? Math.round((stats.products.active / stats.products.total) * 100)
                  : 0,
            },
            {
              label: "Orders",
              value: stats.orders.total,
              sub: `${stats.orders.thisMonth} this month`,
              icon: DollarSign,
              color: "#f59e0b",
              pct:
                stats.orders.total > 0
                  ? Math.min(Math.round((stats.orders.thisMonth / stats.orders.total) * 100), 100)
                  : 0,
            },
            {
              label: "Donations",
              value: stats.donations.total,
              sub: `${stats.donations.thisMonth} this month`,
              icon: Heart,
              color: "#ec4899",
              pct:
                stats.donations.total > 0
                  ? Math.min(Math.round((stats.donations.thisMonth / stats.donations.total) * 100), 100)
                  : 0,
            },
            {
              label: "Members",
              value: stats.users.total,
              sub: `+${stats.users.thisMonth} new`,
              icon: Users,
              color: "#6366f1",
              pct:
                stats.users.total > 0
                  ? Math.min(
                      Math.round((stats.users.thisMonth / Math.max(stats.users.total, 1)) * 100),
                      100
                    )
                  : 0,
            },
          ].map((item) => (
            <div key={item.label} className="flex flex-col items-center text-center group">
              <div className="relative mb-3">
                <ProgressRing percentage={item.pct} size={56} strokeWidth={4} color={item.color} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <item.icon className="w-4 h-4" style={{ color: item.color }} />
                </div>
              </div>
              <p className="text-lg font-bold text-gray-900 font-display">{item.value.toLocaleString()}</p>
              <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mt-0.5">
                {item.label}
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">{item.sub}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
