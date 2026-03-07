"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertTriangle,
  Loader2,
  Fingerprint,
  Server,
  Activity,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"email" | "password">("email");

  const handleEmailNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Enter your admin email address");
      return;
    }
    setError("");
    setStep("password");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError("Enter your password");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // First validate admin access via our API
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Authentication failed");
        setIsLoading(false);
        if (res.status === 403) {
          // Not an admin — reset to email step
          setStep("email");
          setPassword("");
        }
        return;
      }

      // Now create the actual session via NextAuth
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Session creation failed. Try again.");
        setIsLoading(false);
      } else {
        router.push("/admin");
      }
    } catch {
      setError("Connection error. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-zinc-950 relative overflow-hidden">
      {/* ── Left Panel: Branding ── */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center bg-zinc-900">
        {/* Background effects */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(249,115,22,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(249,115,22,0.03)_1px,transparent_1px)] bg-size-[40px_40px]" />
          <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-orange-500/30 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-orange-500/30 to-transparent" />
        </div>

        {/* Animated orbs */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-orange-500/5 rounded-full blur-3xl animate-pulse-glow" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-orange-500/3 rounded-full blur-3xl animate-float" />
        <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-orange-500/4 rounded-full blur-2xl" />

        {/* Content */}
        <div className="relative z-10 max-w-md px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="flex items-center gap-4 mb-10">
              <div className="w-14 h-14 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                <Shield className="w-7 h-7 text-orange-500" />
              </div>
              <div>
                <p className="text-xs font-mono text-orange-500/80 uppercase tracking-widest">
                  Control Center
                </p>
                <p className="text-xs font-mono text-zinc-600 mt-0.5">
                  v2.0 · Secure Access
                </p>
              </div>
            </div>

            <h1 className="text-4xl font-display font-bold text-white leading-tight mb-4">
              Admin
              <br />
              <span className="text-gradient">Command Center</span>
            </h1>

            <p className="text-zinc-400 text-sm leading-relaxed mb-10">
              Manage users, content, donations, products, and all operations
              from a single unified dashboard. Authorized personnel only.
            </p>

            {/* System status indicators */}
            <div className="space-y-3">
              {[
                { icon: Server, label: "System Status", value: "Operational", color: "text-green-400" },
                { icon: Activity, label: "API Health", value: "All Clear", color: "text-green-400" },
                { icon: Fingerprint, label: "Auth Level", value: "Admin Required", color: "text-orange-400" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-zinc-800/30 border border-zinc-800/50"
                >
                  <item.icon className="w-4 h-4 text-zinc-500" />
                  <span className="text-xs text-zinc-500 flex-1">{item.label}</span>
                  <span className={`text-xs font-mono font-medium ${item.color}`}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Corner accents */}
        <div className="absolute top-6 left-6 w-8 h-8 border-t-2 border-l-2 border-orange-500/20 rounded-tl-lg" />
        <div className="absolute top-6 right-6 w-8 h-8 border-t-2 border-r-2 border-orange-500/20 rounded-tr-lg" />
        <div className="absolute bottom-6 left-6 w-8 h-8 border-b-2 border-l-2 border-orange-500/20 rounded-bl-lg" />
        <div className="absolute bottom-6 right-6 w-8 h-8 border-b-2 border-r-2 border-orange-500/20 rounded-br-lg" />
      </div>

      {/* ── Right Panel: Login Form ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 relative">
        {/* Subtle grid */}
        <div className="absolute inset-0 bg-grid opacity-10" />

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-sm relative z-10"
        >
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-10">
            <Image
              src="/images/Integrity Man Official Logo.png"
              alt="TIMN"
              width={44}
              height={44}
              className="w-11 h-11 object-contain"
              priority
            />
            <div className="text-left">
              <p className="font-display font-bold text-white text-base leading-tight">
                TIMN
              </p>
              <p className="text-[10px] font-mono text-orange-500/70 uppercase tracking-wider">
                Admin Portal
              </p>
            </div>
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 mb-4">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
              <span className="text-[10px] font-mono text-orange-500 uppercase tracking-widest">
                Restricted Access
              </span>
            </div>
            <h2 className="text-xl font-display font-bold text-white">
              {step === "email" ? "Identify Yourself" : "Enter Password"}
            </h2>
            <p className="text-xs text-zinc-500 mt-2">
              {step === "email"
                ? "Enter your administrator email to continue"
                : `Signing in as ${email}`}
            </p>
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                className="mb-5"
              >
                <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <AnimatePresence mode="wait">
            {step === "email" ? (
              <motion.form
                key="email-step"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                onSubmit={handleEmailNext}
                className="space-y-5"
              >
                <div className="space-y-2">
                  <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                    Admin Email
                  </label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-orange-500 transition-colors" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(""); }}
                      placeholder="admin@imn.com"
                      className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20 transition-all"
                      autoFocus
                      autoComplete="email"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30"
                >
                  Continue
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              </motion.form>
            ) : (
              <motion.form
                key="password-step"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                onSubmit={handleLogin}
                className="space-y-5"
              >
                {/* Email display (clickable to go back) */}
                <button
                  type="button"
                  onClick={() => { setStep("email"); setError(""); setPassword(""); }}
                  className="flex items-center gap-3 px-4 py-3 w-full rounded-xl bg-zinc-900/50 border border-zinc-800/50 hover:border-zinc-700 transition-colors group text-left"
                >
                  <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0">
                    <Mail className="w-3.5 h-3.5 text-orange-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-zinc-500">Signing in as</p>
                    <p className="text-sm text-white truncate">{email}</p>
                  </div>
                  <span className="text-[10px] text-zinc-600 group-hover:text-zinc-400 transition-colors">
                    Change
                  </span>
                </button>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                    Password
                  </label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-orange-500 transition-colors" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError(""); }}
                      placeholder="••••••••••••"
                      className="w-full pl-11 pr-12 py-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20 transition-all"
                      autoFocus
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/50 text-white text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 disabled:shadow-none"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Authenticating...
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4" />
                      Sign In to Admin
                    </>
                  )}
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Footer */}
          <div className="mt-10 pt-6 border-t border-zinc-800/50">
            <div className="flex items-center justify-between text-[10px] text-zinc-600">
              <span className="font-mono">TIMN Admin v2.0</span>
              <span className="font-mono">AES-256 Encrypted</span>
            </div>
            <p className="text-center text-[10px] text-zinc-700 mt-3">
              Unauthorized access is strictly prohibited and monitored.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
