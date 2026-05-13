export { runtime, size, contentType } from "@/lib/og-image";
import { buildOgImage } from "@/lib/og-image";

export default function OgImage() {
  return buildOgImage({
    category: "Get In Touch",
    title: "Contact Us",
    description:
      "Reach out for partnership, event inquiries, or to learn more about the mission of The Integrity Man Network.",
  });
}
