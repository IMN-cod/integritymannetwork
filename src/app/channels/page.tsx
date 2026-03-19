"use client";

import { motion } from "framer-motion";
import {
  Home,
  Heart,
  BookOpen,
  Baby,
  Users,
  Briefcase,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Shield,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SectionHeading } from "@/components/ui/section-heading";
import { VideoPlayer } from "@/components/ui/video-player";

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
};

// 
// HERO
// 

function ChannelsHero() {
  return (
    <section className="relative hero-padding overflow-hidden">
      <div className="absolute inset-0 bg-zinc-950" />
      <div className="absolute inset-0 bg-grid opacity-30" />
      <div className="absolute inset-0 bg-radial-dark" />

      <div className="container-wide relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 mb-6 sm:mb-8">
            <span className="text-[10px] sm:text-xs font-semibold tracking-wider uppercase text-orange-500">
              Our Channels
            </span>
          </div>

          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold tracking-tight text-white leading-[0.95] mb-4 sm:mb-6">
            Pathways for{" "}
            <span className="text-gradient">Growth</span>
          </h1>

          <p className="text-sm sm:text-lg md:text-xl text-zinc-400 leading-relaxed max-w-3xl mx-auto">
            Strategic channels designed to form, equip, deploy, and support men
            across every stage of life and calling  creating clear pathways for
            growth, alignment, and purposeful engagement.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

// 
// SCHOOLS SECTION
// 

function SchoolsSection() {
  const purposeCenterAims = [
    "Strengthen moral foundations",
    "Cultivate confidence rooted in identity",
    "Introduce God-conscious living",
    "Develop intellectual and creative capacity",
  ];

  return (
    <section id="schools" className="section-padding relative scroll-mt-24">
      <div className="container-wide">
        <motion.div {...fadeInUp}>
          <SectionHeading
            label="Formation"
            title="Schools"
            description="School of Integrity & Purpose Centers"
          />
        </motion.div>

        {/* School of Integrity  Full-width split layout */}
        <motion.div {...fadeInUp} className="mt-10 sm:mt-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 rounded-2xl sm:rounded-3xl overflow-hidden border border-zinc-800/50 bg-zinc-900/30">
            {/* Left  Video */}
            <div className="relative min-h-55 sm:min-h-75 lg:min-h-130">
              <VideoPlayer
                src="/videos/spiritual-discipline.mp4"
                title="Spiritual Discipline & Formation"
                rounded="none"
                aspect="aspect-auto"
                className="absolute inset-0 h-full"
              />
            </div>

            {/* Right  Content */}
            <div className="p-5 sm:p-8 md:p-12 flex flex-col justify-center">
              <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl overflow-hidden bg-white flex items-center justify-center">
                  <Image
                    src="/images/School Of Integrity.png"
                    alt="School of Integrity"
                    width={56}
                    height={56}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <h3 className="text-lg sm:text-2xl font-bold text-white font-display">
                    School of Integrity
                  </h3>
                  <p className="text-xs sm:text-sm text-orange-500/70 font-medium">
                    Structured Formation Environment
                  </p>
                </div>
              </div>

              <div className="space-y-4 sm:space-y-5 text-zinc-400 leading-relaxed text-sm sm:text-base">
                <p>
                  The School of Integrity exists to form men from the inside
                  out. In a world where information is abundant but formation is
                  rare, the School of Integrity is a structured environment for
                  deep character development, doctrinal grounding, and purpose
                  alignment.
                </p>
                <p>
                  Here, men are taught to think biblically, live righteously,
                  lead responsibly, and work purposefully. The focus is not
                  external success alone, but internal governance  shaping
                  convictions, refining motives, strengthening discipline, and
                  aligning life with God&apos;s eternal purpose.
                </p>
                <p className="text-orange-500/80 italic font-medium text-lg border-l-2 border-orange-500/30 pl-6">
                  The School of Integrity is where men are prepared to be
                  trusted by God.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Purpose Centers */}
        <motion.div {...fadeInUp} className="mt-6 sm:mt-10">
          <Card className="overflow-hidden rounded-2xl sm:rounded-3xl">
            <div className="h-1 bg-linear-to-r from-orange-500 to-orange-600" />
            <CardContent className="p-5 sm:p-8 md:p-12">
              <div className="flex items-center gap-3 sm:gap-4 mb-5 sm:mb-8">
                <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl bg-white flex items-center justify-center">
                  <Baby className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-2xl font-bold text-white font-display">
                    Purpose Centers
                  </h3>
                  <p className="text-xs sm:text-sm text-orange-500/70 font-medium">
                    Early Childhood & Primary Development
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-10">
                <div className="space-y-4 sm:space-y-5 text-zinc-400 leading-relaxed text-sm sm:text-base">
                  <p>
                    Purpose Centers are foundational environments designed to
                    nurture identity, moral clarity, and purpose awareness from
                    the earliest stages of life.
                  </p>
                  <p className="text-orange-500/80 italic font-medium text-lg border-l-2 border-orange-500/30 pl-6">
                    We believe destiny should be cultivated early, not repaired
                    later.
                  </p>
                  <p>
                    These centers integrate academic excellence with character
                    formation, spiritual awareness, creativity, and leadership
                    development. Children are guided to understand that they are
                    created intentionally, with gifts, responsibilities, and
                    divine design.
                  </p>
                  <p>
                    By shaping children early, we help prevent future crises of
                    identity and direction. We are not merely educating minds  we
                    are forming future leaders.
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">
                    Purpose Centers Aim To:
                  </h4>
                  <div className="space-y-3">
                    {purposeCenterAims.map((aim) => (
                      <div
                        key={aim}
                        className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-zinc-800/30 border border-zinc-800/50 hover:border-orange-500/20 transition-colors"
                      >
                        <CheckCircle2 className="w-4 h-4 text-orange-500 shrink-0" />
                        <span className="text-sm text-zinc-300">{aim}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}

// 
// OUTREACH SECTION
// 

function OutreachSection() {
  return (
    <section id="outreach" className="section-padding relative bg-zinc-900/30 scroll-mt-24">
      <div className="absolute inset-0 bg-radial-dark pointer-events-none" />
      <div className="container-wide relative z-10">
        <motion.div {...fadeInUp}>
          <SectionHeading
            label="Deployment"
            title="Outreach Initiatives"
            description="Campus & Corporate Campaigns  extending our mandate beyond internal formation into active engagement with society."
          />
        </motion.div>

        {/* Corporate  Full-width split with video  */}
        <motion.div {...fadeInUp} className="mt-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 rounded-2xl sm:rounded-3xl overflow-hidden border border-zinc-800/50 bg-zinc-950/50">
            {/* Left  Content */}
            <div className="p-5 sm:p-8 md:p-12 flex flex-col justify-center order-2 lg:order-1">
              <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl bg-white flex items-center justify-center">
                  <Briefcase className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-2xl font-bold text-white font-display">
                    Corporate & Business Men Outreach
                  </h3>
                  <Badge className="mt-1">Professionals & Entrepreneurs</Badge>
                </div>
              </div>

              <div className="space-y-4 sm:space-y-5 text-zinc-400 leading-relaxed text-sm sm:text-base">
                <p>
                  We engage professionals and entrepreneurs who operate within
                  corporate and business environments  spaces where integrity
                  is often tested and compromise is normalized.
                </p>
                <p>
                  Through advisory sessions, leadership forums, mentoring
                  relationships, and ethical governance training, we equip men
                  to integrate faith with work. Business is not separate from
                  divine purpose  it is a platform for stewardship, wealth
                  creation, societal transformation, and kingdom advancement.
                </p>
                <p className="text-orange-500/80 italic font-medium text-lg border-l-2 border-orange-500/30 pl-6">
                  We are raising men who succeed without corruption and
                  influence without compromise.
                </p>
              </div>
            </div>

            {/* Right  Video */}
            <div className="relative min-h-55 sm:min-h-75 lg:min-h-120 order-1 lg:order-2">
              <VideoPlayer
                src="/videos/corporate-outreach.mp4"
                title="Business & Corporate Outreach"
                rounded="none"
                aspect="aspect-auto"
                className="absolute inset-0 h-full"
              />
            </div>
          </div>
        </motion.div>

        {/* Campus Campaign  Card below */}
        <motion.div {...fadeInUp} className="mt-6 sm:mt-10">
          <Card className="overflow-hidden rounded-2xl sm:rounded-3xl">
            <div className="h-1 bg-linear-to-r from-orange-500 to-orange-600" />
            <CardContent className="p-5 sm:p-8 md:p-12">
              <div className="max-w-3xl">
                <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl bg-white flex items-center justify-center">
                    <Users className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-2xl font-bold text-white font-display">
                      Campus Campaign
                    </h3>
                    <Badge className="mt-1">Youth & Students</Badge>
                  </div>
                </div>

                <div className="space-y-4 sm:space-y-5 text-zinc-400 leading-relaxed text-sm sm:text-base">
                  <p>
                    We engage young men in schools and tertiary institutions
                    before cultural distortion defines them. Through mentorship
                    programs, leadership workshops, identity teaching, and
                    coaching sessions, we introduce purpose-driven living at
                    formative stages.
                  </p>
                  <p className="text-orange-500/80 italic font-medium text-lg border-l-2 border-orange-500/30 pl-6">
                    Our aim is prevention rather than correction  establishing
                    clarity before confusion takes root.
                  </p>
                  <p>
                    We are raising young men who understand their identity early,
                    value discipline, and pursue life with intention.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}

// 
// NETWORKING
// 

function IntegrityHousesSection() {
  const houseActivities = [
    { text: "Build trusted relationships", icon: Users },
    { text: "Engage in accountability circles", icon: Shield },
    { text: "Participate in purposeful discussions", icon: Sparkles },
    { text: "Collaborate on aligned initiatives", icon: Briefcase },
    { text: "Strengthen emotional and spiritual resilience", icon: Heart },
  ];

  return (
    <section id="houses" className="section-padding relative scroll-mt-24">
      <div className="container-wide">
        <motion.div {...fadeInUp}>
          <SectionHeading
            label="Community"
            title="Networking"
            description="Relational hubs where men grow through accountability, brotherhood, and shared purpose."
          />
        </motion.div>

        {/* Hero-style intro with full-width video */}
        <motion.div {...fadeInUp} className="mt-10 sm:mt-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 rounded-2xl sm:rounded-3xl overflow-hidden border border-zinc-800/50 bg-zinc-900/30">
            {/* Left  Video */}
            <div className="relative min-h-55 sm:min-h-75 lg:min-h-125">
              <VideoPlayer
                src="/videos/integrity-house.mp4"
                title="Integrity House Community"
                rounded="none"
                aspect="aspect-auto"
                className="absolute inset-0 h-full"
              />
            </div>

            {/* Right  Content */}
            <div className="p-5 sm:p-8 md:p-12 flex flex-col justify-center">
              <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl bg-white flex items-center justify-center">
                  <Home className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-2xl font-bold text-white font-display">
                    Covenant Communities
                  </h3>
                  <p className="text-xs sm:text-sm text-orange-500/70 font-medium">
                    Networking & Strategic Community
                  </p>
                </div>
              </div>

              <p className="text-orange-500/80 italic font-medium text-sm sm:text-lg border-l-2 border-orange-500/30 pl-4 sm:pl-6 mb-4 sm:mb-6">
                We believe isolation weakens men, but community strengthens destiny.
              </p>

              <p className="text-zinc-400 leading-relaxed mb-5 sm:mb-8 text-sm sm:text-base">
                An Integrity House is more than a networking space  it is a
                covenant community. It provides structured environments where men
                connect meaningfully, sharpen one another, share opportunities,
                pray together, solve problems, and walk through life&apos;s seasons
                with support and spiritual alignment.
              </p>

              <div className="space-y-3">
                {houseActivities.map(({ text, icon: Icon }) => (
                  <div
                    key={text}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl bg-zinc-800/30 border border-zinc-800/50 hover:border-orange-500/20 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-orange-500" />
                    </div>
                    <span className="text-sm text-zinc-300">{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Second video  Brother's Brother Initiative */}
        <motion.div {...fadeInUp} className="mt-6 sm:mt-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 rounded-2xl sm:rounded-3xl overflow-hidden border border-zinc-800/50 bg-zinc-900/30">
            {/* Left  Content */}
            <div className="p-5 sm:p-8 md:p-12 flex flex-col justify-center order-2 lg:order-1">
              <h3 className="text-lg sm:text-2xl font-bold text-white font-display mb-3 sm:mb-4">
                Brother&apos;s Brother Initiative
              </h3>
              <p className="text-zinc-400 leading-relaxed mb-4 sm:mb-6 text-sm sm:text-base">
                A relational framework within the Networking channel where men are
                intentionally paired and grouped for deeper accountability, prayer
                partnership, and mutual support. No man walks alone.
              </p>
              <p className="text-zinc-400 leading-relaxed text-sm sm:text-base">
                These Houses cultivate brotherhood that protects integrity,
                reinforces conviction, and sustains long-term purpose. Every man
                needs a brother who will speak truth, hold the line, and walk the
                journey together.
              </p>
            </div>

            {/* Right  Video */}
            <div className="relative min-h-50 sm:min-h-70 lg:min-h-100 order-1 lg:order-2">
              <VideoPlayer
                src="/videos/brothers-brother.mp4"
                title="Brother's Brother Initiative"
                rounded="none"
                aspect="aspect-auto"
                className="absolute inset-0 h-full"
              />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// 
// SUPPORT & CHARITY
// 

function ManFoundationSection() {
  const supportAreas = [
    { text: "Schools and training programs", icon: BookOpen },
    { text: "Youth and campus outreach", icon: Users },
    { text: "Community interventions", icon: Shield },
    { text: "Men-focused development projects", icon: Sparkles },
  ];

  return (
    <section id="foundation" className="section-padding relative bg-zinc-900/30 scroll-mt-24">
      <div className="absolute inset-0 bg-radial-dark pointer-events-none" />
      <div className="container-wide relative z-10">
        <motion.div {...fadeInUp}>
          <SectionHeading
            label="Sustainability"
            title="Support & Charity"
            description="The resource mobilization and social impact arm that fuels sustainable transformation."
          />
        </motion.div>

        <motion.div {...fadeInUp} className="mt-16">
          <div className="rounded-2xl sm:rounded-3xl overflow-hidden border border-zinc-800/50 bg-zinc-950/50">
            <div className="h-1 bg-linear-to-r from-orange-500 to-orange-600" />
            <div className="p-5 sm:p-8 md:p-12 lg:p-16">
              {/* Header */}
              <div className="flex items-center gap-3 sm:gap-5 mb-6 sm:mb-10">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-white flex items-center justify-center">
                  <Heart className="w-5 h-5 sm:w-7 sm:h-7 text-orange-500" />
                </div>
                <div>
                  <h3 className="text-xl sm:text-3xl font-bold text-white font-display">
                    Support & Charity
                  </h3>
                  <p className="text-xs sm:text-base text-orange-500/70 font-medium mt-0.5 sm:mt-1">
                    Fundraising & Social Impact
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12">
                {/* Left  Content */}
                <div className="space-y-4 sm:space-y-6 text-zinc-400 leading-relaxed text-sm sm:text-base">
                  <p className="text-orange-500/80 italic font-medium text-xl border-l-3 border-orange-500/40 pl-6">
                    Vision without provision remains limited.
                  </p>
                  <p>
                    Support & Charity exists to ensure that purpose-driven
                    initiatives are resourced, scaled, and sustained. Through
                    partnerships, fundraising campaigns, donor networks, and
                    strategic collaborations, we mobilize financial and material
                    support.
                  </p>
                  <p className="text-orange-500/80 italic font-medium border-l-3 border-orange-500/40 pl-6">
                    We believe generosity is not charity alone  it is strategic
                    investment in generational impact.
                  </p>
                  <p>
                    Support & Charity ensures that transformation is not temporary,
                    but institutionalized and enduring.
                  </p>

                  <div className="pt-3 sm:pt-4">
                    <Link href="/donate" className="block sm:inline">
                      <Button size="lg" className="px-8 w-full sm:w-auto">
                        Support The Vision
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Right  Support areas */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-white mb-6">
                    We mobilize support for:
                  </h4>
                  {supportAreas.map(({ text, icon: Icon }) => (
                    <div
                      key={text}
                      className="flex items-center gap-4 px-6 py-4 rounded-2xl bg-zinc-800/20 border border-zinc-800/40 hover:border-orange-500/20 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0">
                        <Icon className="w-5 h-5 text-orange-500" />
                      </div>
                      <span className="text-zinc-300">{text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// 
// MAIN CHANNELS PAGE
// 

export default function ChannelsPage() {
  return (
    <>
      <ChannelsHero />
      <div className="divider-gradient" />
      <SchoolsSection />
      <div className="divider-gradient" />
      <OutreachSection />
      <div className="divider-gradient" />
      <IntegrityHousesSection />
      <div className="divider-gradient" />
      <ManFoundationSection />
    </>
  );
}
