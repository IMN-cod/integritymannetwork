import { buildOgImage } from "@/lib/og-image";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return buildOgImage({
    category: "Membership",
    title: "Join The Network",
    description:
      "Become a member of a global community of men committed to purpose, integrity, and God-aligned work. Your assignment awaits.",
  });
}
