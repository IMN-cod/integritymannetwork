import { buildOgImage } from "@/lib/og-image";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return buildOgImage({
    category: "Education",
    title: "School of Integrity",
    description:
      "Form men from the inside out through structured character development, doctrinal grounding, and purpose alignment.",
  });
}
