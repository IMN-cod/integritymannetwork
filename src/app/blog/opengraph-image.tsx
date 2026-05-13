import { buildOgImage } from "@/lib/og-image";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return buildOgImage({
    category: "Articles & Devotionals",
    title: "Blog",
    description:
      "Insightful articles, devotionals, and teachings on purpose, integrity, leadership, and faith from The Integrity Man Network.",
  });
}
