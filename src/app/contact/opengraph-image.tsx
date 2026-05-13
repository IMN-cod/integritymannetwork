import { buildOgImage } from "@/lib/og-image";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return buildOgImage({
    category: "Get In Touch",
    title: "Contact Us",
    description:
      "Reach out for partnership, event inquiries, or to learn more about the mission of The Integrity Man Network.",
  });
}
