"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  X,
  ShoppingBag,
  User,
  LogIn,
  Home,
  Info,
  Megaphone,
  Calendar,
  BookOpen,
  Heart,
  MessageSquare,
  UserPlus,
  ArrowRight,
  GraduationCap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { NAV_LINKS } from "@/lib/constants";
import { cn } from "@/lib/utils";

// Icons for each mobile nav item
const NAV_ICONS: Record<string, React.ElementType> = {
  "/": Home,
  "/about": Info,
  "/channels": Megaphone,
  "/school": GraduationCap,
  "/events": Calendar,
  "/blog": BookOpen,
  "/donate": Heart,
  "/contact": MessageSquare,
  "/join": UserPlus,
  "/store": ShoppingBag,
  "/community": User,
};

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();
  const closeMobileMenu = () => setIsMobileOpen(false);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 20);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Prevent body scroll when mobile menu open
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileOpen]);

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
          isScrolled
            ? "bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800/50 shadow-2xl shadow-black/20"
            : "bg-transparent"
        )}
      >
        {/* Top Accent Line */}
        <div className="h-0.5 bg-linear-to-r from-transparent via-orange-500 to-transparent" />

        <div className="container-wide">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo */}
            <Link href="/" onClick={closeMobileMenu} className="flex items-center gap-2.5 sm:gap-3 group">
              <div className="relative">
                <Image
                  src="/images/Integrity Man Official Logo.png"
                  alt="Integrity Man Network"
                  width={44}
                  height={44}
                  className="w-9 h-9 sm:w-11 sm:h-11 object-contain drop-shadow-lg group-hover:scale-105 transition-transform duration-300"
                  priority
                />
                <div className="absolute -inset-1 rounded-xl bg-orange-500/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              <div className="flex flex-col">
                <span className="text-base sm:text-lg font-bold tracking-tight text-white leading-none">
                  Integrity Man
                </span>
                <span className="text-[9px] sm:text-[10px] font-semibold tracking-[0.2em] uppercase text-orange-500/80 leading-none mt-0.5 sm:mt-1">
                  Network
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {NAV_LINKS.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={closeMobileMenu}
                    className={cn(
                      "relative px-4 py-2 text-sm font-medium transition-colors duration-200 rounded-lg",
                      isActive
                        ? "text-orange-500"
                        : "text-zinc-400 hover:text-white"
                    )}
                  >
                    {link.label}
                    {isActive && (
                      <motion.div
                        layoutId="activeNav"
                        className="absolute inset-0 bg-white/15 rounded-lg border border-white/20"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Cart */}
              <Link
                href="/store"
                className="relative p-2 text-zinc-400 hover:text-white transition-colors duration-200"
              >
                <ShoppingBag className="w-5 h-5" />
              </Link>

              {/* Auth  desktop only */}
              <div className="hidden sm:flex items-center gap-2">
                <Link href="/auth/login" onClick={closeMobileMenu}>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <LogIn className="w-4 h-4" />
                    Sign In
                  </Button>
                </Link>
                <Link href="/join" onClick={closeMobileMenu}>
                  <Button size="sm">Join Us</Button>
                </Link>
              </div>

              {/* Mobile Toggle */}
              <button
                onClick={() => setIsMobileOpen(!isMobileOpen)}
                className="lg:hidden p-2 text-zinc-400 hover:text-white transition-colors"
                aria-label={isMobileOpen ? "Close menu" : "Open menu"}
              >
                {isMobileOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-60 lg:hidden"
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsMobileOpen(false)}
            />

            {/* Menu Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="absolute right-0 top-0 bottom-0 w-[85%] max-w-sm bg-zinc-950 border-l border-zinc-800/50 shadow-2xl overflow-y-auto"
            >
              {/* Menu Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-800/50">
                <div className="flex items-center gap-2.5">
                  <Image
                    src="/images/Integrity Man Official Logo.png"
                    alt="Integrity Man Network"
                    width={32}
                    height={32}
                    className="w-8 h-8 object-contain"
                  />
                  <span className="text-sm font-bold text-white">Menu</span>
                </div>
                <button
                  onClick={closeMobileMenu}
                  className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Links */}
              <nav className="px-4 py-4">
                <div className="space-y-1">
                  {NAV_LINKS.map((link, i) => {
                    const isActive = pathname === link.href;
                    const Icon = NAV_ICONS[link.href] || Megaphone;
                    return (
                      <motion.div
                        key={link.href}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                      >
                        <Link
                          href={link.href}
                          onClick={closeMobileMenu}
                          className={cn(
                            "flex items-center gap-4 px-4 py-3.5 rounded-xl text-base font-medium transition-all duration-200",
                            isActive
                              ? "bg-white/15 text-orange-500 border border-white/20"
                              : "text-zinc-300 hover:bg-zinc-900 active:bg-zinc-800"
                          )}
                        >
                          <div
                            className={cn(
                              "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                              isActive
                                ? "bg-white/20"
                                : "bg-zinc-800/50"
                            )}
                          >
                            <Icon
                              className={cn(
                                "w-4 h-4",
                                isActive ? "text-orange-500" : "text-zinc-500"
                              )}
                            />
                          </div>
                          <span className="flex-1">{link.label}</span>
                          {isActive && (
                            <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                          )}
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>
              </nav>

              {/* Divider */}
              <div className="mx-6 h-px bg-zinc-800/50" />

              {/* Bottom Actions */}
              <div className="px-6 py-6 space-y-3">
                <Link href="/auth/login" onClick={closeMobileMenu} className="block">
                  <Button variant="secondary" className="w-full justify-center h-12 text-base" size="lg">
                    <LogIn className="w-4 h-4" />
                    Sign In
                  </Button>
                </Link>
                <Link href="/join" onClick={closeMobileMenu} className="block">
                  <Button className="w-full justify-center h-12 text-base" size="lg">
                    Join The Network
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>

              {/* Footer note */}
              <div className="px-6 pb-8">
                <p className="text-[11px] text-zinc-600 text-center">
                  The Integrity Man Network
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
