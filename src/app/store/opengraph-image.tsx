export { runtime, size, contentType } from "@/lib/og-image";
import { buildOgImage } from "@/lib/og-image";

export default function OgImage() {
  return buildOgImage({
    category: "Shop",
    title: "Store",
    description:
      "Official merchandise, books, apparel, and resources from The Integrity Man Network. Purpose-branded for men of integrity.",
  });
}
