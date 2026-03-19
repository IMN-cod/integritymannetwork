"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Shield,
  User,
  Mail,
  MapPin,
  Briefcase,
  BookOpen,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import { VideoPlayer, VideoCard } from "@/components/ui/video-player";

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
};

// 
// HERO
// 

function JoinHero() {
  return (
    <section className="relative hero-padding overflow-hidden">
      <div className="absolute inset-0 bg-zinc-950" />
      <div className="absolute inset-0 bg-grid opacity-30" />
      <div className="absolute inset-0 bg-radial-dark" />

      <div className="container-wide relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="order-2 lg:order-1"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 mb-5 sm:mb-8">
              <Shield className="w-3.5 h-3.5 text-orange-500" />
              <span className="text-[10px] sm:text-xs font-semibold tracking-wider uppercase text-orange-500">
                Become A Member
              </span>
            </div>

            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold tracking-tight text-white leading-[0.95] mb-4 sm:mb-6">
              Join The{" "}
              <span className="text-gradient">Network</span>
            </h1>

            <p className="text-sm sm:text-lg md:text-xl text-zinc-400 leading-relaxed max-w-2xl">
              Step into a covenant community of men committed to integrity,
              purpose-driven work, and alignment with God&apos;s eternal plan.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="order-1 lg:order-2"
          >
            <VideoPlayer
              src="/videos/join-explainer-1.mp4"
              poster="/images/join-thumb-1.jpg"
              title="How To Join The Network"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// 
// BENEFITS
// 

const benefits = [
  {
    icon: BookOpen,
    title: "School of Integrity Access",
    description:
      "Gain access to our structured formation programs, teachings, and mentorship tracks.",
  },
  {
    icon: User,
    title: "Integrity House Membership",
    description:
      "Join a local covenant community of men for accountability, prayer, and brotherhood.",
  },
  {
    icon: Briefcase,
    title: "Events & Retreats",
    description:
      "Priority access and reduced rates for The Integrity Summit, Men's Retreat, and more.",
  },
  {
    icon: Mail,
    title: "Exclusive Content",
    description:
      "Receive newsletters, devotionals, teaching resources, and community updates.",
  },
  {
    icon: Shield,
    title: "Community Platform",
    description:
      "Access the online community platform for discussions, networking, and shared resources.",
  },
  {
    icon: MapPin,
    title: "Global Network",
    description:
      "Connect with men of purpose across cities and nations through our growing network.",
  },
];

function BenefitsSection() {
  return (
    <section className="section-padding">
      <div className="container-wide">
        <motion.div {...fadeInUp}>
          <SectionHeading
            label="Membership"
            title="What You Gain"
            description="When you join The Integrity Man Network, you gain more than access  you gain alignment."
          />
        </motion.div>

        <div className="mt-8 sm:mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {benefits.map((benefit, index) => (
            <motion.div
              key={benefit.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.6,
                delay: index * 0.1,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <Card variant="light" className="h-full hover:border-orange-500/20 transition-colors">
                <CardContent className="p-4 sm:p-6">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-white flex items-center justify-center mb-3 sm:mb-4">
                    <benefit.icon className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-zinc-900 font-display mb-1 sm:mb-2">
                    {benefit.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                    {benefit.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// 
// REGISTRATION FORM
// 

function RegistrationForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-16"
      >
        <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-8 h-8 text-orange-500" />
        </div>
        <h3 className="text-2xl font-bold text-white font-display mb-3">
          Welcome to the Network!
        </h3>
        <p className="text-zinc-400 max-w-sm mx-auto">
          Your registration has been received. We&apos;ll be in touch shortly
          with next steps and access details.
        </p>
        <Link href="/">
          <Button className="mt-8" variant="outline">
            Return Home
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <div className="space-y-1.5 sm:space-y-2">
          <label htmlFor="firstName" className="text-xs sm:text-sm font-medium text-zinc-300">
            First Name *
          </label>
          <Input id="firstName" name="firstName" placeholder="John" required />
        </div>
        <div className="space-y-1.5 sm:space-y-2">
          <label htmlFor="lastName" className="text-xs sm:text-sm font-medium text-zinc-300">
            Last Name *
          </label>
          <Input id="lastName" name="lastName" placeholder="Doe" required />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <div className="space-y-1.5 sm:space-y-2">
          <label htmlFor="email" className="text-xs sm:text-sm font-medium text-zinc-300">
            Email Address *
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="john@example.com"
            required
          />
        </div>
        <div className="space-y-1.5 sm:space-y-2">
          <label htmlFor="phone" className="text-xs sm:text-sm font-medium text-zinc-300">
            Phone Number
          </label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            placeholder="+234 800 000 0000"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <div className="space-y-1.5 sm:space-y-2">
          <label htmlFor="city" className="text-xs sm:text-sm font-medium text-zinc-300">
            City *
          </label>
          <Input id="city" name="city" placeholder="Accra" required />
        </div>
        <div className="space-y-1.5 sm:space-y-2">
          <label htmlFor="country" className="text-xs sm:text-sm font-medium text-zinc-300">
            Country *
          </label>
          <Input id="country" name="country" placeholder="Ghana" required />
        </div>
      </div>

      <div className="space-y-1.5 sm:space-y-2">
        <label htmlFor="occupation" className="text-xs sm:text-sm font-medium text-zinc-300">
          Occupation / Profession
        </label>
        <Input
          id="occupation"
          name="occupation"
          placeholder="Software Engineer, Pastor, Entrepreneur, etc."
        />
      </div>

      <div className="space-y-1.5 sm:space-y-2">
        <label htmlFor="reason" className="text-xs sm:text-sm font-medium text-zinc-300">
          Why do you want to join? (Optional)
        </label>
        <Textarea
          id="reason"
          name="reason"
          placeholder="Tell us a little about yourself and what drew you to The Integrity Man Network..."
          rows={4}
        />
      </div>

      <div className="flex items-start gap-2 sm:gap-3">
        <input
          type="checkbox"
          id="agree"
          required
          className="mt-1 w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-orange-500 focus:ring-orange-500"
        />
        <label htmlFor="agree" className="text-xs sm:text-sm text-zinc-400">
          I agree to be contacted by The Integrity Man Network and understand
          that my information will be handled with confidentiality.
        </label>
      </div>

      <Button
        type="submit"
        size="lg"
        className="w-full sm:w-auto"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
            Submitting...
          </>
        ) : (
          <>
            Join The Network
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </Button>
    </form>
  );
}

// 
// PAGE
// 

export default function JoinPage() {
  return (
    <>
      <JoinHero />
      <div className="divider-gradient" />

      {/* Explainer Videos Section */}
      <section className="section-padding">
        <div className="container-wide">
          <motion.div {...fadeInUp}>
            <SectionHeading
              label="Watch & Learn"
              title="About The Network"
              description="Watch these short videos to understand what we're about and how you can be part of it."
            />
          </motion.div>

          <motion.div {...fadeInUp} className="mt-8 sm:mt-12 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            <VideoCard
              src="/videos/join-explainer-2.mp4"
              poster="/images/join-thumb-2.jpg"
              title="Our Community"
              description="Discover what makes TIMN different  a real covenant brotherhood."
            />
            <VideoCard
              src="/videos/join-explainer-3.mp4"
              poster="/images/join-thumb-3.jpg"
              title="Your Journey"
              description="See how men are being transformed through purpose-driven formation."
            />
            <VideoCard
              src="/videos/join-explainer-1.mp4"
              poster="/images/join-thumb-4.jpg"
              title="Get Started"
              description="A step-by-step guide to joining The Integrity Man Network."
            />
          </motion.div>
        </div>
      </section>

      <div className="divider-gradient" />
      <BenefitsSection />
      <div className="divider-gradient" />

      {/* Registration Form */}
      <section className="section-padding relative bg-zinc-900/30">
        <div className="absolute inset-0 bg-radial-dark pointer-events-none" />
        <div className="container-wide relative z-10">
          <motion.div {...fadeInUp}>
            <SectionHeading
              label="Register"
              title="Join Today"
              description="Fill out the form below to become a member of The Integrity Man Network."
            />
          </motion.div>

          <motion.div {...fadeInUp} className="mt-8 sm:mt-12 max-w-3xl mx-auto">
            <Card className="bg-zinc-900/50">
              <CardContent className="p-4 sm:p-6 md:p-10">
                <RegistrationForm />
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>
    </>
  );
}
