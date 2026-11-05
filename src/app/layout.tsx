import { BRAND } from "@/domain/brand";
import type { Metadata } from "next";
import { anton, barlow, barlowCondensed } from "./fonts";
import "./globals.css";
import "./ofl-public.css";
import "./ofl-admin.css";
import "./ofl-motion.css";
import "./mainevent-poster.css";

export const metadata: Metadata = {
  title: BRAND.name,
  description: BRAND.description,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es-CL"
      className={`${anton.variable} ${barlowCondensed.variable} ${barlow.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
