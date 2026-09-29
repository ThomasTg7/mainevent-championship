"use client";

import Link from "next/link";
import { useEffect, useRef, type KeyboardEvent } from "react";
import { useLenis } from "@/components/motion/smooth-scroll";
import { cn } from "@/lib/cn";
import { NAV_LINKS } from "./nav-links";

type MobileMenuProps = {
  open: boolean;
  onClose: () => void;
};

export function MobileMenu({ open, onClose }: MobileMenuProps) {
  const navRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const lenis = useLenis();

  useEffect(() => {
    if (!open) {
      return;
    }
    closeButtonRef.current?.focus();
    lenis?.stop();
    const root = document.documentElement;
    const previousOverflow = root.style.overflow;
    root.style.overflow = "hidden";

    function onEscape(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    document.addEventListener("keydown", onEscape);

    return () => {
      document.removeEventListener("keydown", onEscape);
      root.style.overflow = previousOverflow;
      lenis?.start();
    };
  }, [open, onClose, lenis]);

  // Mantiene el foco dentro del menú mientras está abierto.
  function trapFocus(event: KeyboardEvent<HTMLElement>) {
    if (event.key !== "Tab" || !navRef.current) {
      return;
    }
    const focusable = navRef.current.querySelectorAll<HTMLElement>("a[href], button");
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <nav
      ref={navRef}
      id="mobile-menu"
      aria-label="Menú móvil"
      hidden={!open}
      onKeyDown={trapFocus}
      className={cn(
        "fixed inset-0 z-[110] bg-black flex flex-col justify-center gap-2 px-[clamp(16px,4vw,64px)]",
        "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-4 duration-300",
      )}
    >
      <button
        ref={closeButtonRef}
        type="button"
        onClick={onClose}
        aria-label="Cerrar menú"
        className="absolute top-4 right-4 w-11 h-11 grid place-items-center text-white text-2xl"
      >
        <span aria-hidden="true">✕</span>
      </button>
      {NAV_LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          onClick={onClose}
          className="font-display uppercase text-[13vw] leading-[1.05] text-white hover:text-yellow focus-visible:text-yellow"
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
