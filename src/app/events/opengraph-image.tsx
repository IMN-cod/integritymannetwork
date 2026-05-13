import { buildOgImage } from "@/lib/og-image";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return buildOgImage({
    category: "Events",
    title: "Events & Gatherings",
    description:
      "The Integrity Summit, Men's Retreat, and Corporate Gatherings. Come together in purpose and fellowship.",
  });
}
