import type { ReactNode } from "react";
import { SiteChrome } from "@/components/site/site-chrome";

export default function SiteLayout({ children }: { children: ReactNode }) {
  return <SiteChrome>{children}</SiteChrome>;
}
