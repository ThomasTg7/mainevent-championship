"use client";

import type { ReactNode } from "react";
import { SmoothScroll } from "@/components/motion/smooth-scroll";
import { Header } from "./header";
import { Footer } from "./footer";

export function SiteChrome({ children }: { children: ReactNode }) {
  return (
    <SmoothScroll>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </SmoothScroll>
  );
}
