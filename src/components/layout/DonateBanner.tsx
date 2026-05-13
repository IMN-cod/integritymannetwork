"use client";

import Link from "next/link";
import { Heart, ArrowRight } from "lucide-react";
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
          <div className="flex items-start gap-4 sm:gap-5 text-center sm:text-left">
            <div className="shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-linear-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white font-display leading-tight">
                Support the Mission
              </h3>
              <p className="text-sm sm:text-base text-zinc-400 mt-1 max-w-md">
                Your gift fuels schools, outreach, and men&apos;s formation across nations.
                Every amount makes an eternal difference.
              </p>
            </div>
          </div>

          {/* Right */}
          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link href="/donate">
                <Heart className="w-4 h-4" />
                Donate Now
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
              <Link href="/donate">
                Learn More
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
