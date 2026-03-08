"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ProtectedImage } from "@/components/ui/video-player";
import {
  ArrowRight,
  Play,
  Compass,
  User,
  Hammer,
  Shield,
  Crown,
  Mountain,
  Briefcase,
  GraduationCap,
  Megaphone,
  Home,
  Heart,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  ArrowUpRight,
  Quote,
  Users,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SectionHeading } from "@/components/ui/section-heading";
import { BackgroundVideo, VideoPlayer } from "@/components/ui/video-player";
import { SITE, KEY_DEFINITIONS, CHANNELS, EVENTS_INFO } from "@/lib/constants";
import { cn } from "@/lib/utils";

// Animation Variants
const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
};

const stagger = {
  whileInView: { transition: { staggerChildren: 0.1 } },
  viewport: { once: true },
};

const ICON_MAP: Record<string, React.ElementType> = {
  Compass, User, Hammer, Shield, Crown, Mountain,
  Briefcase, GraduationCap, Megaphone, Home, Heart,
};

//  HERO (always dark  video background) 
function HeroSection() {
  return (
    <section className="relative min-h-svh flex items-center justify-center overflow-hidden">
      <BackgroundVideo src="/videos/home-hero.mp4" poster="/images/hero-main.jpg" />

      <div className="hidden sm:block absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl animate-float z-1" />
      <div className="hidden sm:block absolute bottom-1/4 right-1/4 w-80 h-80 bg-orange-600/5 rounded-full blur-3xl animate-float z-1" style={{ animationDelay: "3s" }} />

      <div className="relative z-10 container-wide text-center px-6">
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }} className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3, duration: 0.6 }} className="inline-flex items-center gap-2 px-4 sm:px-5 py-1.5 sm:py-2 rounded-full bg-white shadow-lg shadow-black/10 mb-6 sm:mb-10">
            <BookOpen className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-orange-500" />
            <span className="text-[10px] sm:text-xs font-semibold tracking-wider uppercase text-zinc-900">{SITE.scripture.reference}</span>
          </motion.div>

          <h1 className="font-display text-[2.75rem] sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[0.9] mb-5 sm:mb-8">
            <span className="text-gradient">God.</span>{" "}
            <span className="text-white">Work.</span>{" "}
            <span className="text-gradient">Integrity.</span>
          </h1>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6, duration: 0.8 }} className="text-xs sm:text-sm md:text-base text-zinc-500 italic max-w-2xl mx-auto mb-3 sm:mb-4 leading-relaxed px-2">
            &ldquo;{SITE.scripture.text}&rdquo;
          </motion.p>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8, duration: 0.8 }} className="text-base sm:text-lg md:text-xl text-zinc-300 font-medium mb-8 sm:mb-12">
            {SITE.subtitle}
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1, duration: 0.6 }} className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Link href="/join" className="w-full sm:w-auto">
              <Button size="lg" className="group w-full sm:w-auto sm:min-w-50 h-14 sm:h-16 text-base sm:text-lg rounded-xl">
                Join The Network
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/about" className="w-full sm:w-auto">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto sm:min-w-50 h-14 sm:h-16 text-base sm:text-lg rounded-xl">
                <Play className="w-5 h-5" />
                Our Story
              </Button>
            </Link>
          </motion.div>
        </motion.div>

      </div>
    </section>
  );
}

//  WELCOME 
function WelcomeSection() {
  return (
    <section className="section-padding relative overflow-hidden">
      <div className="absolute inset-0 bg-radial-dark" />
      <div className="container-wide relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 sm:gap-12 lg:gap-16 items-center">
          <motion.div {...fadeInUp} className="order-2 lg:order-1">
            <SectionHeading label="Welcome" title="Welcome to The Integrity Man Network" align="left" />
            <motion.p {...fadeInUp} className="mt-5 sm:mt-8 text-base sm:text-lg md:text-xl text-zinc-300 leading-relaxed">
              Raising Men of Integrity for advancing The Eternal Purpose of God on Earth through work.
            </motion.p>
            <motion.p {...fadeInUp} className="mt-4 sm:mt-6 text-sm sm:text-base text-zinc-400 leading-relaxed">
              {SITE.description}
            </motion.p>
            <motion.div {...fadeInUp} className="mt-6 sm:mt-8">
              <Link href="/about" className="block sm:inline">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Learn More About Us
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </motion.div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }} className="order-1 lg:order-2">
            <VideoPlayer src="/videos/welcome.mp4" poster="/images/hero-main.jpg" title="Welcome to TIMN" />
          </motion.div>
        </div>

        <motion.div {...fadeInUp} className="mt-12 sm:mt-20 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div className="relative aspect-3/4 rounded-xl sm:rounded-2xl overflow-hidden border border-zinc-800/50 group">
            <ProtectedImage src="/images/man-1.jpg" alt="Man of Integrity" fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
            <div className="absolute inset-0 bg-linear-to-t from-zinc-950/60 to-transparent" />
          </div>
          <div className="relative aspect-3/4 rounded-xl sm:rounded-2xl overflow-hidden border border-zinc-800/50 group mt-4 sm:mt-8">
            <ProtectedImage src="/images/man-5.jpg" alt="Integrity Network" fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
            <div className="absolute inset-0 bg-linear-to-t from-zinc-950/60 to-transparent" />
          </div>
          <div className="relative aspect-3/4 rounded-xl sm:rounded-2xl overflow-hidden border border-zinc-800/50 group hidden md:block">
            <ProtectedImage src="/images/man-integrity.jpg" alt="Purpose Driven" fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
            <div className="absolute inset-0 bg-linear-to-t from-zinc-950/60 to-transparent" />
          </div>
          <div className="relative aspect-3/4 rounded-xl sm:rounded-2xl overflow-hidden border border-zinc-800/50 group mt-4 sm:mt-8 hidden md:block">
            <ProtectedImage src="/images/community-2.jpg" alt="Community of Men" fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
            <div className="absolute inset-0 bg-linear-to-t from-zinc-950/60 to-transparent" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

//  KEY DEFINITIONS — INTERACTIVE ACCORDION 
function DefinitionsSection() {
  const [openIndex, setOpenIndex] = React.useState(0);

  return (
    <section className="section-padding relative">
      <div className="container-wide">
        <motion.div {...fadeInUp}>
          <SectionHeading label="Foundations" title="Definition of Key Words" description="Understanding the pillars upon which this movement stands" />
        </motion.div>

        <motion.div {...fadeInUp} className="mt-10 sm:mt-16 max-w-4xl mx-auto">
          <div className="space-y-0 rounded-2xl overflow-hidden border border-zinc-800/50">
            {KEY_DEFINITIONS.map((def, i) => {
              const Icon = ICON_MAP[def.icon];
              const isOpen = openIndex === i;
              return (
                <div key={def.term} className={cn("border-b border-zinc-800/50 last:border-b-0 transition-colors duration-300", isOpen ? "bg-white" : "bg-zinc-900/40 hover:bg-zinc-800/40")}>
                  <button
                    onClick={() => setOpenIndex(isOpen ? -1 : i)}
                    className="w-full flex items-center gap-4 sm:gap-5 px-5 sm:px-8 py-5 sm:py-6 text-left cursor-pointer"
                  >
                    <div className={cn(
                      "shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center transition-all duration-500",
                      isOpen ? "bg-orange-500 shadow-lg shadow-orange-500/30" : "bg-transparent"
                    )}>
                      <Icon className={cn("w-5 h-5 sm:w-6 sm:h-6 transition-colors", isOpen ? "text-white" : "text-orange-500")} />
                    </div>
                    <h3 className={cn(
                      "flex-1 text-lg sm:text-xl font-bold font-display transition-colors",
                      isOpen ? "text-zinc-900" : "text-white"
                    )}>
                      {def.term}
                    </h3>
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300",
                      isOpen ? "bg-orange-500/10 rotate-45" : "bg-zinc-800"
                    )}>
                      <ArrowRight className={cn("w-4 h-4 transition-colors -rotate-45", isOpen ? "text-orange-500" : "text-zinc-400")} />
                    </div>
                  </button>

                  <motion.div
                    initial={false}
                    animate={{ height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 sm:px-8 pb-6 sm:pb-8 pl-17 sm:pl-21">
                      <p className="text-sm sm:text-base text-zinc-600 leading-relaxed">{def.definition}</p>
                    </div>
                  </motion.div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

//  CHANNELS PREVIEW — INTERACTIVE AUTO-SCROLLING CAROUSEL 
function ChannelsPreview() {
  const doubled = [...CHANNELS, ...CHANNELS]; // duplicate for seamless loop
  const scrollRef = useRef<HTMLDivElement>(null);
  const autoScrollRef = useRef<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const scrollStartX = useRef(0);
  const velocityRef = useRef(0);
  const lastMoveX = useRef(0);
  const lastMoveTime = useRef(0);

  // Speed: pixels per frame (~60fps)
  const SCROLL_SPEED = 0.8;
  const RESUME_DELAY = 4000; // ms of inactivity before auto-scroll resumes

  // Seamless loop: when past halfway, jump back
  const resetLoopPosition = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const half = el.scrollWidth / 2;
    if (el.scrollLeft >= half) {
      el.scrollLeft -= half;
    } else if (el.scrollLeft <= 0) {
      el.scrollLeft += half;
    }
  }, []);

  // Auto-scroll animation loop
  const startAutoScroll = useCallback(() => {
    const tick = () => {
      const el = scrollRef.current;
      if (el) {
        el.scrollLeft += SCROLL_SPEED;
        resetLoopPosition();
      }
      autoScrollRef.current = requestAnimationFrame(tick);
    };
    autoScrollRef.current = requestAnimationFrame(tick);
  }, [resetLoopPosition]);

  const stopAutoScroll = useCallback(() => {
    if (autoScrollRef.current) {
      cancelAnimationFrame(autoScrollRef.current);
      autoScrollRef.current = null;
    }
  }, []);

  // Pause auto-scroll and schedule resume
  const pauseAndScheduleResume = useCallback(() => {
    setIsPaused(true);
    stopAutoScroll();
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => {
      setIsPaused(false);
      startAutoScroll();
    }, RESUME_DELAY);
  }, [stopAutoScroll, startAutoScroll]);

  // Start auto-scroll on mount
  useEffect(() => {
    startAutoScroll();
    return () => {
      stopAutoScroll();
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    };
  }, [startAutoScroll, stopAutoScroll]);

  // Mouse drag handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true;
    dragStartX.current = e.clientX;
    scrollStartX.current = scrollRef.current?.scrollLeft || 0;
    lastMoveX.current = e.clientX;
    lastMoveTime.current = Date.now();
    velocityRef.current = 0;
    pauseAndScheduleResume();
  }, [pauseAndScheduleResume]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current || !scrollRef.current) return;
    e.preventDefault();
    const dx = e.clientX - dragStartX.current;
    scrollRef.current.scrollLeft = scrollStartX.current - dx;
    // Track velocity for momentum
    const now = Date.now();
    const dt = now - lastMoveTime.current;
    if (dt > 0) {
      velocityRef.current = (e.clientX - lastMoveX.current) / dt;
    }
    lastMoveX.current = e.clientX;
    lastMoveTime.current = now;
    resetLoopPosition();
  }, [resetLoopPosition]);

  const applyMomentum = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    let v = velocityRef.current * -15; // invert and scale
    const decel = 0.95;
    const tick = () => {
      if (Math.abs(v) < 0.5) return;
      el.scrollLeft += v;
      v *= decel;
      resetLoopPosition();
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [resetLoopPosition]);

  const handleMouseUp = useCallback(() => {
    if (isDragging.current) {
      isDragging.current = false;
      applyMomentum();
    }
  }, [applyMomentum]);

  // Touch drag handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    isDragging.current = true;
    dragStartX.current = e.touches[0].clientX;
    scrollStartX.current = scrollRef.current?.scrollLeft || 0;
    lastMoveX.current = e.touches[0].clientX;
    lastMoveTime.current = Date.now();
    velocityRef.current = 0;
    pauseAndScheduleResume();
  }, [pauseAndScheduleResume]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current || !scrollRef.current) return;
    const dx = e.touches[0].clientX - dragStartX.current;
    scrollRef.current.scrollLeft = scrollStartX.current - dx;
    const now = Date.now();
    const dt = now - lastMoveTime.current;
    if (dt > 0) {
      velocityRef.current = (e.touches[0].clientX - lastMoveX.current) / dt;
    }
    lastMoveX.current = e.touches[0].clientX;
    lastMoveTime.current = now;
    resetLoopPosition();
  }, [resetLoopPosition]);

  const handleTouchEnd = useCallback(() => {
    if (isDragging.current) {
      isDragging.current = false;
      applyMomentum();
    }
  }, [applyMomentum]);

  // Arrow navigation: scroll by one card width
  const scrollByCard = useCallback((direction: number) => {
    const el = scrollRef.current;
    if (!el) return;
    pauseAndScheduleResume();
    el.scrollBy({ left: direction * 340, behavior: "smooth" });
    setTimeout(() => resetLoopPosition(), 400);
  }, [pauseAndScheduleResume, resetLoopPosition]);

  // Wheel scroll support
  const handleWheel = useCallback((e: React.WheelEvent) => {
    // Only capture horizontal-ish or shift-wheel scrolls
    if (Math.abs(e.deltaX) > 5 || e.shiftKey) {
      e.preventDefault();
      const el = scrollRef.current;
      if (!el) return;
      el.scrollLeft += e.deltaX || e.deltaY;
      resetLoopPosition();
      pauseAndScheduleResume();
    }
  }, [pauseAndScheduleResume, resetLoopPosition]);

  return (
    <section className="section-padding relative overflow-hidden">
      <div className="absolute inset-0 bg-radial-dark" />
      <div className="relative z-10">
        <div className="container-wide">
          <motion.div {...fadeInUp}>
            <SectionHeading label="Our Channels" title="How We Advance The Mandate" description="Strategic channels designed to form, equip, deploy, and support men across every stage of life and calling." />
          </motion.div>
        </div>

        {/* Carousel container */}
        <div className="mt-10 sm:mt-16 relative group/carousel">
          {/* Fade edges */}
          <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-32 bg-linear-to-r from-zinc-950 to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-32 bg-linear-to-l from-zinc-950 to-transparent z-10 pointer-events-none" />

          {/* Navigation arrows */}
          <button
            onClick={() => scrollByCard(-1)}
            className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/90 backdrop-blur-sm shadow-lg flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-all duration-300 hover:bg-white hover:scale-110 active:scale-95"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-5 h-5 text-zinc-800" />
          </button>
          <button
            onClick={() => scrollByCard(1)}
            className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/90 backdrop-blur-sm shadow-lg flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-all duration-300 hover:bg-white hover:scale-110 active:scale-95"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-5 h-5 text-zinc-800" />
          </button>

          <div
            ref={scrollRef}
            className="overflow-hidden select-none"
            style={{ cursor: isDragging.current ? "grabbing" : "grab" }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onWheel={handleWheel}
          >
            <div className="flex gap-4 sm:gap-6 w-max">
              {doubled.map((channel, i) => {
                const Icon = ICON_MAP[channel.icon];
                const isEven = i % 2 === 0;
                return (
                  <Link
                    key={`${channel.id}-${i}`}
                    href={`/channels#${channel.id}`}
                    className="block shrink-0 w-80 sm:w-95 md:w-105"
                    draggable={false}
                    onClick={(e) => {
                      // Prevent navigation if we were dragging
                      if (Math.abs((scrollRef.current?.scrollLeft || 0) - scrollStartX.current) > 8) {
                        e.preventDefault();
                      }
                    }}
                  >
                    <div className={cn(
                      "group relative h-full rounded-2xl overflow-hidden border transition-all duration-500 hover:border-orange-500/30 hover:-translate-y-1",
                      isEven
                        ? "bg-white border-zinc-200"
                        : "bg-zinc-900/60 border-zinc-800/50 hover:bg-zinc-800/60"
                    )}>
                      {/* Orange accent line */}
                      <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-orange-500 to-orange-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                      <div className="p-6 sm:p-8">
                        <div className={cn(
                          "w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center mb-4 sm:mb-5 transition-all duration-500",
                          isEven
                            ? "bg-orange-500 shadow-lg shadow-orange-500/20 group-hover:shadow-orange-500/40"
                            : "bg-transparent"
                        )}>
                          <Icon className={cn(
                            "w-6 h-6 sm:w-7 sm:h-7 transition-colors",
                            isEven ? "text-white" : "text-orange-500"
                          )} />
                        </div>

                        <p className={cn(
                          "text-[10px] sm:text-xs font-semibold uppercase tracking-wider mb-2",
                          isEven ? "text-orange-500" : "text-orange-500/60"
                        )}>
                          {channel.subtitle}
                        </p>

                        <h3 className={cn(
                          "text-lg sm:text-xl font-bold font-display mb-3",
                          isEven ? "text-zinc-900" : "text-white"
                        )}>
                          {channel.title}
                        </h3>

                        <p className={cn(
                          "text-xs sm:text-sm leading-relaxed line-clamp-3",
                          isEven ? "text-zinc-600" : "text-zinc-400"
                        )}>
                          {channel.description}
                        </p>

                        <div className={cn(
                          "mt-4 sm:mt-5 flex items-center gap-2 font-semibold text-sm",
                          isEven ? "text-orange-500" : "text-orange-500/80"
                        )}>
                          Learn more <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        <motion.div {...fadeInUp} className="mt-8 sm:mt-12 text-center">
          <Link href="/channels" className="block sm:inline">
            <Button variant="outline" size="lg" className="w-full sm:w-auto">
              Explore All Channels
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

//  EVENTS PREVIEW — FULL-WIDTH STACKED PANELS 
function EventsPreview() {
  return (
    <section className="section-padding relative">
      <div className="container-wide">
        <motion.div {...fadeInUp}>
          <SectionHeading label="Gatherings" title="Our Events" description="Intentional convergence points — spaces where conviction is strengthened, brotherhood is deepened, and men are realigned with purpose." />
        </motion.div>

        <motion.div {...stagger} className="mt-10 sm:mt-16 space-y-4 sm:space-y-5">
          {EVENTS_INFO.map((event, i) => {
            const Icon = ICON_MAP[event.icon];
            const isEven = i % 2 === 0;
            return (
              <motion.div key={event.name} {...fadeInUp}>
                <div className={cn(
                  "group relative rounded-2xl overflow-hidden border transition-all duration-500 hover:-translate-y-0.5",
                  isEven
                    ? "bg-white border-zinc-200 hover:border-orange-500/30 hover:shadow-xl hover:shadow-orange-500/5"
                    : "bg-zinc-900/60 border-zinc-800/50 hover:border-orange-500/30"
                )}>
                  {/* Accent bar */}
                  <div className="absolute top-0 left-0 bottom-0 w-1 bg-linear-to-b from-orange-500 to-orange-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  <div className={cn(
                    "flex flex-col md:flex-row md:items-center gap-5 sm:gap-8 p-5 sm:p-8 md:p-10",
                    !isEven && "md:flex-row-reverse"
                  )}>
                    {/* Left — Icon + Schedule */}
                    <div className="flex items-center gap-4 md:flex-col md:items-center md:text-center md:w-40 md:shrink-0">
                      <div className={cn(
                        "w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center transition-all duration-500",
                        isEven
                          ? "bg-orange-500 shadow-lg shadow-orange-500/20 group-hover:shadow-orange-500/40"
                          : "bg-transparent"
                      )}>
                        <Icon className={cn("w-6 h-6 sm:w-7 sm:h-7", isEven ? "text-white" : "text-orange-500")} />
                      </div>
                      <div className="md:mt-3">
                        <p className={cn(
                          "text-xs sm:text-sm font-bold uppercase tracking-wider",
                          isEven ? "text-orange-500" : "text-orange-500/80"
                        )}>
                          {event.schedule}
                        </p>
                      </div>
                    </div>

                    {/* Divider */}
                    <div className={cn(
                      "hidden md:block w-px self-stretch",
                      isEven ? "bg-zinc-200" : "bg-zinc-800"
                    )} />

                    {/* Right — Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className={cn(
                        "text-xl sm:text-2xl md:text-3xl font-bold font-display mb-3",
                        isEven ? "text-zinc-900" : "text-white"
                      )}>
                        {event.name}
                      </h3>
                      <p className={cn(
                        "text-sm sm:text-base leading-relaxed mb-4",
                        isEven ? "text-zinc-600" : "text-zinc-400"
                      )}>
                        {event.description}
                      </p>
                      <p className="text-sm sm:text-base text-orange-500 italic font-medium">
                        &ldquo;{event.highlight}&rdquo;
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        <motion.div {...fadeInUp} className="mt-8 sm:mt-12 text-center">
          <Link href="/events" className="block sm:inline">
            <Button variant="outline" size="lg" className="w-full sm:w-auto">
              View All Events
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

//  SCRIPTURE BANNER (always orange bg) 
function ScriptureBanner() {
  return (
    <section className="relative py-16 sm:py-20 md:py-28 overflow-hidden">
      <div className="absolute inset-0 bg-white" />
      <div className="absolute inset-0 bg-grid opacity-5" />
      <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-zinc-300 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-zinc-300 to-transparent" />

      <div className="container-wide relative z-10">
        <motion.div {...fadeInUp} className="max-w-4xl mx-auto text-center">
          <Quote className="w-8 h-8 sm:w-10 sm:h-10 text-zinc-900/20 mx-auto mb-4 sm:mb-6" />
          <blockquote className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-display font-bold text-zinc-900 leading-snug mb-4 sm:mb-6 px-2">
            &ldquo;{SITE.scripture.text}&rdquo;
          </blockquote>
          <cite className="text-base sm:text-lg text-zinc-600 font-medium not-italic"> {SITE.scripture.reference}</cite>
        </motion.div>
      </div>
    </section>
  );
}

//  CTA 
function CTASection() {
  return (
    <section className="section-padding relative overflow-hidden">
      <div className="absolute inset-0 bg-radial-dark" />
      <div className="container-wide relative z-10">
        <motion.div {...fadeInUp} className="max-w-4xl mx-auto text-center">
          <SectionHeading label="Get Involved" title="Be Part of The Movement" description="Whether you want to join, partner, donate, or simply learn more  there is a place for you in The Integrity Man Network." />

          <motion.div {...fadeInUp} className="mt-8 sm:mt-12 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 flex-wrap">
            <Link href="/join" className="w-full sm:w-auto">
              <Button size="lg" className="group w-full sm:w-auto sm:min-w-45 h-14 sm:h-16 text-base sm:text-lg rounded-xl">
                <Users className="w-5 h-5" />
                Join Us
              </Button>
            </Link>
            <Link href="/donate" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto sm:min-w-45 h-14 sm:h-16 text-base sm:text-lg rounded-xl">
                <Heart className="w-5 h-5" />
                Donate
              </Button>
            </Link>
            <Link href="/contact" className="w-full sm:w-auto">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto sm:min-w-45 h-14 sm:h-16 text-base sm:text-lg rounded-xl">
                Contact Us
                <ArrowUpRight className="w-5 h-5" />
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

//  MAIN PAGE 
export default function HomePage() {
  return (
    <>
      <HeroSection />
      <WelcomeSection />
      <div className="divider-gradient" />
      <DefinitionsSection />
      <div className="divider-gradient" />
      <ChannelsPreview />
      <ScriptureBanner />
      <EventsPreview />
      <div className="divider-gradient" />
      <CTASection />
    </>
  );
}
