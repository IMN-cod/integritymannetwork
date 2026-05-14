"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export function DonateBanner() {
  return (
    <section className="relative overflow-hidden bg-zinc-950 border-t border-zinc-800/50">
      {/* Orange glow */}
      <div className="absolute inset-0 bg-linear-to-r from-orange-500/10 via-orange-500/5 to-transparent pointer-events-none" />
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="container-wide relative z-10 py-10 sm:py-14">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 sm:gap-8">
          {/* Left */}
          <div className="text-center sm:text-left">
            <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white font-display leading-tight">
              Support the Mission
            </h3>
            <p className="text-sm sm:text-base text-zinc-400 mt-1 max-w-md">
              Your gift fuels schools, outreach, and men&apos;s formation across nations.
              Every amount makes an eternal difference.
            </p>
          </div>

          {/* Right */}
          <div className="shrink-0 w-full sm:w-auto">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link href="/donate">Donate Now</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
