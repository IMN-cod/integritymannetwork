"use client";

import { useState, useCallback, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ProtectedImage } from "@/components/ui/video-player";
import {
  Heart,
  ArrowRight,
  Lock,
  Shield,
  Globe,
  Building2,
  Users,
  Zap,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertCircle,
  CreditCard,
  Smartphone,
  Landmark,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SectionHeading } from "@/components/ui/section-heading";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

// Paystack inline type
declare global {
  interface Window {
    PaystackPop: {
      setup: (config: {
        key: string;
        email: string;
        amount: number;
        currency?: string;
        ref?: string;
        access_code?: string;
        channels?: string[];
        label?: string;
        onClose: () => void;
        callback: (response: { reference: string; status: string }) => void;
      }) => { openIframe: () => void };
    };
  }
}

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
};

// ──────────────────────────────────────────
// HERO — Cinematic full-width
// ──────────────────────────────────────────

function DonateHero() {
  return (
    <section className="relative min-h-[70svh] sm:min-h-[80svh] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-zinc-950" />
      <div className="absolute inset-0">
        <ProtectedImage
          src="/images/man-integrity.jpg"
          alt="Man of Integrity"
          fill
          className="object-cover opacity-[0.12]"
          priority
        />
        <div className="absolute inset-0 bg-linear-to-b from-zinc-950/40 via-zinc-950/70 to-zinc-950" />
      </div>
      <div className="absolute inset-0 bg-grid opacity-20" />

      {/* Floating ambient glows */}
      <div className="hidden sm:block absolute top-1/3 left-1/4 w-125 h-125 bg-orange-500/4 rounded-full blur-3xl animate-float" />
      <div className="hidden sm:block absolute bottom-1/4 right-1/5 w-100 h-100 bg-orange-600/3 rounded-full blur-3xl animate-float" style={{ animationDelay: "3s" }} />

      <div className="container-wide relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-4xl mx-auto text-center"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-6 sm:mb-10"
          >
            <Heart className="w-3.5 h-3.5 text-orange-500" />
            <span className="text-[10px] sm:text-xs font-semibold tracking-[0.2em] uppercase text-orange-400">
              Support The Vision
            </span>
          </motion.div>

          <h1 className="font-display text-[2.5rem] sm:text-5xl md:text-6xl lg:text-8xl font-bold tracking-tight text-white leading-[0.9] mb-5 sm:mb-8">
            Fuel The{" "}
            <span className="text-gradient">Mission</span>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-sm sm:text-lg md:text-xl text-zinc-400 leading-relaxed max-w-2xl mx-auto mb-8 sm:mb-12"
          >
            Your generosity fuels the formation of men, the expansion of
            communities, and purpose-driven impact across nations.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="flex items-center justify-center gap-6 sm:gap-10 text-zinc-500"
          >
            {[
              { icon: Lock, text: "Secure Payments" },
              { icon: Globe, text: "Give From Anywhere" },
              { icon: Shield, text: "Tax-Deductible" },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-2">
                <item.icon className="w-3.5 h-3.5 text-orange-500/60" />
                <span className="text-[10px] sm:text-xs font-medium">{item.text}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-linear-to-t from-zinc-950 to-transparent" />
    </section>
  );
}

// ──────────────────────────────────────────
// IMPACT AREAS — Bento-style grid
// ──────────────────────────────────────────

const impactAreas = [
  {
    icon: Building2,
    title: "Schools & Training",
    description:
      "Fund the School of Integrity and Purpose Centers that form men and children with clarity and conviction.",
    accent: "from-orange-500/20 to-orange-600/5",
  },
  {
    icon: Users,
    title: "Youth & Campus Outreach",
    description:
      "Support outreach programs that reach young men in schools and universities before compromise defines them.",
    accent: "from-amber-500/20 to-amber-600/5",
  },
  {
    icon: Globe,
    title: "Community Interventions",
    description:
      "Help fund community-focused initiatives that address social challenges through a purpose-driven approach.",
    accent: "from-orange-400/20 to-orange-500/5",
  },
  {
    icon: Shield,
    title: "Network Operations",
    description:
      "Support the infrastructure, technology, events, and operations that keep the network running globally.",
    accent: "from-yellow-500/20 to-yellow-600/5",
  },
];

function ImpactSection() {
  return (
    <section className="section-padding relative">
      <div className="absolute inset-0 bg-radial-dark pointer-events-none" />
      <div className="container-wide relative z-10">
        <motion.div {...fadeInUp}>
          <SectionHeading
            label="Your Impact"
            title="Where Your Gift Goes"
            description="Every contribution directly advances our mandate to form, equip, and deploy men of integrity."
          />
        </motion.div>

        <div className="mt-10 sm:mt-16 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 max-w-4xl mx-auto">
          {impactAreas.map((area, index) => (
            <motion.div
              key={area.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.6,
                delay: index * 0.1,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="group"
            >
              <div className="relative h-full rounded-2xl border border-zinc-800/80 bg-zinc-900/60 backdrop-blur-sm p-5 sm:p-7 transition-all duration-500 hover:border-orange-500/20 hover:bg-zinc-900/80 overflow-hidden">
                {/* Subtle gradient bg on hover */}
                <div className={cn(
                  "absolute inset-0 bg-linear-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500",
                  area.accent
                )} />

                <div className="relative z-10">
                  <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mb-4 sm:mb-5 group-hover:bg-orange-500/15 transition-colors">
                    <area.icon className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white font-display mb-2">
                    {area.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                    {area.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ──────────────────────────────────────────
// DONATION FORM — Premium payment experience
// ──────────────────────────────────────────

const presetAmounts = [
  { value: 50, label: "GH₵50" },
  { value: 100, label: "GH₵100" },
  { value: 200, label: "GH₵200" },
  { value: 500, label: "GH₵500" },
  { value: 1000, label: "GH₵1,000" },
  { value: 2500, label: "GH₵2,500" },
];

type PaymentChannel = "mobile_money" | "card" | "bank_transfer";

type MomoProvider = "mtn" | "vod" | "tgo";

type DonationState =
  | { step: "form" }
  | { step: "payment" }
  | { step: "processing"; message: string }
  | { step: "awaiting_approval"; reference: string; displayText: string; requiresOtp?: boolean }
  | { step: "success"; reference: string; amount: number; channel: string }
  | { step: "failed"; message: string };

const MOMO_PROVIDERS: { id: MomoProvider; name: string; color: string }[] = [
  { id: "mtn", name: "MTN", color: "bg-yellow-500" },
  { id: "vod", name: "Vodafone", color: "bg-red-500" },
  { id: "tgo", name: "AirtelTigo", color: "bg-blue-500" },
];

function DonationForm() {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(200);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [donationType, setDonationType] = useState<"one-time" | "monthly">("one-time");
  const [donorEmail, setDonorEmail] = useState("");
  const [donorName, setDonorName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [donationState, setDonationState] = useState<DonationState>({ step: "form" });

  // Payment step state
  const [paymentChannel, setPaymentChannel] = useState<PaymentChannel>("mobile_money");
  const [momoPhone, setMomoPhone] = useState("");
  const [momoProvider, setMomoProvider] = useState<MomoProvider>("mtn");
  const [donationId, setDonationId] = useState<string | null>(null);
  const [otp, setOtp] = useState("");
  const [otpSubmitting, setOtpSubmitting] = useState(false);

  // Paystack popup for card (loaded dynamically)
  const [paystackReady, setPaystackReady] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://js.paystack.co/v1/inline.js";
    script.async = true;
    script.onload = () => setPaystackReady(true);
    if (formRef.current) {
      formRef.current.appendChild(script);
    }
    return () => {
      script.remove();
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const currentAmount = customAmount ? parseInt(customAmount, 10) : selectedAmount;

  // ── Poll for payment status (Mobile Money / Bank Transfer) ──
  const startPolling = useCallback((reference: string) => {
    if (pollRef.current) clearInterval(pollRef.current);

    let attempts = 0;
    pollRef.current = setInterval(async () => {
      attempts++;
      if (attempts > 60) {
        if (pollRef.current) clearInterval(pollRef.current);
        setDonationState({
          step: "failed",
          message: "Payment timed out. If you completed the payment, it will be confirmed shortly.",
        });
        return;
      }

      try {
        const res = await fetch(`/api/donate/charge/status?reference=${encodeURIComponent(reference)}`);
        const data = await res.json();

        if (data.status === "success") {
          if (pollRef.current) clearInterval(pollRef.current);
          setDonationState({
            step: "success",
            reference: data.reference,
            amount: data.amount,
            channel: data.channel,
          });
        } else if (data.status === "failed") {
          if (pollRef.current) clearInterval(pollRef.current);
          setDonationState({
            step: "failed",
            message: "Payment was not completed. Please try again.",
          });
        }
      } catch {
        // Continue polling on network errors
      }
    }, 5000);
  }, []);

  // ── Step 1: Create donation record ──
  const handleProceedToPayment = async () => {
    setError(null);

    if (!donorEmail || !donorEmail.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!currentAmount || currentAmount < 5) {
      setError("Minimum donation amount is GH₵5.");
      return;
    }

    setDonationState({ step: "processing", message: "Setting up your donation..." });

    try {
      const res = await fetch("/api/donate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: currentAmount,
          currency: "GHS",
          isRecurring: donationType === "monthly",
          paymentMethod: "PAYSTACK",
          donorEmail,
          donorName: donorName || undefined,
          skipInit: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to initialize donation");

      setDonationId(data.donationId);
      setDonationState({ step: "payment" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setDonationState({ step: "form" });
    }
  };

  // ── Step 2a: Mobile Money payment ──
  const handleMomoPayment = async () => {
    setError(null);

    if (!momoPhone || momoPhone.length < 10) {
      setError("Please enter a valid mobile money number.");
      return;
    }
    if (!donationId) {
      setError("Donation not initialized. Please go back and try again.");
      return;
    }

    setDonationState({ step: "processing", message: "Initiating mobile money payment..." });

    try {
      const res = await fetch("/api/donate/charge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          donationId,
          channel: "mobile_money",
          phone: momoPhone,
          provider: momoProvider,
          email: donorEmail,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Mobile money charge failed");

      if (data.status === "send_otp" || data.status === "pay_offline" || data.status === "pending") {
        const needsOtp = data.status === "send_otp";
        setDonationState({
          step: "awaiting_approval",
          reference: data.reference,
          displayText: data.displayText || (needsOtp ? "Enter the OTP sent to your phone." : "Please approve the payment on your phone."),
          requiresOtp: needsOtp,
        });
        if (!needsOtp) startPolling(data.reference);
      } else if (data.status === "success") {
        setDonationState({
          step: "success",
          reference: data.reference,
          amount: currentAmount!,
          channel: "mobile_money",
        });
      } else {
        setDonationState({
          step: "failed",
          message: data.displayText || "Payment failed. Please try again.",
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setDonationState({ step: "payment" });
    }
  };

  // ── Step 2b: Card payment (uses Paystack popup — PCI requirement) ──
  const handleCardPayment = async () => {
    if (!paystackReady || !window.PaystackPop) {
      setError("Card payment is loading. Please wait a moment.");
      return;
    }
    if (!donationId) return;

    setDonationState({ step: "processing", message: "Opening secure card form..." });

    try {
      // Initialize a Paystack transaction for card only
      const res = await fetch("/api/donate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: currentAmount,
          currency: "GHS",
          isRecurring: donationType === "monthly",
          paymentMethod: "PAYSTACK",
          donorEmail,
          donorName: donorName || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to initialize");

      const handler = window.PaystackPop.setup({
        key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "",
        email: donorEmail,
        amount: Math.round((currentAmount || 0) * 100),
        currency: "GHS",
        access_code: data.accessCode,
        channels: ["card"],
        label: donorName || undefined,
        callback: (response: { reference: string; status: string }) => {
          // Verify the payment
          setDonationState({ step: "processing", message: "Verifying payment..." });
          fetch("/api/donate/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reference: response.reference }),
          })
            .then((r) => r.json())
            .then((d) => {
              if (d.success) {
                setDonationState({
                  step: "success",
                  reference: response.reference,
                  amount: d.amount,
                  channel: d.channel,
                });
              } else {
                setDonationState({ step: "failed", message: d.error || "Verification failed" });
              }
            })
            .catch(() => {
              setDonationState({ step: "failed", message: "Could not verify payment." });
            });
        },
        onClose: () => {
          setDonationState({ step: "payment" });
          setError("Card payment was cancelled. You can try again.");
        },
      });

      handler.openIframe();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setDonationState({ step: "payment" });
    }
  };

  // ── Step 2c: Bank Transfer ──
  const handleBankTransfer = async () => {
    if (!donationId) return;

    setDonationState({ step: "processing", message: "Generating bank transfer details..." });

    try {
      const res = await fetch("/api/donate/charge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          donationId,
          channel: "bank_transfer",
          email: donorEmail,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Bank transfer charge failed");

      setDonationState({
        step: "awaiting_approval",
        reference: data.reference,
        displayText: data.displayText || "Transfer to the account details provided and we'll confirm your payment.",
      });
      startPolling(data.reference);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setDonationState({ step: "payment" });
    }
  };

  // ── Submit OTP for pending charge ──
  const handleSubmitOtp = async () => {
    if (!otp || otp.length < 4) {
      setError("Please enter the OTP sent to your phone.");
      return;
    }
    if (donationState.step !== "awaiting_approval") return;

    setOtpSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/donate/charge/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reference: donationState.reference,
          otp,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "OTP verification failed");

      if (data.status === "success") {
        setDonationState({
          step: "success",
          reference: data.reference,
          amount: currentAmount!,
          channel: "mobile_money",
        });
      } else {
        // After OTP submission, Paystack may need time to process — start polling
        setDonationState({
          step: "awaiting_approval",
          reference: donationState.reference,
          displayText: data.displayText || "Processing your payment...",
          requiresOtp: false,
        });
        startPolling(donationState.reference);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "OTP submission failed");
    } finally {
      setOtpSubmitting(false);
    }
  };

  const resetForm = () => {
    setDonationState({ step: "form" });
    setDonorEmail("");
    setDonorName("");
    setSelectedAmount(200);
    setCustomAmount("");
    setMomoPhone("");
    setDonationId(null);
    setOtp("");
    setError(null);
    if (pollRef.current) clearInterval(pollRef.current);
  };

  // ══════════════════════════════════════════
  // SUCCESS STATE
  // ══════════════════════════════════════════
  if (donationState.step === "success") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center py-6 sm:py-10"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", bounce: 0.4 }}
          className="w-20 h-20 rounded-full bg-green-500/10 border-2 border-green-500/30 flex items-center justify-center mx-auto mb-6"
        >
          <CheckCircle2 className="w-10 h-10 text-green-500" />
        </motion.div>

        <h3 className="text-2xl sm:text-3xl font-bold text-white font-display mb-2">
          God Bless You!
        </h3>
        <p className="text-sm sm:text-base text-zinc-400 mb-6 max-w-sm mx-auto">
          Your generous donation of{" "}
          <span className="text-orange-500 font-bold">
            {formatCurrency(donationState.amount)}
          </span>{" "}
          has been received successfully.
        </p>

        <div className="inline-flex flex-col gap-2 text-left bg-zinc-800/40 rounded-xl p-4 border border-zinc-700/40">
          <div className="flex items-center justify-between gap-8">
            <span className="text-xs text-zinc-500">Reference</span>
            <span className="text-xs text-zinc-300 font-mono">{donationState.reference}</span>
          </div>
          <div className="flex items-center justify-between gap-8">
            <span className="text-xs text-zinc-500">Paid via</span>
            <span className="text-xs text-zinc-300 capitalize">{donationState.channel.replace("_", " ")}</span>
          </div>
          <div className="flex items-center justify-between gap-8">
            <span className="text-xs text-zinc-500">Type</span>
            <span className="text-xs text-zinc-300">{donationType === "monthly" ? "Monthly Recurring" : "One-Time"}</span>
          </div>
        </div>

        <Button variant="outline" className="mt-8" onClick={resetForm}>
          Make Another Donation
        </Button>
      </motion.div>
    );
  }

  // ══════════════════════════════════════════
  // FAILED STATE
  // ══════════════════════════════════════════
  if (donationState.step === "failed") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-6 sm:py-10"
      >
        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-8 h-8 text-red-400" />
        </div>
        <h3 className="text-xl font-bold text-white font-display mb-2">
          Payment Failed
        </h3>
        <p className="text-sm text-zinc-400 mb-6">{donationState.message}</p>
        <div className="flex gap-3 justify-center">
          <Button onClick={() => setDonationState({ step: "payment" })}>
            Try Again
          </Button>
          <Button variant="outline" onClick={resetForm}>
            Start Over
          </Button>
        </div>
      </motion.div>
    );
  }

  // ══════════════════════════════════════════
  // AWAITING APPROVAL (Mobile Money / Bank Transfer)
  // ══════════════════════════════════════════
  if (donationState.step === "awaiting_approval") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-6 sm:py-10"
      >
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-20 h-20 rounded-full bg-orange-500/10 border-2 border-orange-500/30 flex items-center justify-center mx-auto mb-6"
        >
          <Smartphone className="w-10 h-10 text-orange-500" />
        </motion.div>

        <h3 className="text-xl sm:text-2xl font-bold text-white font-display mb-2">
          {donationState.requiresOtp ? "Enter OTP" : "Approve on Your Phone"}
        </h3>
        <p className="text-sm text-zinc-400 mb-6 max-w-sm mx-auto">
          {donationState.displayText}
        </p>

        <div className="inline-flex flex-col gap-2 text-left bg-zinc-800/40 rounded-xl p-4 border border-zinc-700/40 mb-6">
          <div className="flex items-center justify-between gap-8">
            <span className="text-xs text-zinc-500">Amount</span>
            <span className="text-xs text-orange-400 font-bold">{formatCurrency(currentAmount || 0)}</span>
          </div>
          <div className="flex items-center justify-between gap-8">
            <span className="text-xs text-zinc-500">Reference</span>
            <span className="text-xs text-zinc-300 font-mono">{donationState.reference}</span>
          </div>
        </div>

        {donationState.requiresOtp ? (
          <div className="max-w-xs mx-auto mb-6">
            {error && (
              <div className="flex items-center gap-2 text-red-400 text-xs mb-3 justify-center">
                <AlertCircle className="w-3.5 h-3.5" />
                {error}
              </div>
            )}
            <div className="flex gap-2">
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                className="text-center text-lg tracking-[0.3em] font-mono"
                autoFocus
              />
              <Button
                onClick={handleSubmitOtp}
                disabled={otpSubmitting || otp.length < 4}
                className="bg-orange-600 hover:bg-orange-700 min-w-25"
              >
                {otpSubmitting ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                  />
                ) : (
                  "Confirm"
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 text-zinc-500 mb-6">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              className="w-4 h-4 border-2 border-zinc-600 border-t-orange-500 rounded-full"
            />
            <span className="text-xs">Waiting for confirmation...</span>
          </div>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (pollRef.current) clearInterval(pollRef.current);
            setOtp("");
            setDonationState({ step: "payment" });
          }}
        >
          Cancel
        </Button>
      </motion.div>
    );
  }

  // ══════════════════════════════════════════
  // PROCESSING STATE
  // ══════════════════════════════════════════
  if (donationState.step === "processing") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-10 sm:py-16"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
          className="w-14 h-14 border-3 border-zinc-700 border-t-orange-500 rounded-full mx-auto mb-6"
        />
        <p className="text-sm text-zinc-400">{donationState.message}</p>
      </motion.div>
    );
  }

  // ══════════════════════════════════════════
  // PAYMENT METHOD SELECTION (Step 2)
  // ══════════════════════════════════════════
  if (donationState.step === "payment") {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-6"
      >
        {/* Amount summary */}
        <div className="rounded-xl bg-linear-to-r from-orange-500/10 to-orange-600/5 border border-orange-500/20 p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] sm:text-xs text-zinc-400 uppercase tracking-wider font-medium">
                {donationType === "monthly" ? "Monthly Donation" : "One-Time Donation"}
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-white font-display mt-1">
                {formatCurrency(currentAmount || 0)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setDonationState({ step: "form" });
                setDonationId(null);
              }}
              className="text-xs text-orange-400 hover:text-orange-300 font-medium transition-colors"
            >
              Edit
            </button>
          </div>
        </div>

        {/* Payment method tabs */}
        <div>
          <p className="text-xs sm:text-sm font-semibold text-white tracking-wide mb-3">
            Choose Payment Method
          </p>
          <div className="grid grid-cols-3 gap-2">
            {([
              { id: "mobile_money" as PaymentChannel, icon: Smartphone, label: "Mobile Money" },
              { id: "card" as PaymentChannel, icon: CreditCard, label: "Card" },
              { id: "bank_transfer" as PaymentChannel, icon: Landmark, label: "Bank Transfer" },
            ]).map((method) => (
              <button
                key={method.id}
                type="button"
                onClick={() => setPaymentChannel(method.id)}
                className={cn(
                  "relative flex flex-col items-center gap-2 py-4 px-2 rounded-xl border transition-all duration-300",
                  paymentChannel === method.id
                    ? "border-orange-500/60 bg-orange-500/8 text-orange-500"
                    : "border-zinc-700/50 bg-zinc-800/30 text-zinc-400 hover:border-zinc-600/60 hover:text-zinc-300"
                )}
              >
                <method.icon className="w-5 h-5" />
                <span className="text-[10px] sm:text-xs font-semibold">{method.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Mobile Money Form ── */}
        <AnimatePresence mode="wait">
          {paymentChannel === "mobile_money" && (
            <motion.div
              key="momo"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Provider selection */}
              <div>
                <p className="text-[10px] sm:text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">
                  Select Provider
                </p>
                <div className="flex gap-2">
                  {MOMO_PROVIDERS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setMomoProvider(p.id)}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border text-xs sm:text-sm font-bold transition-all duration-300",
                        momoProvider === p.id
                          ? "border-orange-500/50 bg-orange-500/8 text-white"
                          : "border-zinc-700/50 bg-zinc-800/30 text-zinc-400 hover:border-zinc-600/60"
                      )}
                    >
                      <div className={cn("w-2.5 h-2.5 rounded-full", p.color)} />
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Phone number */}
              <div>
                <p className="text-[10px] sm:text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">
                  Mobile Money Number
                </p>
                <Input
                  type="tel"
                  placeholder="0XX XXX XXXX"
                  value={momoPhone}
                  onChange={(e) => setMomoPhone(e.target.value.replace(/[^0-9]/g, ""))}
                  maxLength={10}
                  className="h-13 text-lg font-mono bg-zinc-800/30 border-zinc-700/40 focus:border-orange-500/50 rounded-xl tracking-wider"
                />
              </div>

              <Button
                type="button"
                size="xl"
                className="w-full"
                onClick={handleMomoPayment}
                disabled={!momoPhone || momoPhone.length < 10}
              >
                <span className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4" />
                  Pay {formatCurrency(currentAmount || 0)} with {MOMO_PROVIDERS.find(p => p.id === momoProvider)?.name}
                </span>
              </Button>
            </motion.div>
          )}

          {/* ── Card Form ── */}
          {paymentChannel === "card" && (
            <motion.div
              key="card"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="rounded-xl bg-zinc-800/40 border border-zinc-700/30 p-4 sm:p-5">
                <div className="flex items-center gap-3 mb-3">
                  <Lock className="w-4 h-4 text-green-500" />
                  <span className="text-xs text-zinc-400">Secure card payment powered by Paystack</span>
                </div>
                <p className="text-[10px] text-zinc-600 leading-relaxed">
                  You&apos;ll enter your card details in a secure, PCI-compliant form. Your card information never touches our servers.
                </p>
              </div>

              <Button
                type="button"
                size="xl"
                className="w-full"
                onClick={handleCardPayment}
              >
                <span className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Pay {formatCurrency(currentAmount || 0)} with Card
                </span>
              </Button>
            </motion.div>
          )}

          {/* ── Bank Transfer Form ── */}
          {paymentChannel === "bank_transfer" && (
            <motion.div
              key="bank"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="rounded-xl bg-zinc-800/40 border border-zinc-700/30 p-4 sm:p-5">
                <div className="flex items-center gap-3 mb-3">
                  <Landmark className="w-4 h-4 text-orange-500" />
                  <span className="text-xs text-zinc-400">Direct bank transfer</span>
                </div>
                <p className="text-[10px] text-zinc-600 leading-relaxed">
                  We&apos;ll generate a unique account number for your transfer. The payment will be confirmed automatically once we receive it.
                </p>
              </div>

              <Button
                type="button"
                size="xl"
                className="w-full"
                onClick={handleBankTransfer}
              >
                <span className="flex items-center gap-2">
                  <Landmark className="w-4 h-4" />
                  Generate Transfer Details
                </span>
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 sm:p-4 flex items-start gap-3"
          >
            <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
            <p className="text-xs sm:text-sm text-red-400">{error}</p>
          </motion.div>
        )}

        {/* Trust signals */}
        <div className="flex items-center justify-center gap-1.5 text-zinc-600 pt-2">
          <Lock className="w-3 h-3" />
          <span className="text-[10px] sm:text-xs">
            256-bit SSL encrypted &middot; Powered by Paystack
          </span>
        </div>
      </motion.div>
    );
  }

  // ══════════════════════════════════════════
  // DONATION DETAILS FORM (Step 1)
  // ══════════════════════════════════════════
  const isProcessing = false;

  return (
    <form
      ref={formRef}
      onSubmit={(e) => {
        e.preventDefault();
        handleProceedToPayment();
      }}
      className="space-y-6 sm:space-y-8"
    >

      {/* ── Step 1: Frequency ── */}
      <div>
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center">
            <span className="text-[10px] font-bold text-white">1</span>
          </div>
          <span className="text-xs sm:text-sm font-semibold text-white tracking-wide">Choose Frequency</span>
        </div>
        <div className="flex gap-1.5 p-1 rounded-xl bg-zinc-800/60 border border-zinc-700/40 w-full sm:w-fit">
          {(["one-time", "monthly"] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setDonationType(type)}
              className={cn(
                "flex-1 sm:flex-none px-5 sm:px-8 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-300 relative",
                donationType === type
                  ? "text-white"
                  : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              {donationType === type && (
                <motion.div
                  layoutId="frequency-bg"
                  className="absolute inset-0 bg-linear-to-r from-orange-500 to-orange-600 rounded-lg shadow-lg shadow-orange-500/25"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                {type === "monthly" && <Zap className="w-3 h-3" />}
                {type === "one-time" ? "One-Time" : "Monthly"}
              </span>
            </button>
          ))}
        </div>
        {donationType === "monthly" && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="text-[10px] sm:text-xs text-orange-400/80 mt-2 flex items-center gap-1.5"
          >
            <Sparkles className="w-3 h-3" />
            Monthly giving creates sustained, lasting impact
          </motion.p>
        )}
      </div>

      {/* ── Step 2: Amount ── */}
      <div>
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center">
            <span className="text-[10px] font-bold text-white">2</span>
          </div>
          <span className="text-xs sm:text-sm font-semibold text-white tracking-wide">Select Amount</span>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {presetAmounts.map(({ value, label }) => (
            <motion.button
              key={value}
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                setSelectedAmount(value);
                setCustomAmount("");
              }}
              className={cn(
                "relative py-3.5 sm:py-4 rounded-xl text-sm sm:text-base font-bold transition-all duration-300 border overflow-hidden",
                selectedAmount === value && !customAmount
                  ? "border-orange-500/60 text-orange-500 bg-orange-500/8"
                  : "border-zinc-700/50 text-zinc-300 bg-zinc-800/30 hover:border-zinc-600/60 hover:bg-zinc-800/50"
              )}
            >
              {selectedAmount === value && !customAmount && (
                <motion.div
                  layoutId="amount-ring"
                  className="absolute inset-0 rounded-xl ring-1 ring-orange-500/40"
                  transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                />
              )}
              <span className="relative z-10">{label}</span>
            </motion.button>
          ))}
        </div>

        {/* Custom amount */}
        <div className="mt-3 sm:mt-4">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-zinc-500">GH₵</span>
            <Input
              type="number"
              placeholder="Enter custom amount"
              value={customAmount}
              onChange={(e) => {
                setCustomAmount(e.target.value);
                setSelectedAmount(null);
              }}
              className="pl-14 h-12 sm:h-13 text-base bg-zinc-800/30 border-zinc-700/40 focus:border-orange-500/50 rounded-xl"
            />
          </div>
          <p className="text-[10px] text-zinc-600 mt-1.5">Minimum donation: GH₵5</p>
        </div>
      </div>

      {/* ── Step 3: Your Details ── */}
      <div>
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center">
            <span className="text-[10px] font-bold text-white">3</span>
          </div>
          <span className="text-xs sm:text-sm font-semibold text-white tracking-wide">Your Details</span>
        </div>
        <div className="space-y-3">
          <Input
            type="text"
            placeholder="Full Name (optional)"
            value={donorName}
            onChange={(e) => setDonorName(e.target.value)}
            className="h-12 sm:h-13 text-base bg-zinc-800/30 border-zinc-700/40 focus:border-orange-500/50 rounded-xl"
          />
          <Input
            type="email"
            placeholder="Email address *"
            value={donorEmail}
            onChange={(e) => setDonorEmail(e.target.value)}
            required
            className="h-12 sm:h-13 text-base bg-zinc-800/30 border-zinc-700/40 focus:border-orange-500/50 rounded-xl"
          />
          <p className="text-[10px] text-zinc-600">
            Email is required for your payment receipt.
          </p>
        </div>
      </div>

      {/* ── Error Message ── */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 sm:p-4 flex items-start gap-3"
        >
          <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
          <p className="text-xs sm:text-sm text-red-400">{error}</p>
        </motion.div>
      )}

      <div className="space-y-3">
        <Button
          type="submit"
          size="xl"
          className="w-full group relative overflow-hidden"
          disabled={isProcessing}
        >
          <span className="relative z-10 flex items-center gap-2">
            <Heart className="w-4 h-4 sm:w-5 sm:h-5" />
            {currentAmount && currentAmount >= 5
              ? `Continue — ${formatCurrency(currentAmount)}`
              : "Continue to Payment"}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </span>
        </Button>

        {/* Trust signals */}
        <div className="flex items-center justify-center gap-1.5 text-zinc-600">
          <Lock className="w-3 h-3" />
          <span className="text-[10px] sm:text-xs">
            256-bit SSL encrypted &middot; Powered by Paystack
          </span>
        </div>
      </div>
    </form>
  );
}

// ──────────────────────────────────────────
// SCRIPTURE BANNER — Elevated design
// ──────────────────────────────────────────

function ScriptureBanner() {
  return (
    <section className="py-16 sm:py-24 md:py-32 bg-linear-to-br from-orange-600 via-orange-500 to-orange-700 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 w-125 h-125 bg-white/6 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-125 h-125 bg-white/6 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />
        <div className="absolute inset-0 bg-[url('/images/man-integrity.jpg')] bg-cover bg-center opacity-[0.06] mix-blend-overlay" />
      </div>
      <div className="container-wide relative z-10 text-center">
        <motion.div {...fadeInUp}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm mb-6 sm:mb-8">
            <Heart className="w-3 h-3 text-white" />
            <span className="text-[10px] sm:text-xs font-semibold tracking-[0.2em] uppercase text-white/90">
              The Word
            </span>
          </div>
          <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-display font-bold text-white leading-relaxed max-w-3xl mx-auto">
            &ldquo;Give, and it will be given to you. A good measure, pressed
            down, shaken together and running over, will be poured into your
            lap.&rdquo;
          </p>
          <div className="mt-6 sm:mt-8 inline-flex items-center gap-3">
            <div className="h-px w-8 bg-white/30" />
            <p className="text-white/70 font-medium text-sm sm:text-base">Luke 6:38</p>
            <div className="h-px w-8 bg-white/30" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ──────────────────────────────────────────
// RETURN STATUS — After payment redirect
// ──────────────────────────────────────────

function DonationStatus() {
  const searchParams = useSearchParams();
  const status = searchParams.get("status");
  const ref = searchParams.get("ref");

  if (!status) return null;

  return (
    <section className="section-padding relative">
      <div className="container-wide max-w-2xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 backdrop-blur-sm p-8 sm:p-12"
        >
          {status === "success" ? (
            <>
              <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white font-display mb-3">
                Thank You!
              </h2>
              <p className="text-sm sm:text-base text-zinc-400 leading-relaxed mb-2">
                Your donation has been received. God bless your generosity.
              </p>
              {ref && (
                <p className="text-xs text-zinc-600">Reference: {ref}</p>
              )}
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-full bg-zinc-700/30 border border-zinc-700/40 flex items-center justify-center mx-auto mb-6">
                <XCircle className="w-8 h-8 text-zinc-500" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white font-display mb-3">
                Donation Cancelled
              </h2>
              <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
                No worries — your payment was not processed. You can try again anytime.
              </p>
            </>
          )}
        </motion.div>
      </div>
    </section>
  );
}

// ──────────────────────────────────────────
// PAGE COMPOSITION
// ──────────────────────────────────────────

function DonatePageContent() {
  const searchParams = useSearchParams();
  const status = searchParams.get("status");

  // If returning from payment, show status instead of hero + form
  if (status) {
    return (
      <>
        <DonateHero />
        <div className="divider-gradient" />
        <DonationStatus />
        <div className="divider-gradient" />
        <ScriptureBanner />
      </>
    );
  }

  return (
    <>
      <DonateHero />
      <div className="divider-gradient" />
      <ImpactSection />
      <div className="divider-gradient" />

      {/* ── Donation Form Section ── */}
      <section className="section-padding relative overflow-hidden">
        <div className="absolute inset-0 bg-radial-dark pointer-events-none" />
        <div className="absolute inset-0 bg-grid opacity-10" />

        <div className="container-wide relative z-10">
          <motion.div {...fadeInUp}>
            <SectionHeading
              label="Give"
              title="Make Your Donation"
              description="Choose your amount, frequency, and preferred payment method to support the vision."
            />
          </motion.div>

          <div className="mt-10 sm:mt-14 grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10 max-w-6xl mx-auto">
            {/* Form — takes majority of space */}
            <motion.div {...fadeInUp} className="lg:col-span-7">
              <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 backdrop-blur-sm shadow-2xl shadow-black/40 overflow-hidden">
                {/* Form header */}
                <div className="px-5 sm:px-8 pt-6 sm:pt-8 pb-4 sm:pb-5 border-b border-zinc-800/60">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                      <Heart className="w-5 h-5 text-orange-500" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-white font-display">
                        Partner With Us
                      </h3>
                      <p className="text-[10px] sm:text-xs text-zinc-500">
                        Every gift makes a difference
                      </p>
                    </div>
                  </div>
                </div>

                {/* Form body */}
                <div className="p-5 sm:p-8">
                  <DonationForm />
                </div>
              </div>
            </motion.div>

            {/* Side panel — imagery + extra info */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="lg:col-span-5 space-y-5 hidden lg:flex lg:flex-col"
            >
              {/* Main image */}
              <div className="relative flex-1 min-h-80 rounded-2xl overflow-hidden border border-zinc-800/60">
                <ProtectedImage
                  src="/images/man-5.jpg"
                  alt="Support the Vision"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-linear-to-t from-zinc-950/90 via-zinc-950/30 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <p className="text-white font-display text-xl font-bold mb-2">
                    Your Gift Matters
                  </p>
                  <p className="text-zinc-300 text-sm leading-relaxed">
                    Every contribution fuels the formation of men and the
                    expansion of purpose across nations.
                  </p>
                </div>
              </div>

              {/* Trust bar */}
              <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/60 backdrop-blur-sm p-5">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { icon: Shield, label: "Verified Ministry" },
                    { icon: Lock, label: "Data Protected" },
                    { icon: Globe, label: "Global Reach" },
                    { icon: Heart, label: "100% To Mission" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0">
                        <item.icon className="w-3.5 h-3.5 text-orange-500" />
                      </div>
                      <span className="text-[11px] font-medium text-zinc-400">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Secondary image */}
              <div className="relative h-40 rounded-2xl overflow-hidden border border-zinc-800/60">
                <ProtectedImage
                  src="/images/hero-alt.jpg"
                  alt="Integrity Man Network"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-linear-to-t from-zinc-950/60 to-transparent" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <div className="divider-gradient" />
      <ScriptureBanner />
    </>
  );
}

export default function DonatePage() {
  return (
    <Suspense>
      <DonatePageContent />
    </Suspense>
  );
}
