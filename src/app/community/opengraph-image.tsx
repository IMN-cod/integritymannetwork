export { runtime, size, contentType } from "@/lib/og-image";
import { buildOgImage } from "@/lib/og-image";

export default function OgImage() {
  return buildOgImage({
    category: "Connect",
    title: "Community",
    description:
      "Connect, share, and grow with men of integrity from around the world. You are not alone on this journey.",
  });
}
