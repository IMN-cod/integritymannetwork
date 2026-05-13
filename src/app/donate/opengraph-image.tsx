import { buildOgImage } from "@/lib/og-image";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return buildOgImage({
    category: "Give",
    title: "Support Our Mission",
    description:
      "Fund schools, outreach programs, and men's formation initiatives around the world. Every gift advances the kingdom.",
  });
}
