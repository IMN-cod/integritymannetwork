export { runtime, size, contentType } from "@/lib/og-image";
import { buildOgImage } from "@/lib/og-image";

export default function OgImage() {
  return buildOgImage({
    category: "Give",
    title: "Support Our Mission",
    description:
      "Fund schools, outreach programs, and men's formation initiatives around the world. Every gift advances the kingdom.",
  });
}
