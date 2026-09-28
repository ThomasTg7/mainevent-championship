"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui-gc/button";
import { cn } from "@/lib/cn";
import { MobileMenu } from "./mobile-menu";

export const NAV_LINKS = [
  { href: "/eventos", label: "Eventos" },
  { href: "/peleadores", label: "Peleadores" },
  { href: "/rankings", label: "Rankings" },
  { href: "/noticias", label: "Noticias" },
  { href: "/entradas", label: "Entradas" },
];

export function Header() {
  const [solid, setSolid] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let lastY = window.scrollY;

    function onScroll() {
      const y = window.scrollY;
      setSolid(y > 40);
      setHidden(y > lastY && y > 300);
      lastY = y;
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-[100] h-[76px] flex items-center border-b border-transparent transition-[background-color,border-color,transform] duration-300 ease-gc",
          solid && "bg-black/90 backdrop-blur-md border-border",
          hidden && "-translate-y-full",
        )}
      >
        <div className="max-w-[1320px] mx-auto w-full px-[clamp(16px,4vw,64px)] flex items-center gap-10">
          <Link href="/" aria-label="Guerra Campal inicio">
            <Logo />
          </Link>
          <nav aria-label="Principal" className="hidden lg:flex gap-8 mr-auto">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="font-cond font-bold uppercase tracking-[.1em] text-[15px] text-white/85 hover:text-white transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-4 ml-auto lg:ml-0">
            <Button asChild variant="primary" className="hidden lg:inline-flex">
              <Link href="/entradas">Comprar entradas</Link>
            </Button>
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Menú"
              className={cn("lg:hidden w-11 h-11 grid place-items-center text-white", menuOpen && "invisible")}
            >
              <svg
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.4}
                aria-hidden="true"
              >
                <path d="M3 7h18M3 12h18M3 17h12" />
              </svg>
            </button>
          </div>
        </div>
      </header>
      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
