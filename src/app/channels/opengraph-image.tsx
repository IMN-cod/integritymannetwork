export { runtime, size, contentType } from "@/lib/og-image";
import { buildOgImage } from "@/lib/og-image";

export default function OgImage() {
  return buildOgImage({
    category: "How We Work",
    title: "Our Channels",
    description:
      "Schools, Outreach, Networking, and Support & Charity — the four strategic channels through which the network advances its mission.",
  });
}
