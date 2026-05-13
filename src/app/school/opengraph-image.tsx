export { runtime, size, contentType } from "@/lib/og-image";
import { buildOgImage } from "@/lib/og-image";

export default function OgImage() {
  return buildOgImage({
    category: "Education",
    title: "School of Integrity",
    description:
      "Form men from the inside out through structured character development, doctrinal grounding, and purpose alignment.",
  });
}
