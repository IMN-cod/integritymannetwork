import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { LayoutShell } from "@/components/layout/LayoutShell";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
  preload: true,
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  preload: true,
});

// ── Viewport configuration ──
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#09090b",
};

export const metadata: Metadata = {
  title: {
    default: "The Integrity Man Network — God. Work. Integrity.",
    template: "%s | Integrity Man Network",
  },
  description:
    "A global, non-denominational community of men committed to achieving true success by living lives of Integrity while working to advance the eternal purpose of God.",
  keywords: [
    "Integrity",
    "Men",
    "Purpose",
    "God",
    "Work",
    "Kingdom",
    "Leadership",
    "Christian men",
    "Faith and work",
    "Men of integrity",
  ],
  authors: [{ name: "The Integrity Man Network" }],
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://integrityman.network"),
  openGraph: {
    title: "The Integrity Man Network",
    description:
      "Men everywhere cheerfully working for God. Seek first the Kingdom of God and His righteousness.",
    type: "website",
    locale: "en_US",
    siteName: "The Integrity Man Network",
    images: [
      {
        url: "/images/Integrity Man Official Logo.png",
        width: 512,
        height: 512,
        alt: "Integrity Man Network Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "The Integrity Man Network",
    description:
      "Men everywhere cheerfully working for God. Seek first the Kingdom of God and His righteousness.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <head>
        {/* DNS prefetch & preconnect for external resources */}
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen bg-zinc-950 text-zinc-50 antialiased">
        <SessionProvider>
          <LayoutShell>{children}</LayoutShell>
        </SessionProvider>
      </body>
    </html>
  );
}
