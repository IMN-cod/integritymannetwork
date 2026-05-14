"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { DonateBanner } from "@/components/layout/DonateBanner";
import { CartDrawer } from "@/components/cart/CartDrawer";
import LiveChatWidget from "@/components/chat/LiveChatWidget";

const NO_DONATE_BANNER = ["/auth", "/admin", "/checkout", "/dashboard", "/donate", "/community"];
const NO_FOOTER = ["/auth", "/admin", "/community"];

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith("/admin");
  const showDonateBanner = !NO_DONATE_BANNER.some((p) => pathname.startsWith(p));
  const showFooter = !NO_FOOTER.some((p) => pathname.startsWith(p));

  if (isAdminRoute) {
    // Admin pages get NO header, footer, or cart — completely separate system
    return <>{children}</>;
  }

  return (
    <>
      <Header />
      <main className="relative">{children}</main>
      {showDonateBanner && <DonateBanner />}
      {showFooter && <Footer />}
      <CartDrawer />
      <LiveChatWidget />
    </>
  );
}
