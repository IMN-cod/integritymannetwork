"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/cart/CartDrawer";

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith("/admin");

  if (isAdminRoute) {
    // Admin pages get NO header, footer, or cart — completely separate system
    return <>{children}</>;
  }

  return (
    <>
      <Header />
      <main className="relative">{children}</main>
      <Footer />
      <CartDrawer />
    </>
  );
}
