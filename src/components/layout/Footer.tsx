import Link from "next/link";
import Image from "next/image";
import {
  Mail,
  Phone,
  MapPin,
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  ArrowUpRight,
} from "lucide-react";
import { SITE, NAV_LINKS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const FOOTER_LINKS = {
  ministry: [
    { label: "About Us", href: "/about" },
    { label: "Our Channels", href: "/channels" },
    { label: "Events", href: "/events" },
    { label: "Blog & Resources", href: "/blog" },
    { label: "Contact Us", href: "/contact" },
  ],
  community: [
    { label: "Join The Network", href: "/join" },
    { label: "Networking", href: "/community/houses" },
    { label: "Community Chat", href: "/community/chat" },
    { label: "Partner With Us", href: "/join" },
    { label: "Donate", href: "/donate" },
  ],
  channels: [
    { label: "School of Integrity", href: "/school" },
    { label: "Purpose Centers", href: "/channels#schools" },
    { label: "Campus Campaign", href: "/channels#outreach" },
    { label: "Corporate Outreach", href: "/channels#outreach" },
    { label: "Support & Charity", href: "/channels#foundation" },
  ],
};

const SOCIALS = [
  { icon: Facebook, href: "#", label: "Facebook" },
  { icon: Instagram, href: "#", label: "Instagram" },
  { icon: Twitter, href: "#", label: "Twitter" },
  { icon: Youtube, href: "#", label: "YouTube" },
];

export function Footer() {
  return (
    <footer className="relative border-t border-zinc-800/50 bg-zinc-950">
      {/* Ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px bg-linear-to-r from-transparent via-orange-500/30 to-transparent" />

      <div className="container-wide">
        {/* Newsletter Section */}
        <div className="py-10 sm:py-16 border-b border-zinc-800/50">
          <div className="max-w-2xl mx-auto text-center">
            <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2 sm:mb-3 font-display">
              Stay Connected
            </h3>
            <p className="text-sm sm:text-base text-zinc-400 mb-6 sm:mb-8">
              Join our mailing list for updates on events, resources, and the
              movement of men walking in integrity.
            </p>
            <form className="flex flex-col sm:flex-row gap-2 sm:gap-3 max-w-md mx-auto">
              <Input
                type="email"
                placeholder="Enter your email"
                className="flex-1"
              />
              <Button type="submit" className="w-full sm:w-auto">
                Subscribe
                <ArrowUpRight className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </div>

        {/* Links Grid */}
        <div className="py-10 sm:py-16 grid grid-cols-2 md:grid-cols-4 gap-8 sm:gap-10 lg:gap-16">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <Image
                src="/images/Integrity Man Official Logo.png"
                alt="Integrity Man Network"
                width={44}
                height={44}
                className="w-9 h-9 sm:w-11 sm:h-11 object-contain"
              />
              <div className="flex flex-col">
                <span className="text-sm sm:text-base font-bold tracking-tight text-white leading-none">
                  Integrity Man
                </span>
                <span className="text-[8px] sm:text-[9px] font-semibold tracking-[0.2em] uppercase text-orange-500/80 leading-none mt-1">
                  Network
                </span>
              </div>
            </Link>
            <p className="text-xs sm:text-sm text-zinc-500 leading-relaxed mb-4 sm:mb-6">
              {SITE.description.substring(0, 140)}...
            </p>
            <div className="flex items-center gap-2 sm:gap-3">
              {SOCIALS.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-orange-500 hover:border-orange-500/30 transition-all duration-200"
                  aria-label={label}
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Ministry */}
          <div>
            <h4 className="text-[10px] sm:text-xs font-semibold tracking-[0.15em] uppercase text-zinc-500 mb-3 sm:mb-5">
              Ministry
            </h4>
            <ul className="space-y-2.5 sm:space-y-3">
              {FOOTER_LINKS.ministry.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-xs sm:text-sm text-zinc-400 hover:text-orange-500 transition-colors duration-200">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Community */}
          <div>
            <h4 className="text-[10px] sm:text-xs font-semibold tracking-[0.15em] uppercase text-zinc-500 mb-3 sm:mb-5">
              Community
            </h4>
            <ul className="space-y-2.5 sm:space-y-3">
              {FOOTER_LINKS.community.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-xs sm:text-sm text-zinc-400 hover:text-orange-500 transition-colors duration-200">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Channels */}
          <div>
            <h4 className="text-[10px] sm:text-xs font-semibold tracking-[0.15em] uppercase text-zinc-500 mb-3 sm:mb-5">
              Channels
            </h4>
            <ul className="space-y-2.5 sm:space-y-3">
              {FOOTER_LINKS.channels.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-xs sm:text-sm text-zinc-400 hover:text-orange-500 transition-colors duration-200">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="py-4 sm:py-6 border-t border-zinc-800/50 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          <p className="text-[10px] sm:text-xs text-zinc-600">
            &copy; {new Date().getFullYear()} {SITE.name}. All rights reserved.
          </p>
          <div className="flex items-center gap-4 sm:gap-6">
            <Link
              href="/privacy"
              className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
            >
              Terms of Service
            </Link>
            <Link
              href="/admin"
              className="text-xs text-zinc-700 hover:text-zinc-500 transition-colors"
            >
              Admin
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
