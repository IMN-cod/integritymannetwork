export { runtime, size, contentType } from "@/lib/og-image";
import { buildOgImage } from "@/lib/og-image";

export default function OgImage() {
  return buildOgImage({
    category: "Events",
    title: "Events & Gatherings",
    description:
      "The Integrity Summit, Men's Retreat, and Corporate Gatherings. Come together in purpose and fellowship.",
  });
}
