"use client";

import Link from "next/link";
import { cn } from "@/lib/cn";
import { NAV_LINKS } from "./header";

type MobileMenuProps = {
  open: boolean;
  onClose: () => void;
};

export function MobileMenu({ open, onClose }: MobileMenuProps) {
  return (
    <nav
      aria-label="Menú móvil"
      aria-hidden={!open}
      inert={!open}
      className={cn(
        "fixed inset-0 z-[98] bg-black flex flex-col justify-center gap-2 px-[clamp(16px,4vw,64px)] transition-[clip-path] duration-500 ease-gc",
        open ? "[clip-path:inset(0_0_0_0)]" : "[clip-path:inset(0_0_100%_0)] pointer-events-none",
      )}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar menú"
        className="absolute top-6 right-6 w-11 h-11 grid place-items-center text-white text-2xl"
      >
        ✕
      </button>
      {NAV_LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          onClick={onClose}
          className="font-display uppercase text-[13vw] leading-[1.05] text-white hover:text-yellow"
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
