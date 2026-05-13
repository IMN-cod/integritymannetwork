export { runtime, size, contentType } from "@/lib/og-image";
import { buildOgImage } from "@/lib/og-image";

export default function OgImage() {
  return buildOgImage({
    category: "Membership",
    title: "Join The Network",
    description:
      "Become a member of a global community of men committed to purpose, integrity, and God-aligned work. Your assignment awaits.",
  });
}
