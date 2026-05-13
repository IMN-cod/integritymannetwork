export { runtime, size, contentType } from "@/lib/og-image";
import { buildOgImage } from "@/lib/og-image";

export default function OgImage() {
  return buildOgImage({
    category: "The Integrity Man Network",
    title: "God. Work. Integrity.",
    description:
      "A global community of men committed to achieving true success by living lives of integrity for the eternal purpose of God.",
  });
}
