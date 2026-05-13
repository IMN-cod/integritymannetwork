import { buildOgImage } from "@/lib/og-image";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return buildOgImage({
    category: "Shop",
    title: "Store",
    description:
      "Official merchandise, books, apparel, and resources from The Integrity Man Network. Purpose-branded for men of integrity.",
  });
}
