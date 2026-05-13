import type { NextConfig } from "next";

// Optional analytics origin (Plausible self-hosted or hosted).
const PLAUSIBLE_SRC = process.env.NEXT_PUBLIC_PLAUSIBLE_SRC || "";
let plausibleOrigin = "";
try {
  if (PLAUSIBLE_SRC) plausibleOrigin = new URL(PLAUSIBLE_SRC).origin;
} catch {
  plausibleOrigin = "";
}

// ─────────────────────────────────────────────────────────────────────
// Content Security Policy
//
// Notes:
// - `unsafe-inline` for script-src is required because Next.js injects
//   small inline boot scripts. Migrating to nonces requires every page
//   to be dynamically rendered, which would defeat ISR caching.
// - `unsafe-eval` is included because framer-motion uses Function() at
//   runtime in some paths. Removing it crashes animated routes.
// - Payment provider origins are explicitly allow-listed.
// ─────────────────────────────────────────────────────────────────────
const csp = [
  `default-src 'self'`,
  `base-uri 'self'`,
  `object-src 'none'`,
  `form-action 'self' https://checkout.paystack.com https://js.stripe.com https://www.paypal.com`,
  `frame-ancestors 'none'`,
  `frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://checkout.paystack.com https://standard.paystack.co https://www.paypal.com https://www.sandbox.paypal.com`,
  `img-src 'self' data: blob: https://res.cloudinary.com https://lh3.googleusercontent.com https://images.unsplash.com https://*.paystack.co https://*.paypal.com`,
  `media-src 'self' https://res.cloudinary.com`,
  `font-src 'self' data: https://fonts.gstatic.com`,
  `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
  `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.paystack.co https://js.stripe.com https://www.paypal.com https://www.sandbox.paypal.com${plausibleOrigin ? " " + plausibleOrigin : ""}`,
  `connect-src 'self' https://api.paystack.co https://api.stripe.com https://api-m.paypal.com https://api-m.sandbox.paypal.com${plausibleOrigin ? " " + plausibleOrigin : ""}`,
  `worker-src 'self' blob:`,
  `manifest-src 'self'`,
  `upgrade-insecure-requests`,
].join("; ");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-XSS-Protection", value: "1; mode=block" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  { key: "Content-Security-Policy", value: csp },
];

const nextConfig: NextConfig = {
  // ── Output mode (standalone for Render / Docker) ──
  output: "standalone",

  // ── Compiler optimizations ──
  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error", "warn"] } : false,
  },

  // ── Performance flags ──
  reactStrictMode: true,
  poweredByHeader: false, // Remove X-Powered-By header

  // ── Image optimization ──
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 365, // 1 year cache
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },

  // ── Experimental performance features ──
  experimental: {
    optimizeCss: true,          // CSS optimization via critters
    optimizePackageImports: [   // Tree-shake heavy packages
      "lucide-react",
      "framer-motion",
      "date-fns",
      "zod",
    ],
  },

  // ── Caching & security headers ──
  async headers() {
    return [
      // Security headers for all routes
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      // Immutable cache for static assets
      {
        source: "/videos/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
          { key: "Content-Disposition", value: "inline" },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
      {
        source: "/images/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
          { key: "Content-Disposition", value: "inline" },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
      // User uploads — cache with revalidation
      {
        source: "/uploads/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=2592000, stale-while-revalidate=86400" },
          { key: "Content-Disposition", value: "inline" },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
      // Cache fonts aggressively
      {
        source: "/fonts/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      // Cache Next.js static assets
      {
        source: "/_next/static/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      // API routes — no cache by default
      {
        source: "/api/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store, max-age=0" },
        ],
      },
    ];
  },
};

export default nextConfig;
