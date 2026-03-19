"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ProtectedImage } from "@/components/ui/video-player";
import {
  Mail,
  MapPin,
  Phone,
  Send,
  MessageSquare,
  ChevronDown,
  Instagram,
  Youtube,
  ArrowRight,
  Sparkles,
  Clock,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SectionHeading } from "@/components/ui/section-heading";

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
};

const staggerContainer = {
  initial: {},
  whileInView: { transition: { staggerChildren: 0.1 } },
  viewport: { once: true, margin: "-80px" },
};

const staggerItem = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

// ─────────────────────────────────────────────────
// HERO
// ─────────────────────────────────────────────────

function ContactHero() {
  return (
    <section className="relative hero-padding overflow-hidden">
      <div className="absolute inset-0 bg-zinc-950" />
      <div className="absolute inset-0">
        <ProtectedImage
          src="/images/community-1.jpg"
          alt="Integrity Man Community"
          fill
          className="object-cover opacity-20"
          priority
        />
        <div className="absolute inset-0 bg-linear-to-b from-zinc-950/40 via-zinc-950/70 to-zinc-950" />
      </div>
      {/* Decorative glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-150 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-grid opacity-30" />

      <div className="container-wide relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 mb-5 sm:mb-8">
            <MessageSquare className="w-3.5 h-3.5 text-orange-500" />
            <span className="text-[10px] sm:text-xs font-semibold tracking-wider uppercase text-orange-500">
              Get In Touch
            </span>
          </div>

          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold tracking-tight text-white leading-[0.95] mb-4 sm:mb-6">
            Let&apos;s{" "}
            <span className="text-gradient">Connect</span>
          </h1>

          <p className="text-sm sm:text-lg md:text-xl text-zinc-400 leading-relaxed max-w-2xl mx-auto mb-8 sm:mb-10">
            Have questions about The Integrity Man Network? Want to partner
            with us, attend an event, or simply connect? We&apos;d love to hear
            from you.
          </p>

          {/* Quick stats */}
          <div className="flex flex-wrap justify-center gap-6 sm:gap-10">
            {[
              { icon: Clock, label: "24-48hr Response" },
              { icon: Globe, label: "Global Community" },
              { icon: Sparkles, label: "Always Open" },
            ].map((stat) => (
              <div key={stat.label} className="flex items-center gap-2 text-zinc-500">
                <stat.icon className="w-4 h-4 text-orange-500/70" />
                <span className="text-xs sm:text-sm font-medium">{stat.label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────
// CONTACT FORM
// ─────────────────────────────────────────────────

function ContactForm() {
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
        className="text-center py-16 sm:py-20"
      >
        <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center mx-auto mb-6">
          <Send className="w-8 h-8 text-orange-500" />
        </div>
        <h3 className="text-2xl sm:text-3xl font-bold text-white font-display mb-3">
          Message Sent!
        </h3>
        <p className="text-zinc-400 max-w-sm mx-auto mb-8">
          Thank you for reaching out. We&apos;ll get back to you within 24-48 hours.
        </p>
        <Button
          variant="outline"
          onClick={() => setSubmitted(false)}
        >
          Send Another Message
        </Button>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
        <div className="space-y-2">
          <label htmlFor="firstName" className="text-xs sm:text-sm font-medium text-zinc-300">
            First Name
          </label>
          <Input id="firstName" name="firstName" placeholder="John" required />
        </div>
        <div className="space-y-2">
          <label htmlFor="lastName" className="text-xs sm:text-sm font-medium text-zinc-300">
            Last Name
          </label>
          <Input id="lastName" name="lastName" placeholder="Doe" required />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="email" className="text-xs sm:text-sm font-medium text-zinc-300">
          Email Address
        </label>
        <Input id="email" name="email" type="email" placeholder="john@example.com" required />
      </div>

      <div className="space-y-2">
        <label htmlFor="subject" className="text-xs sm:text-sm font-medium text-zinc-300">
          Subject
        </label>
        <Input id="subject" name="subject" placeholder="How can we help?" required />
      </div>

      <div className="space-y-2">
        <label htmlFor="message" className="text-xs sm:text-sm font-medium text-zinc-300">
          Your Message
        </label>
        <Textarea id="message" name="message" placeholder="Tell us what's on your mind..." rows={6} required />
      </div>

      <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
            Sending...
          </>
        ) : (
          <>
            Send Message
            <Send className="w-4 h-4" />
          </>
        )}
      </Button>
    </form>
  );
}

// ─────────────────────────────────────────────────
// CONTACT INFO SIDE PANEL
// ─────────────────────────────────────────────────

const contactDetails = [
  {
    icon: Mail,
    title: "Email Us",
    value: "contact@theintegrityman.com",
    href: "mailto:contact@theintegrityman.com",
    color: "from-orange-500 to-amber-500",
  },
  {
    icon: Phone,
    title: "Call Us",
    value: "+234 800 000 0000",
    href: "tel:+2348000000000",
    color: "from-orange-500 to-red-500",
  },
  {
    icon: MapPin,
    title: "Visit Us",
    value: "Accra, Ghana",
    href: null,
    color: "from-orange-500 to-yellow-500",
  },
];

const socialLinks = [
  { icon: Instagram, label: "Instagram", href: "#" },
  { icon: Youtube, label: "YouTube", href: "#" },
];

function ContactSidebar() {
  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Contact cards */}
      <motion.div variants={staggerContainer} initial="initial" whileInView="whileInView" viewport={{ once: true }} className="space-y-4">
        {contactDetails.map((detail) => (
          <motion.div
            key={detail.title}
            variants={staggerItem}
            className="group relative rounded-xl border border-zinc-800/80 bg-zinc-900/60 backdrop-blur-sm p-4 sm:p-5 hover:border-orange-500/30 transition-all duration-300"
          >
            {/* Subtle gradient glow on hover */}
            <div className="absolute inset-0 rounded-xl bg-linear-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative flex items-center gap-4">
              <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-linear-to-br ${detail.color} p-px shrink-0`}>
                <div className="w-full h-full rounded-xl bg-zinc-950 flex items-center justify-center">
                  <detail.icon className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />
                </div>
              </div>
              <div>
                <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">
                  {detail.title}
                </h3>
                {detail.href ? (
                  <a
                    href={detail.href}
                    className="text-sm sm:text-base text-white hover:text-orange-500 transition-colors font-medium"
                  >
                    {detail.value}
                  </a>
                ) : (
                  <p className="text-sm sm:text-base text-white font-medium">{detail.value}</p>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Social links */}
      <motion.div
        {...fadeInUp}
        className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 backdrop-blur-sm p-4 sm:p-5"
      >
        <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">
          Follow Us
        </h3>
        <div className="flex gap-3">
          {socialLinks.map((social) => (
            <a
              key={social.label}
              href={social.href}
              aria-label={social.label}
              className="w-11 h-11 rounded-xl bg-zinc-800/80 border border-zinc-700/50 flex items-center justify-center text-zinc-400 hover:text-orange-500 hover:bg-orange-500/10 hover:border-orange-500/30 transition-all duration-300"
            >
              <social.icon className="w-5 h-5" />
            </a>
          ))}
        </div>
      </motion.div>

      {/* Decorative image panel */}
      <motion.div {...fadeInUp} className="hidden lg:block">
        <div className="relative aspect-4/3 rounded-xl overflow-hidden border border-zinc-800/50 group">
          <ProtectedImage
            src="/images/community-2.jpg"
            alt="Our Community"
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-linear-to-t from-zinc-950/80 via-zinc-950/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-5">
            <p className="text-white text-sm font-bold font-display">We&apos;d love to connect with you</p>
            <p className="text-zinc-400 text-xs mt-1">Join a community of men living with purpose</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─────────────────────────────────────────────────
// FAQ SECTION
// ─────────────────────────────────────────────────

const faqs = [
  {
    question: "Who can join The Integrity Man Network?",
    answer:
      "The network is open to every man who desires purposeful living, character growth, and alignment with God's eternal purpose. Whether you are a student, professional, leader, or simply seeking direction, there is a place for you.",
  },
  {
    question: "Is this a denomination or a church?",
    answer:
      "No. The Integrity Man Network is not a church or denomination. It is a faith-based community and movement focused on men's formation, leadership, and purposeful living. Members are encouraged to remain rooted in their local churches.",
  },
  {
    question: "How do I attend an event?",
    answer:
      "You can register for upcoming events through our Events page. We also send notifications to our members via email and social media. Join the network to stay updated.",
  },
  {
    question: "Can I partner or donate?",
    answer:
      "Yes! We welcome partnerships and donations. Visit our Donate page or contact us directly to discuss partnership opportunities and how you can support the vision.",
  },
  {
    question: "Where is The Integrity Man Network located?",
    answer:
      "We are currently based in Accra, Ghana, but our vision is global. Through our online platforms, events, and expanding chapters, we are reaching men across nations.",
  },
];

function FAQItem({
  faq,
  index,
  isOpen,
  onToggle,
}: {
  faq: (typeof faqs)[number];
  index: number;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <motion.div
      variants={staggerItem}
      className={`border border-zinc-800/60 rounded-xl overflow-hidden transition-all duration-300 ${
        isOpen ? "bg-zinc-800/30 border-orange-500/20" : "bg-zinc-900/40 hover:bg-zinc-800/20"
      }`}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 p-4 sm:p-5 text-left group"
      >
        <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
          isOpen ? "bg-orange-500/20 text-orange-500" : "bg-zinc-800 text-zinc-500"
        }`}>
          {String(index + 1).padStart(2, "0")}
        </span>
        <span className={`text-sm sm:text-base font-medium flex-1 transition-colors ${
          isOpen ? "text-white" : "text-zinc-300 group-hover:text-white"
        }`}>
          {faq.question}
        </span>
        <ChevronDown
          className={`w-4 h-4 shrink-0 transition-all duration-300 ${
            isOpen ? "rotate-180 text-orange-500" : "text-zinc-600"
          }`}
        />
      </button>
      <motion.div
        initial={false}
        animate={{ height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="overflow-hidden"
      >
        <p className="px-4 sm:px-5 pb-4 sm:pb-5 pl-16 sm:pl-18 text-sm text-zinc-400 leading-relaxed">
          {faq.answer}
        </p>
      </motion.div>
    </motion.div>
  );
}

function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="section-padding relative">
      <div className="absolute inset-0 bg-zinc-950" />
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-125 h-75 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="container-wide relative z-10">
        <motion.div {...fadeInUp}>
          <SectionHeading
            label="FAQ"
            title="Frequently Asked Questions"
            description="Quick answers to common questions about The Integrity Man Network."
          />
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="initial"
          whileInView="whileInView"
          viewport={{ once: true }}
          className="mt-8 sm:mt-12 max-w-3xl mx-auto space-y-3"
        >
          {faqs.map((faq, index) => (
            <FAQItem
              key={index}
              faq={faq}
              index={index}
              isOpen={openIndex === index}
              onToggle={() => setOpenIndex(openIndex === index ? null : index)}
            />
          ))}
        </motion.div>

        {/* CTA after FAQ */}
        <motion.div {...fadeInUp} className="mt-12 sm:mt-16 text-center">
          <p className="text-zinc-500 text-sm mb-4">Still have questions?</p>
          <Button variant="outline" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            Send Us a Message <ArrowRight className="w-4 h-4" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────

export default function ContactPage() {
  return (
    <>
      <ContactHero />
      <div className="divider-gradient" />

      {/* Contact Form + Info Grid */}
      <section className="section-padding relative">
        <div className="absolute inset-0 bg-zinc-950" />
        {/* Subtle ambient glow */}
        <div className="absolute top-20 right-0 w-100 h-100 bg-orange-500/3 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-20 left-0 w-75 h-75 bg-orange-500/3 rounded-full blur-3xl pointer-events-none" />

        <div className="container-wide relative z-10">
          <motion.div {...fadeInUp}>
            <SectionHeading
              label="Reach Out"
              title="Send Us a Message"
              description="Fill out the form below and our team will respond within 24–48 hours."
            />
          </motion.div>

          <div className="mt-8 sm:mt-12 grid grid-cols-1 lg:grid-cols-5 gap-8 sm:gap-10">
            {/* Form — takes 3/5 */}
            <motion.div {...fadeInUp} className="lg:col-span-3">
              <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-sm p-5 sm:p-8 md:p-10">
                <div className="flex items-center gap-3 mb-6 sm:mb-8">
                  <div className="w-10 h-10 rounded-xl bg-linear-to-br from-orange-500 to-amber-500 p-px">
                    <div className="w-full h-full rounded-xl bg-zinc-950 flex items-center justify-center">
                      <Send className="w-4 h-4 text-orange-500" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-white font-display">Write to Us</h3>
                    <p className="text-xs text-zinc-500">We read every message</p>
                  </div>
                </div>
                <ContactForm />
              </div>
            </motion.div>

            {/* Sidebar — takes 2/5 */}
            <div className="lg:col-span-2">
              <ContactSidebar />
            </div>
          </div>
        </div>
      </section>

      <div className="divider-gradient" />
      <FAQSection />
    </>
  );
}
