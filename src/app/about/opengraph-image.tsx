export { runtime, size, contentType } from "@/lib/og-image";
import { buildOgImage } from "@/lib/og-image";

export default function OgImage() {
  return buildOgImage({
    category: "Our Story",
    title: "About Us",
    description:
      "A global, non-denominational community of men committed to restoring righteousness through purpose-driven work and God-aligned living.",
  });
}
