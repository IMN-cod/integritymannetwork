import { buildOgImage } from "@/lib/og-image";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return buildOgImage({
    category: "Connect",
    title: "Community",
    description:
      "Connect, share, and grow with men of integrity from around the world. You are not alone on this journey.",
  });
}
