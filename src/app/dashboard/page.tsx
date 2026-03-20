"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  User,
  ShoppingBag,
  Calendar,
  MessageSquare,
  Settings,
  ChevronRight,
  Package,
  BookOpen,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

interface Order {
  id: string;
  orderNumber: string;
  createdAt: string;
  total: number;
  status: string;
  items: { id: string }[];
}

interface Registration {
  id: string;
  status: string;
  ticketCount: number;
  event: {
    title: string;
    slug: string;
    startDate: string;
  };
}

const quickLinks = [
  { label: "My Orders", href: "/dashboard/orders", icon: Package },
  { label: "Community", href: "/community", icon: MessageSquare },
  { label: "Blog", href: "/blog", icon: BookOpen },
  { label: "Store", href: "/store", icon: ShoppingBag },
  { label: "Events", href: "/events", icon: Calendar },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

// 
// DASHBOARD PAGE
// 

export default function DashboardPage() {
  const { data: session } = useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [ordersRes, regsRes] = await Promise.all([
          fetch("/api/orders?limit=3"),
          fetch("/api/user/registrations"),
        ]);

        if (ordersRes.ok) {
          const data = await ordersRes.json();
          setOrders(data.orders ?? []);
        }

        if (regsRes.ok) {
          const data = await regsRes.json();
          setRegistrations(data.registrations ?? []);
        }
      } catch {
        // silently fail — dashboard still renders with empty states
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const userName = session?.user?.name || "there";

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white font-display">
            Welcome back{userName !== "there" ? `, ${userName}` : ""}
          </h1>
          <p className="text-zinc-500 mt-1">
            Manage your account, orders, and community involvement.
          </p>
        </div>

        {/* Quick Links Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          {quickLinks.map((link) => (
            <Link key={link.label} href={link.href}>
              <motion.div
                whileHover={{ y: -2 }}
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/50 hover:border-orange-500/20 transition-all text-center"
              >
                <link.icon className="w-5 h-5 text-orange-500" />
                <span className="text-xs text-zinc-300">{link.label}</span>
              </motion.div>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Orders */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Recent Orders</CardTitle>
              <Link href="/dashboard/orders">
                <Button variant="ghost" size="sm" className="text-xs">
                  View All
                  <ChevronRight className="w-3 h-3 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="w-5 h-5 text-zinc-500 animate-spin" />
                </div>
              ) : orders.length > 0 ? (
                orders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/20 border border-zinc-800/30"
                >
                  <div>
                    <p className="text-sm font-medium text-white">{order.orderNumber}</p>
                    <p className="text-xs text-zinc-500">
                      {new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} &middot; {order.items.length} item
                      {order.items.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-white">
                      {formatCurrency(order.total)}
                    </p>
                    <Badge
                      variant={
                        order.status === "DELIVERED" ? "success" : "warning"
                      }
                      className="text-[10px]"
                    >
                      {order.status.toLowerCase()}
                    </Badge>
                  </div>
                </div>
              ))
              ) : (
                <div className="text-center py-6">
                  <ShoppingBag className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                  <p className="text-sm text-zinc-500">No orders yet.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Events */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">My Events</CardTitle>
              <Link href="/events">
                <Button variant="ghost" size="sm" className="text-xs">
                  Browse Events
                  <ChevronRight className="w-3 h-3 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="w-5 h-5 text-zinc-500 animate-spin" />
                </div>
              ) : registrations.length > 0 ? (
                registrations.map((reg) => (
                <div
                  key={reg.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/20 border border-zinc-800/30"
                >
                  <div>
                    <p className="text-sm font-medium text-white">
                      {reg.event.title}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {new Date(reg.event.startDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                    </p>
                  </div>
                  <Badge variant="success" className="text-[10px]">
                    {reg.status.toLowerCase()}
                  </Badge>
                </div>
              ))
              ) : (
                <div className="text-center py-6">
                  <Calendar className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                  <p className="text-sm text-zinc-500">No event registrations yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Profile Card */}
        <Card className="mt-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center">
                <User className="w-7 h-7 text-orange-500" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white">Your Profile</h3>
                <p className="text-sm text-zinc-500">
                  Update your personal information, password, and preferences.
                </p>
              </div>
              <Link href="/dashboard/settings">
                <Button variant="outline" size="sm">
                  <Settings className="w-4 h-4" />
                  Edit Profile
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
