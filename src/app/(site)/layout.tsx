import type { ReactNode } from "react";
import { SmoothScroll } from "@/components/motion/smooth-scroll";
import { Footer } from "@/components/site/footer";
import { Header } from "@/components/site/header";

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <SmoothScroll>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </SmoothScroll>
  );
}
