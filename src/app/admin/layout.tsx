"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Users,
  FileText,
  Calendar,
  ShoppingBag,
  Heart,
  MessageSquare,
  Settings,
  BarChart3,
  Menu,
  X,
  LogOut,
  ChevronRight,
  Bell,
  ExternalLink,
  Shield,
  Search,
  ChevronDown,
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

const sidebarLinks = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Blog Posts", href: "/admin/blog", icon: FileText },
  { label: "Events", href: "/admin/events", icon: Calendar },
  { label: "Products", href: "/admin/products", icon: ShoppingBag },
  { label: "Donations", href: "/admin/donations", icon: Heart },
  { label: "Messages", href: "/admin/messages", icon: MessageSquare },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  // Close sidebar & profile dropdown on route change
  useEffect(() => {
    setSidebarOpen(false);
    setProfileOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [sidebarOpen]);

  // If on admin login page, render children only (no sidebar/topbar)
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push("/admin/login");
  };

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  const adminName = session?.user?.name || "Admin";
  const adminEmail = session?.user?.email || "";
  const adminRole = session?.user?.role || "ADMIN";
  const adminInitials = adminName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen bg-zinc-950">
      {/*  Mobile Top Bar  */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-zinc-950/95 backdrop-blur-xl border-b border-zinc-800/50 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 -ml-2 text-zinc-500 hover:text-white transition-colors"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2">
            <Image
              src="/images/Integrity Man Official Logo.png"
              alt="TIMN"
              width={28}
              height={28}
              className="w-7 h-7 object-contain"
            />
            <span className="text-sm font-bold text-white">TIMN Admin</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 text-zinc-500 hover:text-white transition-colors relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full" />
          </button>
          <button
            onClick={handleSignOut}
            className="p-2 text-zinc-500 hover:text-red-400 transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/*  Desktop Top Bar  */}
      <div className="hidden lg:flex fixed top-0 left-64 right-0 z-40 h-14 bg-zinc-950/95 backdrop-blur-xl border-b border-zinc-800/50 items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" />
            <input
              type="text"
              placeholder="Search admin..."
              className="w-64 pl-9 pr-3 py-1.5 text-xs rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-700 transition-colors"
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            View Site
          </Link>
          <div className="w-px h-5 bg-zinc-800" />
          <button className="p-2 text-zinc-500 hover:text-white transition-colors relative">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-orange-500 rounded-full" />
          </button>
          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-zinc-800/50 transition-colors"
            >
              <div className="w-7 h-7 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                <span className="text-[10px] font-bold text-orange-500">{adminInitials}</span>
              </div>
              <div className="text-left hidden xl:block">
                <p className="text-xs font-medium text-white leading-tight">{adminName}</p>
                <p className="text-[10px] text-zinc-500">{adminRole === "SUPER_ADMIN" ? "Super Admin" : "Admin"}</p>
              </div>
              <ChevronDown className="w-3 h-3 text-zinc-500" />
            </button>
            {profileOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                <div className="absolute right-0 top-full mt-1 w-56 rounded-xl bg-zinc-900 border border-zinc-800 shadow-xl shadow-black/40 z-50 py-1 animate-fade-in">
                  <div className="px-4 py-3 border-b border-zinc-800">
                    <p className="text-sm font-medium text-white">{adminName}</p>
                    <p className="text-xs text-zinc-500 truncate">{adminEmail}</p>
                  </div>
                  <Link
                    href="/admin/settings"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-colors"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    Admin Settings
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2 px-4 py-2.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/5 transition-colors w-full text-left"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/*  Mobile Backdrop  */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/*  Sidebar  */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 w-64 h-screen border-r border-zinc-800/50 bg-zinc-950 transition-transform duration-300 ease-in-out",
          "lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-zinc-800/50">
          <Image
            src="/images/Integrity Man Official Logo.png"
            alt="Integrity Man Network"
            width={36}
            height={36}
            className="w-9 h-9 object-contain"
          />
          <div>
            <p className="font-display font-bold text-white text-sm">TIMN</p>
            <p className="text-[10px] font-mono text-orange-500/70 uppercase tracking-wider">Admin Panel</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="py-4 px-3 space-y-1 overflow-y-auto h-[calc(100vh-140px)] scrollbar-thin">
          {sidebarLinks.map((link) => {
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group",
                  active
                    ? "bg-orange-500/10 text-orange-500 border border-orange-500/20"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
                )}
              >
                <link.icon
                  className={cn(
                    "w-4 h-4 transition-colors",
                    active ? "text-orange-500" : "text-zinc-500 group-hover:text-orange-500"
                  )}
                />
                {link.label}
                {active && (
                  <ChevronRight className="w-3 h-3 ml-auto text-orange-500/60" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-zinc-800/50 p-3 space-y-1">
          {/* Admin info */}
          <div className="flex items-center gap-3 px-3 py-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
              <span className="text-[10px] font-bold text-orange-500">{adminInitials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">{adminName}</p>
              <p className="text-[10px] text-zinc-500 truncate">{adminEmail}</p>
            </div>
          </div>
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 transition-all"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            View Site
          </Link>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-red-400/70 hover:text-red-400 hover:bg-red-500/5 transition-all w-full text-left"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/*  Main Content  */}
      <main className="lg:ml-64 min-h-screen">
        <div className="p-4 sm:p-6 lg:p-8 pt-18 lg:pt-22">{children}</div>
      </main>
    </div>
  );
}
