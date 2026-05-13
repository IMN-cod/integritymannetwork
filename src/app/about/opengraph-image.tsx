import { buildOgImage } from "@/lib/og-image";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return buildOgImage({
    category: "Our Story",
    title: "About Us",
    description:
      "A global, non-denominational community of men committed to restoring righteousness through purpose-driven work and God-aligned living.",
  });
}
