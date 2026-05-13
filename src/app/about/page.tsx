"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  ArrowRight,
  GraduationCap,
  Megaphone,
  Home,
  Heart,
  Target,
  Eye,
  Flame,
  Map,
  User,
  Sparkles,
  Sunrise,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BackgroundVideo, VideoPlayer, ProtectedImage } from "@/components/ui/video-player";
import { ABOUT_CONTENT, CHANNELS, FOUNDER_BIO, SITE } from "@/lib/constants";

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
};

const CHANNEL_ICONS: Record<string, React.ElementType> = {
  schools: GraduationCap,
  outreach: Megaphone,
  houses: Home,
  foundation: Heart,
};

const SECTION_ICONS = {
  whoWeAre: Eye,
  burden: Flame,
  mandate: Target,
  method: Map,
};

//  HERO (always dark  video background) 
function AboutHero() {
  return (
    <section className="relative hero-padding overflow-hidden">
      <BackgroundVideo src="/videos/about-hero.mp4" poster="/images/hero-alt.jpg" />

      <div className="container-wide relative z-10">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="max-w-4xl mx-auto text-center">
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold tracking-tight text-white leading-[0.95] mb-4 sm:mb-6">
            Raising Men of <span className="text-gradient">Integrity</span>
          </h1>

          <p className="text-sm sm:text-lg md:text-xl text-zinc-400 leading-relaxed max-w-3xl mx-auto">
            {SITE.description}
          </p>
        </motion.div>
      </div>
    </section>
  );
}

//  CONTENT SECTION 
function ContentSection({
  section,
  icon: Icon,
  accent = false,
  image,
  video,
  imageAlt = "",
  reverse = false,
}: {
  section: { title: string; paragraphs: readonly string[] };
  icon: React.ElementType;
  accent?: boolean;
  image?: string;
  video?: string;
  imageAlt?: string;
  reverse?: boolean;
}) {
  const hasMedia = image || video;
  return (
    <section className={`section-padding relative ${accent ? "bg-zinc-900/30" : ""}`}>
      {accent && <div className="absolute inset-0 bg-radial-dark pointer-events-none" />}
      <div className="container-wide relative z-10">
        <div className={`${hasMedia ? "grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-center" : "max-w-4xl mx-auto"}`}>
          <div className={`${reverse ? "lg:order-2" : ""} ${hasMedia ? "order-2 lg:order-0" : ""}`}>
            <motion.div {...fadeInUp} className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-10">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-white flex items-center justify-center">
                <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white font-display">{section.title}</h2>
            </motion.div>

            <div className="space-y-4 sm:space-y-6">
              {section.paragraphs.map((paragraph, i) => (
                <motion.p key={i} {...fadeInUp} className="text-sm sm:text-base md:text-lg text-zinc-400 leading-relaxed">
                  {paragraph}
                </motion.p>
              ))}
            </div>
          </div>

          {hasMedia && (
            <motion.div
              initial={{ opacity: 0, x: reverse ? -30 : 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className={`${reverse ? "lg:order-1" : ""} order-1 lg:order-0`}
            >
              {video ? (
                <VideoPlayer src={video} rounded="2xl" />
              ) : image ? (
                <div className="relative aspect-4/3 rounded-xl sm:rounded-2xl overflow-hidden border border-zinc-800/50">
                  <ProtectedImage src={image} alt={imageAlt || section.title} fill className="object-cover" />
                  <div className="absolute inset-0 bg-linear-to-t from-zinc-950/30 to-transparent" />
                </div>
              ) : null}
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}

//  METHOD / CHANNELS 
function MethodSection() {
  return (
    <section className="section-padding relative">
      <div className="container-wide">
        <div className="max-w-4xl mx-auto">
          <motion.div {...fadeInUp} className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-white flex items-center justify-center">
              <Map className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white font-display">{ABOUT_CONTENT.method.title}</h2>
          </motion.div>

          {ABOUT_CONTENT.method.paragraphs.map((p, i) => (
            <motion.p key={i} {...fadeInUp} className="text-sm sm:text-base md:text-lg text-zinc-400 leading-relaxed mb-5 sm:mb-8">{p}</motion.p>
          ))}

          <motion.p {...fadeInUp} className="text-sm sm:text-base text-zinc-400 leading-relaxed mb-8 sm:mb-12">
            Below is an overview of our core channels. Each channel addresses a specific dimension of formation, deployment, or support.
          </motion.p>
        </div>

        <motion.div {...fadeInUp} className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 max-w-5xl mx-auto">
          {CHANNELS.map((channel) => {
            const Icon = CHANNEL_ICONS[channel.id];
            return (
              <Link key={channel.id} href={`/channels#${channel.id}`}>
                <Card variant="light" className="group h-full p-4 sm:p-6 hover:border-orange-500/30 cursor-pointer transition-all duration-500 hover:-translate-y-1">
                  <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-white flex items-center justify-center mb-3 sm:mb-4">
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />
                  </div>
                  <h3 className="text-sm sm:text-lg font-bold text-zinc-900 mb-1 sm:mb-2">{channel.title}</h3>
                  <p className="text-[10px] sm:text-xs text-orange-500/70 font-medium uppercase tracking-wider mb-1 sm:mb-2">{channel.subtitle}</p>
                  <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed line-clamp-2 sm:line-clamp-3 hidden sm:block">{channel.description}</p>
                </Card>
              </Link>
            );
          })}
        </motion.div>

        <motion.div {...fadeInUp} className="mt-8 sm:mt-12 text-center">
          <Link href="/channels" className="block sm:inline">
            <Button variant="outline" size="lg" className="w-full sm:w-auto">
              Explore All Channels in Detail
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

//  FOUNDER BIO 
function BioSection() {
  const [bioExpanded, setBioExpanded] = useState(false);
  return (
    <section id="bio" className="section-padding relative bg-zinc-900/30">
      <div className="absolute inset-0 bg-radial-dark pointer-events-none" />
      <div className="container-wide relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 items-start">
          {/* Image + identity card */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-5 lg:sticky lg:top-24"
          >
            <div className="relative aspect-4/5 rounded-xl sm:rounded-2xl overflow-hidden border border-zinc-800/50 group">
              <ProtectedImage
                src={FOUNDER_BIO.image}
                alt={FOUNDER_BIO.name}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-linear-to-t from-zinc-950 via-zinc-950/30 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-7">
                <h3 className="font-display text-2xl sm:text-3xl font-bold text-white leading-tight">{FOUNDER_BIO.name}</h3>
                <p className="text-sm sm:text-base text-white mt-1">Founder &amp; Lead Steward</p>
              </div>
            </div>
          </motion.div>

          {/* Bio content */}
          <div className="lg:col-span-7">
            <motion.div {...fadeInUp} className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-white flex items-center justify-center">
                <User className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-orange-400 font-semibold">Bio</p>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white font-display leading-tight">The Man Behind the Vision</h2>
              </div>
            </motion.div>

            <motion.p {...fadeInUp} className="text-base sm:text-lg md:text-xl text-zinc-300 leading-relaxed font-light italic border-l-2 border-orange-500/60 pl-4 sm:pl-5">
              {FOUNDER_BIO.intro}
            </motion.p>

            {/* Read more toggle — sits right below the italicised intro */}
            <div className="mt-5 sm:mt-6">
              <button
                type="button"
                onClick={() => setBioExpanded((v) => !v)}
                aria-expanded={bioExpanded}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-orange-400 hover:text-orange-300 transition-colors"
              >
                {bioExpanded ? (
                  <>
                    Show less <ChevronUp className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    Read more <ChevronDown className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

            {/* Everything below is collapsed until Read more is tapped */}
            <AnimatePresence initial={false}>
              {bioExpanded && (
                <motion.div
                  key="bio-expanded"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <div className="space-y-4 sm:space-y-6 pt-6 sm:pt-8">
                    {FOUNDER_BIO.paragraphs.map((p, i) => (
                      <p key={i} className="text-sm sm:text-base md:text-lg text-zinc-400 leading-relaxed">
                        {p}
                      </p>
                    ))}
                  </div>

                  {/* Founder of */}
                  <div className="mt-10 sm:mt-12">
                    <div className="flex items-center gap-2 mb-4 sm:mb-5">
                      <Sparkles className="w-4 h-4 text-orange-500" />
                      <h3 className="text-xs sm:text-sm uppercase tracking-[0.2em] text-orange-400 font-semibold">Founder Of</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      {FOUNDER_BIO.founderOf.map((item) => (
                        <Card key={item} variant="light" className="p-4 sm:p-5 hover:border-orange-500/30 transition-all duration-500">
                          <p className="text-sm sm:text-base font-semibold text-zinc-900">{item}</p>
                        </Card>
                      ))}
                    </div>
                  </div>

                  {/* Prayer platforms */}
                  <div className="mt-10 sm:mt-12">
                    <div className="flex items-center gap-2 mb-4 sm:mb-5">
                      <Sunrise className="w-4 h-4 text-orange-500" />
                      <h3 className="text-xs sm:text-sm uppercase tracking-[0.2em] text-orange-400 font-semibold">Altar of Righteousness — Prayer Platforms</h3>
                    </div>
                    <div className="space-y-3 sm:space-y-4">
                      {FOUNDER_BIO.prayerPlatforms.map((p) => (
                        <div key={p.name} className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3 border-l-2 border-zinc-800 hover:border-orange-500/60 pl-4 sm:pl-5 py-2 transition-colors">
                          <p className="text-base sm:text-lg font-semibold text-white">{p.name}</p>
                          <p className="text-xs sm:text-sm text-zinc-500">{p.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function AboutPage() {
  return (
    <>
      <AboutHero />
      <div className="divider-gradient" />
      <BioSection />
      <div className="divider-gradient" />
      <ContentSection section={ABOUT_CONTENT.whoWeAre} icon={SECTION_ICONS.whoWeAre} image="/images/man-integrity.jpg" imageAlt="Men of Integrity" />
      <div className="divider-gradient" />
      <ContentSection section={ABOUT_CONTENT.burden} icon={SECTION_ICONS.burden} accent image="/images/god-work.jpg" imageAlt="God Work Integrity" reverse />
      <div className="divider-gradient" />
      <ContentSection section={ABOUT_CONTENT.mandate} icon={SECTION_ICONS.mandate} image="/images/man-5.jpg" imageAlt="The Mandate" />
      <div className="divider-gradient" />
      <MethodSection />
    </>
  );
}
