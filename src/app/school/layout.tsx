import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "School of Integrity — The Integrity Man Network",
  description:
    "The School of Integrity exists to form men from the inside out through structured character development, doctrinal grounding, and purpose alignment. Explore our courses and enroll today.",
};

export default function SchoolLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
