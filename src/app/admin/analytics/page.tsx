"use client";

import { useState, useEffect, useCallback } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import {
  TrendingUp, Users, ShoppingBag, Heart, DollarSign,
  Globe, MapPin, BarChart3, Activity, Package, FileText, Calendar,
  ArrowUpRight, ArrowDownRight, Loader2, RefreshCw, Eye, ShoppingCart,
  Clock, Zap, Target, Award, AlertTriangle, Filter,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, cn } from "@/lib/utils";

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

interface AnalyticsData {
  kpis: {
    totalRevenue: number;
    revenueChange: number;
    totalOrders: number;
    ordersThisMonth: number;
    totalUsers: number;
    usersThisMonth: number;
    totalDonations: number;
    donationsCount: number;
    totalProducts: number;
    totalBlogPosts: number;
    totalEvents: number;
    totalMessages: number;
    avgOrderValue: number;
    conversionRate: number;
  };
  revenueChart: { month: string; revenue: number; donations: number; orders: number }[];
  growthChart: { month: string; users: number; orders: number; events: number; posts: number }[];
  dailyChart: { day: string; revenue: number; users: number; orders: number }[];
  geo: {
    countries: { name: string; count: number }[];
    cities: { name: string; count: number; country: string }[];
    regions: { name: string; lat: number; lng: number; count: number }[];
  };
  productPerformance: { name: string; sales: number; views: number; revenue: number; stock: number; image: string | null }[];
  productCategories: { name: string; count: number }[];
  lowStock: { name: string; stock: number; alert: number }[];
  blogPerformance: { title: string; views: number; status: string; published: string | null }[];
  blogCategories: { name: string; count: number }[];
  eventTypes: { type: string; count: number }[];
  eventRegistrationStatus: { status: string; count: number }[];
  campaigns: { title: string; goal: number | null; raised: number; count: number }[];
  donationMethods: { method: string; total: number; count: number }[];
  orderStatuses: { status: string; count: number }[];
  paymentMethods: { method: string; total: number; count: number }[];
  userRoles: { role: string; count: number }[];
  heatmap: { day: string; hour: number; value: number }[];
  funnel: { stage: string; value: number }[];
  topCustomers: { name: string; email: string; total: number; orders: number }[];
  recentActivity: { id: string; orderNumber: string; total: number; paymentStatus: string; status: string; date: string; customer: string }[];
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

const COLORS = [
  "#3b82f6", "#f97316", "#22c55e", "#a855f7", "#ef4444",
  "#06b6d4", "#eab308", "#ec4899", "#14b8a6", "#8b5cf6",
  "#f59e0b", "#10b981", "#6366f1", "#f43f5e", "#84cc16",
];

const STATUS_COLORS: Record<string, string> = {
  PENDING: "#f59e0b",
  CONFIRMED: "#3b82f6",
  PROCESSING: "#8b5cf6",
  SHIPPED: "#06b6d4",
  DELIVERED: "#22c55e",
  CANCELLED: "#ef4444",
  REFUNDED: "#6b7280",
  PAID: "#22c55e",
  FAILED: "#ef4444",
};

const ROLE_COLORS: Record<string, string> = {
  MEMBER: "#3b82f6",
  MODERATOR: "#f97316",
  ADMIN: "#a855f7",
  SUPER_ADMIN: "#ef4444",
};

// ═══════════════════════════════════════════
// HELPER COMPONENTS
// ═══════════════════════════════════════════

function KpiCard({
  title,
  value,
  change,
  subtitle,
  icon: Icon,
  color,
  prefix,
}: {
  title: string;
  value: string | number;
  change?: number;
  subtitle?: string;
  icon: React.ElementType;
  color: string;
  prefix?: string;
}) {
  return (
    <Card variant="admin" className="relative overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{title}</p>
            <p className="text-2xl font-bold text-gray-900 font-display">
              {prefix}{typeof value === "number" ? value.toLocaleString() : value}
            </p>
            {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
          </div>
          <div className={cn("p-2.5 rounded-xl", color)}>
            <Icon className="w-5 h-5 text-white" />
          </div>
        </div>
        {change !== undefined && (
          <div className="mt-3 flex items-center gap-1.5">
            {change >= 0 ? (
              <ArrowUpRight className="w-3.5 h-3.5 text-green-500" />
            ) : (
              <ArrowDownRight className="w-3.5 h-3.5 text-red-500" />
            )}
            <span className={cn("text-xs font-semibold", change >= 0 ? "text-green-600" : "text-red-600")}>
              {change >= 0 ? "+" : ""}{change}%
            </span>
            <span className="text-xs text-gray-400">vs last month</span>
          </div>
        )}
        {/* Decorative gradient */}
        <div className={cn("absolute -right-6 -bottom-6 w-24 h-24 rounded-full opacity-5", color)} />
      </CardContent>
    </Card>
  );
}

function SectionHeader({ icon: Icon, title, subtitle }: { icon: React.ElementType; title: string; subtitle?: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="p-2 rounded-lg bg-blue-50">
        <Icon className="w-4 h-4 text-blue-600" />
      </div>
      <div>
        <h3 className="text-sm font-bold text-gray-900">{title}</h3>
        {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
      </div>
    </div>
  );
}

// Custom tooltip component
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-3 text-xs">
      <p className="text-gray-500 font-medium mb-1.5">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-gray-600">{entry.name}:</span>
          <span className="font-bold text-gray-900">{typeof entry.value === "number" ? entry.value.toLocaleString() : entry.value}</span>
        </div>
      ))}
    </div>
  );
}

// Ghana Region Map (SVG-based visualization)
function GhanaRegionMap({ regions }: { regions: { name: string; lat: number; lng: number; count: number }[] }) {
  const maxCount = Math.max(...regions.map((r) => r.count), 1);

  // Normalize coordinates to SVG viewport
  const minLat = 4.5, maxLat = 11.2;
  const minLng = -3.3, maxLng = 1.2;
  const svgWidth = 300, svgHeight = 380;

  const toSvg = (lat: number, lng: number) => ({
    x: ((lng - minLng) / (maxLng - minLng)) * (svgWidth - 40) + 20,
    y: svgHeight - ((lat - minLat) / (maxLat - minLat)) * (svgHeight - 40) - 20,
  });

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto">
        {/* Background */}
        <rect x="0" y="0" width={svgWidth} height={svgHeight} fill="#f8fafc" rx="12" />

        {/* Ghana outline (simplified) */}
        <path
          d="M100,340 Q60,300 50,250 Q40,200 55,160 Q65,130 80,100 Q100,70 130,50 Q160,35 190,40 Q220,45 240,60 Q255,75 260,100 Q265,130 260,160 Q250,200 245,230 Q240,260 230,290 Q215,320 190,340 Q160,355 130,350 Z"
          fill="#e2e8f0"
          stroke="#cbd5e1"
          strokeWidth="1.5"
        />

        {/* Region bubbles */}
        {regions.map((region) => {
          const { x, y } = toSvg(region.lat, region.lng);
          const radius = region.count > 0
            ? Math.max(8, Math.min(30, (region.count / maxCount) * 30))
            : 4;
          const opacity = region.count > 0 ? 0.7 : 0.15;

          return (
            <g key={region.name}>
              {/* Glow */}
              {region.count > 0 && (
                <circle cx={x} cy={y} r={radius + 4} fill="#3b82f6" opacity={0.15} />
              )}
              {/* Main bubble */}
              <circle
                cx={x}
                cy={y}
                r={radius}
                fill="#3b82f6"
                opacity={opacity}
                stroke="#2563eb"
                strokeWidth={region.count > 0 ? 1.5 : 0.5}
              />
              {/* Count label */}
              {region.count > 0 && radius > 10 && (
                <text x={x} y={y + 3} textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">
                  {region.count}
                </text>
              )}
              {/* Region name */}
              <text x={x} y={y + radius + 12} textAnchor="middle" fill="#64748b" fontSize="6.5" fontWeight="500">
                {region.name}
              </text>
            </g>
          );
        })}

        {/* Title */}
        <text x="150" y="20" textAnchor="middle" fill="#1e293b" fontSize="11" fontWeight="bold">
          Ghana — Regional Distribution
        </text>
      </svg>
    </div>
  );
}

// Activity Heatmap
function ActivityHeatmap({ data }: { data: { day: string; hour: number; value: number }[] }) {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  const getColor = (value: number) => {
    if (value === 0) return "#f1f5f9";
    const intensity = value / maxValue;
    if (intensity < 0.25) return "#dbeafe";
    if (intensity < 0.5) return "#93c5fd";
    if (intensity < 0.75) return "#3b82f6";
    return "#1d4ed8";
  };

  return (
    <div className="overflow-x-auto">
      <div className="min-w-150">
        {/* Hour labels */}
        <div className="flex items-center gap-0.5 mb-1 ml-10">
          {Array.from({ length: 24 }, (_, h) => (
            <div key={h} className="flex-1 text-center text-[8px] text-gray-400">
              {h % 3 === 0 ? `${h}:00` : ""}
            </div>
          ))}
        </div>
        {/* Grid */}
        {days.map((day) => (
          <div key={day} className="flex items-center gap-0.5 mb-0.5">
            <span className="w-9 text-[10px] text-gray-500 text-right pr-1.5 font-medium">{day}</span>
            {Array.from({ length: 24 }, (_, h) => {
              const cell = data.find((d) => d.day === day && d.hour === h);
              return (
                <div
                  key={h}
                  className="flex-1 aspect-square rounded-sm transition-colors cursor-crosshair"
                  style={{ backgroundColor: getColor(cell?.value || 0) }}
                  title={`${day} ${h}:00 — ${cell?.value || 0} orders`}
                />
              );
            })}
          </div>
        ))}
        {/* Legend */}
        <div className="flex items-center gap-2 mt-2 ml-10">
          <span className="text-[9px] text-gray-400">Less</span>
          {["#f1f5f9", "#dbeafe", "#93c5fd", "#3b82f6", "#1d4ed8"].map((color) => (
            <div key={color} className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }} />
          ))}
          <span className="text-[9px] text-gray-400">More</span>
        </div>
      </div>
    </div>
  );
}

// Funnel Chart Component
function ConversionFunnel({ data }: { data: { stage: string; value: number }[] }) {
  const maxValue = data[0]?.value || 1;
  return (
    <div className="space-y-2">
      {data.map((item, i) => {
        const width = Math.max(20, (item.value / maxValue) * 100);
        const convRate = i > 0 ? ((item.value / (data[i - 1]?.value || 1)) * 100).toFixed(1) : "100";
        return (
          <div key={item.stage} className="flex items-center gap-3">
            <div className="w-28 text-right">
              <p className="text-xs font-medium text-gray-700">{item.stage}</p>
            </div>
            <div className="flex-1 relative">
              <div className="h-8 bg-gray-100 rounded-lg overflow-hidden">
                <div
                  className="h-full rounded-lg transition-all duration-700"
                  style={{
                    width: `${width}%`,
                    background: `linear-gradient(90deg, ${COLORS[i]}, ${COLORS[i]}cc)`,
                  }}
                />
              </div>
            </div>
            <div className="w-20 text-right">
              <p className="text-xs font-bold text-gray-900">{item.value.toLocaleString()}</p>
              {i > 0 && <p className="text-[9px] text-gray-400">{convRate}% conv.</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

export default function AdvancedAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("12");
  const [activeView, setActiveView] = useState<"overview" | "revenue" | "geo" | "products" | "content" | "users">("overview");

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/analytics?range=${range}`);
      if (!res.ok) throw new Error();
      setData(await res.json());
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-blue-100 animate-pulse" />
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin absolute top-4 left-4" />
          </div>
          <p className="text-sm text-gray-500 animate-pulse">Loading analytics engine...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="p-4 rounded-2xl bg-red-50">
          <AlertTriangle className="w-8 h-8 text-red-400" />
        </div>
        <p className="text-red-500 font-medium">Failed to load analytics</p>
        <Button variant="outline" size="sm" onClick={fetchAnalytics}>
          <RefreshCw className="w-4 h-4" /> Retry
        </Button>
      </div>
    );
  }

  const views = [
    { id: "overview" as const, label: "Overview", icon: BarChart3 },
    { id: "revenue" as const, label: "Revenue", icon: DollarSign },
    { id: "geo" as const, label: "Geography", icon: Globe },
    { id: "products" as const, label: "Products", icon: Package },
    { id: "content" as const, label: "Content", icon: FileText },
    { id: "users" as const, label: "Users", icon: Users },
  ];

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-display flex items-center gap-2">
            <Activity className="w-6 h-6 text-blue-600" />
            Advanced Analytics
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Comprehensive platform intelligence & insights
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={range}
            onChange={(e) => setRange(e.target.value)}
            className="text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="6">Last 6 months</option>
            <option value="12">Last 12 months</option>
            <option value="24">Last 24 months</option>
          </select>
          <Button variant="outline" size="sm" onClick={fetchAnalytics}>
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </Button>
        </div>
      </div>

      {/* ── View Tabs ── */}
      <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl overflow-x-auto">
        {views.map((view) => (
          <button
            key={view.id}
            onClick={() => setActiveView(view.id)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap",
              activeView === view.id
                ? "bg-white text-blue-700 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            <view.icon className="w-3.5 h-3.5" />
            {view.label}
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════ */}
      {/* OVERVIEW TAB */}
      {/* ═══════════════════════════════════════════ */}
      {activeView === "overview" && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              title="Revenue"
              value={formatCurrency(data.kpis.totalRevenue)}
              change={data.kpis.revenueChange}
              subtitle="This month"
              icon={DollarSign}
              color="bg-blue-600"
            />
            <KpiCard
              title="Total Orders"
              value={data.kpis.totalOrders}
              subtitle={`${data.kpis.ordersThisMonth} this month`}
              icon={ShoppingBag}
              color="bg-orange-500"
            />
            <KpiCard
              title="Members"
              value={data.kpis.totalUsers}
              subtitle={`${data.kpis.usersThisMonth} new this month`}
              icon={Users}
              color="bg-purple-600"
            />
            <KpiCard
              title="Donations"
              value={formatCurrency(data.kpis.totalDonations)}
              subtitle={`${data.kpis.donationsCount} this month`}
              icon={Heart}
              color="bg-pink-500"
            />
          </div>

          {/* Secondary KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card variant="admin">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-50">
                  <Target className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider">Avg Order</p>
                  <p className="text-lg font-bold text-gray-900">{formatCurrency(data.kpis.avgOrderValue)}</p>
                </div>
              </CardContent>
            </Card>
            <Card variant="admin">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cyan-50">
                  <Zap className="w-4 h-4 text-cyan-600" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider">Conversion</p>
                  <p className="text-lg font-bold text-gray-900">{data.kpis.conversionRate}%</p>
                </div>
              </CardContent>
            </Card>
            <Card variant="admin">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-50">
                  <Package className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider">Products</p>
                  <p className="text-lg font-bold text-gray-900">{data.kpis.totalProducts}</p>
                </div>
              </CardContent>
            </Card>
            <Card variant="admin">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-50">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider">Events</p>
                  <p className="text-lg font-bold text-gray-900">{data.kpis.totalEvents}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Revenue + Growth Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue & Donations Area Chart */}
            <Card variant="admin">
              <CardHeader>
                <SectionHeader icon={TrendingUp} title="Revenue & Donations" subtitle="Monthly breakdown" />
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={data.revenueChart}>
                    <defs>
                      <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gradDonations" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ec4899" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#ec4899" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                    <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      name="Revenue"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      fill="url(#gradRevenue)"
                    />
                    <Area
                      type="monotone"
                      dataKey="donations"
                      name="Donations"
                      stroke="#ec4899"
                      strokeWidth={2}
                      fill="url(#gradDonations)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Growth Composed Chart */}
            <Card variant="admin">
              <CardHeader>
                <SectionHeader icon={Users} title="Platform Growth" subtitle="Users, orders, content" />
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={data.growthChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                    <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="users" name="New Users" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="orders" name="Orders" fill="#f97316" radius={[4, 4, 0, 0]} />
                    <Line type="monotone" dataKey="posts" name="Blog Posts" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="events" name="Events" stroke="#a855f7" strokeWidth={2} dot={{ r: 3 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Daily Trend + Heatmap */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 30-day trend */}
            <Card variant="admin" className="lg:col-span-2">
              <CardHeader>
                <SectionHeader icon={Activity} title="30-Day Trend" subtitle="Daily revenue, users & orders" />
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={data.dailyChart}>
                    <defs>
                      <linearGradient id="gradDaily" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.2} />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="day" tick={{ fontSize: 9 }} stroke="#94a3b8" interval={2} />
                    <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="revenue" name="Revenue (GHS)" stroke="#3b82f6" strokeWidth={2} fill="url(#gradDaily)" />
                    <Line type="monotone" dataKey="orders" name="Orders" stroke="#f97316" strokeWidth={1.5} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Activity Heatmap */}
            <Card variant="admin">
              <CardHeader>
                <SectionHeader icon={Clock} title="Activity Heatmap" subtitle="Orders by day & hour (7d)" />
              </CardHeader>
              <CardContent>
                <ActivityHeatmap data={data.heatmap} />
              </CardContent>
            </Card>
          </div>

          {/* Conversion Funnel + Order Status */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card variant="admin">
              <CardHeader>
                <SectionHeader icon={Filter} title="Conversion Funnel" subtitle="User journey stages" />
              </CardHeader>
              <CardContent>
                <ConversionFunnel data={data.funnel} />
              </CardContent>
            </Card>

            <Card variant="admin">
              <CardHeader>
                <SectionHeader icon={ShoppingCart} title="Order Status Distribution" />
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={data.orderStatuses}
                      dataKey="count"
                      nameKey="status"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={3}
                      label={({ name, value }: { name?: string; value?: number }) => `${name} (${value})`}
                      labelLine={{ strokeWidth: 1 }}
                    >
                      {data.orderStatuses.map((entry) => (
                        <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || "#94a3b8"} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity Table */}
          <Card variant="admin">
            <CardHeader>
              <SectionHeader icon={Zap} title="Recent Orders" subtitle="Latest 20 transactions" />
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-2 px-3 text-gray-500 font-medium">Order</th>
                      <th className="text-left py-2 px-3 text-gray-500 font-medium">Customer</th>
                      <th className="text-left py-2 px-3 text-gray-500 font-medium">Total</th>
                      <th className="text-left py-2 px-3 text-gray-500 font-medium">Payment</th>
                      <th className="text-left py-2 px-3 text-gray-500 font-medium">Status</th>
                      <th className="text-left py-2 px-3 text-gray-500 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentActivity.map((order) => (
                      <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                        <td className="py-2.5 px-3 font-mono text-blue-600 font-medium">{order.orderNumber}</td>
                        <td className="py-2.5 px-3 text-gray-700">{order.customer}</td>
                        <td className="py-2.5 px-3 font-medium text-gray-900">{formatCurrency(order.total)}</td>
                        <td className="py-2.5 px-3">
                          <Badge variant={order.paymentStatus === "PAID" ? "default" : "secondary"} className="text-[9px]">
                            {order.paymentStatus}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-3">
                          <Badge variant="outline" className="text-[9px]">{order.status}</Badge>
                        </td>
                        <td className="py-2.5 px-3 text-gray-400">{new Date(order.date).toLocaleDateString()}</td>
                      </tr>
                    ))}
                    {data.recentActivity.length === 0 && (
                      <tr><td colSpan={6} className="py-8 text-center text-gray-400">No recent orders</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* REVENUE TAB */}
      {/* ═══════════════════════════════════════════ */}
      {activeView === "revenue" && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard title="Monthly Revenue" value={formatCurrency(data.kpis.totalRevenue)} change={data.kpis.revenueChange} icon={DollarSign} color="bg-blue-600" />
            <KpiCard title="Avg Order Value" value={formatCurrency(data.kpis.avgOrderValue)} icon={Target} color="bg-green-600" />
            <KpiCard title="Donations" value={formatCurrency(data.kpis.totalDonations)} icon={Heart} color="bg-pink-500" />
            <KpiCard title="Conversion Rate" value={`${data.kpis.conversionRate}%`} icon={Zap} color="bg-cyan-600" />
          </div>

          {/* Revenue Area Chart (large) */}
          <Card variant="admin">
            <CardHeader>
              <SectionHeader icon={TrendingUp} title="Revenue & Donations Over Time" subtitle={`Last ${range} months`} />
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <ComposedChart data={data.revenueChart}>
                  <defs>
                    <linearGradient id="rGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="revenue" name="Revenue (GHS)" stroke="#3b82f6" strokeWidth={2.5} fill="url(#rGrad)" />
                  <Bar dataKey="donations" name="Donations (GHS)" fill="#ec4899" radius={[4, 4, 0, 0]} barSize={20} />
                  <Line type="monotone" dataKey="orders" name="Orders" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} yAxisId={0} />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Payment Methods + Donation Sources */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card variant="admin">
              <CardHeader>
                <SectionHeader icon={ShoppingBag} title="Payment Methods" subtitle="Revenue by gateway" />
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={data.paymentMethods}
                      dataKey="count"
                      nameKey="method"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={85}
                      paddingAngle={4}
                    >
                      {data.paymentMethods.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-4">
                  {data.paymentMethods.map((pm, i) => (
                    <div key={pm.method} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="text-gray-700">{pm.method}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-gray-400">{pm.count} orders</span>
                        <span className="font-bold text-gray-900">{formatCurrency(pm.total)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card variant="admin">
              <CardHeader>
                <SectionHeader icon={Heart} title="Donation Methods" subtitle="By payment gateway" />
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={data.donationMethods} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis type="number" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                    <YAxis dataKey="method" type="category" tick={{ fontSize: 11 }} stroke="#94a3b8" width={80} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="total" name="Amount (GHS)" fill="#ec4899" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                {/* Campaigns */}
                {data.campaigns.length > 0 && (
                  <div className="mt-6 space-y-3">
                    <p className="text-xs font-bold text-gray-700">Donation Campaigns</p>
                    {data.campaigns.map((c) => (
                      <div key={c.title} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-600">{c.title}</span>
                          <span className="font-bold text-gray-900">{formatCurrency(c.raised)}{c.goal ? ` / ${formatCurrency(c.goal)}` : ""}</span>
                        </div>
                        {c.goal && (
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-pink-500 rounded-full" style={{ width: `${Math.min(100, (c.raised / c.goal) * 100)}%` }} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Top Customers */}
          <Card variant="admin">
            <CardHeader>
              <SectionHeader icon={Award} title="Top Customers" subtitle="By total spend" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {data.topCustomers.map((customer, i) => (
                  <div key={i} className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold",
                        i === 0 ? "bg-yellow-500" : i === 1 ? "bg-gray-400" : i === 2 ? "bg-amber-700" : "bg-blue-500"
                      )}>
                        #{i + 1}
                      </div>
                      <div className="truncate">
                        <p className="text-xs font-bold text-gray-900 truncate">{customer.name}</p>
                        <p className="text-[9px] text-gray-400 truncate">{customer.email}</p>
                      </div>
                    </div>
                    <p className="text-sm font-bold text-blue-600">{formatCurrency(customer.total)}</p>
                    <p className="text-[10px] text-gray-400">{customer.orders} orders</p>
                  </div>
                ))}
                {data.topCustomers.length === 0 && (
                  <p className="col-span-5 text-center text-gray-400 text-sm py-4">No customer data yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* GEO TAB */}
      {/* ═══════════════════════════════════════════ */}
      {activeView === "geo" && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Ghana Region Map */}
            <Card variant="admin" className="lg:col-span-2">
              <CardHeader>
                <SectionHeader icon={MapPin} title="Ghana Regional Map" subtitle="User & order distribution by region" />
              </CardHeader>
              <CardContent>
                <GhanaRegionMap regions={data.geo.regions} />
              </CardContent>
            </Card>

            {/* Country Distribution */}
            <Card variant="admin">
              <CardHeader>
                <SectionHeader icon={Globe} title="Countries" subtitle="User distribution" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2.5">
                  {data.geo.countries.length > 0 ? (
                    data.geo.countries.map((country, i) => {
                      const total = data.geo.countries.reduce((s, c) => s + c.count, 0);
                      const pct = ((country.count / total) * 100).toFixed(1);
                      return (
                        <div key={country.name}>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="font-medium text-gray-700">{country.name}</span>
                            <span className="text-gray-400">{country.count} ({pct}%)</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${pct}%`,
                                backgroundColor: COLORS[i % COLORS.length],
                              }}
                            />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-xs text-gray-400 text-center py-4">No geographic data yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Cities + Regions Table */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Cities */}
            <Card variant="admin">
              <CardHeader>
                <SectionHeader icon={MapPin} title="Top Cities" subtitle="Most active locations" />
              </CardHeader>
              <CardContent>
                {data.geo.cities.length > 0 ? (
                  <div className="space-y-2">
                    {data.geo.cities.slice(0, 15).map((city, i) => (
                      <div key={city.name} className="flex items-center gap-3 text-xs">
                        <span className="w-5 h-5 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-[9px] font-bold">
                          {i + 1}
                        </span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-gray-700">{city.name}</span>
                            <span className="text-gray-400">{city.count}</span>
                          </div>
                          <p className="text-[9px] text-gray-400">{city.country}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 text-center py-4">No city data yet</p>
                )}
              </CardContent>
            </Card>

            {/* Region Stats */}
            <Card variant="admin">
              <CardHeader>
                <SectionHeader icon={Globe} title="Ghana Regions" subtitle="Detailed breakdown" />
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart
                    data={data.geo.regions.filter((r) => r.count > 0).sort((a, b) => b.count - a.count)}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis type="number" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} stroke="#94a3b8" width={100} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" name="Activity" fill="#3b82f6" radius={[0, 6, 6, 0]}>
                      {data.geo.regions
                        .filter((r) => r.count > 0)
                        .sort((a, b) => b.count - a.count)
                        .map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* PRODUCTS TAB */}
      {/* ═══════════════════════════════════════════ */}
      {activeView === "products" && (
        <>
          {/* Product Performance */}
          <Card variant="admin">
            <CardHeader>
              <SectionHeader icon={Package} title="Product Performance" subtitle="Top 10 by sales" />
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.productPerformance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} stroke="#94a3b8" interval={0} angle={-20} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="sales" name="Sales" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="views" name="Views" fill="#f97316" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Product Categories */}
            <Card variant="admin">
              <CardHeader>
                <SectionHeader icon={Package} title="Categories" subtitle="Product distribution" />
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={data.productCategories}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={80}
                      paddingAngle={3}
                    >
                      {data.productCategories.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 10 }} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Product Views vs Sales Radar */}
            <Card variant="admin">
              <CardHeader>
                <SectionHeader icon={Eye} title="Views vs Sales" subtitle="Top product comparison" />
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <RadarChart data={data.productPerformance.slice(0, 6)}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="name" tick={{ fontSize: 8 }} />
                    <PolarRadiusAxis tick={{ fontSize: 9 }} />
                    <Radar name="Sales" dataKey="sales" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                    <Radar name="Views" dataKey="views" stroke="#f97316" fill="#f97316" fillOpacity={0.2} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 10 }} />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Low Stock Alerts */}
            <Card variant="admin">
              <CardHeader>
                <SectionHeader icon={AlertTriangle} title="Low Stock Alerts" subtitle="Restock needed" />
              </CardHeader>
              <CardContent>
                {data.lowStock.length > 0 ? (
                  <div className="space-y-2.5">
                    {data.lowStock.map((p) => (
                      <div key={p.name} className="flex items-center justify-between p-2.5 rounded-lg bg-red-50/50 border border-red-100">
                        <div>
                          <p className="text-xs font-medium text-gray-800">{p.name}</p>
                          <p className="text-[9px] text-gray-400">Alert at {p.alert} units</p>
                        </div>
                        <Badge variant="destructive" className="text-[10px]">
                          {p.stock} left
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center py-8 gap-2">
                    <div className="p-3 rounded-full bg-green-50">
                      <Package className="w-5 h-5 text-green-500" />
                    </div>
                    <p className="text-xs text-green-600 font-medium">All products in stock!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Product Detail Table */}
          <Card variant="admin">
            <CardHeader>
              <SectionHeader icon={BarChart3} title="Product Details" subtitle="Performance metrics" />
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-2 px-3 text-gray-500 font-medium">Product</th>
                      <th className="text-right py-2 px-3 text-gray-500 font-medium">Sales</th>
                      <th className="text-right py-2 px-3 text-gray-500 font-medium">Views</th>
                      <th className="text-right py-2 px-3 text-gray-500 font-medium">Conv. Rate</th>
                      <th className="text-right py-2 px-3 text-gray-500 font-medium">Revenue</th>
                      <th className="text-right py-2 px-3 text-gray-500 font-medium">Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.productPerformance.map((p) => (
                      <tr key={p.name} className="border-b border-gray-50 hover:bg-gray-50/50">
                        <td className="py-2.5 px-3 font-medium text-gray-900">{p.name}</td>
                        <td className="py-2.5 px-3 text-right">{p.sales}</td>
                        <td className="py-2.5 px-3 text-right">{p.views}</td>
                        <td className="py-2.5 px-3 text-right">
                          {p.views > 0 ? ((p.sales / p.views) * 100).toFixed(1) : "0"}%
                        </td>
                        <td className="py-2.5 px-3 text-right font-medium">{formatCurrency(p.revenue)}</td>
                        <td className="py-2.5 px-3 text-right">
                          <span className={cn(p.stock <= 5 ? "text-red-600 font-bold" : "text-gray-600")}>
                            {p.stock}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* CONTENT TAB */}
      {/* ═══════════════════════════════════════════ */}
      {activeView === "content" && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard title="Blog Posts" value={data.kpis.totalBlogPosts} icon={FileText} color="bg-blue-600" subtitle="Total posts" />
            <KpiCard title="Events" value={data.kpis.totalEvents} icon={Calendar} color="bg-purple-600" subtitle="Total events" />
            <KpiCard title="Products" value={data.kpis.totalProducts} icon={Package} color="bg-orange-500" subtitle="In catalog" />
            <KpiCard title="Messages" value={data.kpis.totalMessages} icon={Activity} color="bg-green-600" subtitle="Contact messages" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Blog Performance */}
            <Card variant="admin">
              <CardHeader>
                <SectionHeader icon={FileText} title="Top Blog Posts" subtitle="By pageviews" />
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={data.blogPerformance.slice(0, 8)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis type="number" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                    <YAxis
                      dataKey="title"
                      type="category"
                      tick={{ fontSize: 9 }}
                      stroke="#94a3b8"
                      width={150}
                      tickFormatter={(v) => v.length > 25 ? v.slice(0, 25) + "…" : v}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="views" name="Views" fill="#3b82f6" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Blog Categories */}
            <Card variant="admin">
              <CardHeader>
                <SectionHeader icon={FileText} title="Blog Categories" subtitle="Post distribution" />
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={data.blogCategories}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={90}
                      paddingAngle={3}
                    >
                      {data.blogCategories.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 10 }} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Event Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card variant="admin">
              <CardHeader>
                <SectionHeader icon={Calendar} title="Event Types" subtitle="Distribution" />
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={data.eventTypes}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="type" tick={{ fontSize: 9 }} stroke="#94a3b8" angle={-20} textAnchor="end" height={50} />
                    <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" name="Events" fill="#a855f7" radius={[6, 6, 0, 0]}>
                      {data.eventTypes.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card variant="admin">
              <CardHeader>
                <SectionHeader icon={Calendar} title="Registration Status" subtitle="Event registrations" />
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={data.eventRegistrationStatus}
                      dataKey="count"
                      nameKey="status"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={85}
                      paddingAngle={4}
                    >
                      {data.eventRegistrationStatus.map((entry) => (
                        <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || "#94a3b8"} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 10 }} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* USERS TAB */}
      {/* ═══════════════════════════════════════════ */}
      {activeView === "users" && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard title="Total Users" value={data.kpis.totalUsers} icon={Users} color="bg-purple-600" subtitle="All registered" />
            <KpiCard title="New This Month" value={data.kpis.usersThisMonth} icon={TrendingUp} color="bg-blue-600" subtitle="Recent sign-ups" />
            <KpiCard title="Conversion" value={`${data.kpis.conversionRate}%`} icon={Zap} color="bg-cyan-600" subtitle="Cart → Order" />
            <KpiCard title="Total Orders" value={data.kpis.totalOrders} icon={ShoppingBag} color="bg-orange-500" subtitle="All time" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* User Growth */}
            <Card variant="admin">
              <CardHeader>
                <SectionHeader icon={Users} title="User Growth" subtitle={`Last ${range} months`} />
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={data.growthChart}>
                    <defs>
                      <linearGradient id="gradUsers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                    <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                    <Area type="monotone" dataKey="users" name="New Users" stroke="#8b5cf6" strokeWidth={2.5} fill="url(#gradUsers)" />
                    <Line type="monotone" dataKey="orders" name="Orders" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* User Roles */}
            <Card variant="admin">
              <CardHeader>
                <SectionHeader icon={Users} title="User Roles" subtitle="Role distribution" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center mb-4">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={data.userRoles}
                        dataKey="count"
                        nameKey="role"
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={80}
                        paddingAngle={3}
                      >
                        {data.userRoles.map((entry) => (
                          <Cell key={entry.role} fill={ROLE_COLORS[entry.role] || "#94a3b8"} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: 10 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {data.userRoles.map((role) => (
                    <div key={role.role} className="p-3 rounded-xl bg-gray-50 border border-gray-100 text-center">
                      <p className="text-lg font-bold text-gray-900">{role.count}</p>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider">{role.role.replace("_", " ")}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Daily signups chart + Funnel */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card variant="admin">
              <CardHeader>
                <SectionHeader icon={Activity} title="Daily Sign-ups" subtitle="Last 30 days" />
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={data.dailyChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="day" tick={{ fontSize: 8 }} stroke="#94a3b8" interval={2} />
                    <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="users" name="New Users" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card variant="admin">
              <CardHeader>
                <SectionHeader icon={Filter} title="User Funnel" subtitle="Visitor → Customer journey" />
              </CardHeader>
              <CardContent>
                <ConversionFunnel data={data.funnel} />
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* ── Footer ── */}
      <div className="text-center text-xs text-gray-300 pb-4">
        Analytics powered by TIMN Intelligence Engine • Data refreshed in real-time
      </div>
    </div>
  );
}
