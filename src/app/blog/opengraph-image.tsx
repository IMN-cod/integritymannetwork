export { runtime, size, contentType } from "@/lib/og-image";
import { buildOgImage } from "@/lib/og-image";

export default function OgImage() {
  return buildOgImage({
    category: "Articles & Devotionals",
    title: "Blog",
    description:
      "Insightful articles, devotionals, and teachings on purpose, integrity, leadership, and faith from The Integrity Man Network.",
  });
}
