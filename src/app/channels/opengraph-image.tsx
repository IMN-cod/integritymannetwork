import { buildOgImage } from "@/lib/og-image";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return buildOgImage({
    category: "How We Work",
    title: "Our Channels",
    description:
      "Schools, Outreach, Networking, and Support & Charity — the four strategic channels through which the network advances its mission.",
  });
}
