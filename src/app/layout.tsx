import type { Metadata } from "next";
import { anton, barlow, barlowCondensed } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Guerra Campal",
  description: "Promotora de MMA Guerra Campal (Chile).",
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
