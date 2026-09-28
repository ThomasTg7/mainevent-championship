import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { NAV_LINKS } from "./header";

export function Footer() {
  return (
    <footer className="pt-20 pb-10 border-t border-border">
      <div className="max-w-[1320px] mx-auto w-full px-[clamp(16px,4vw,64px)]">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Logo size="lg" />
          </div>
          <nav aria-label="Secciones">
            <h2 className="font-cond font-extrabold uppercase tracking-[.16em] text-[13px] text-yellow mb-4">
              Secciones
            </h2>
            <ul className="grid gap-2.5">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="font-cond font-semibold uppercase tracking-[.04em] text-muted-foreground hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <nav aria-label="Promotora">
            <h2 className="font-cond font-extrabold uppercase tracking-[.16em] text-[13px] text-yellow mb-4">
              Guerra Campal
            </h2>
            <ul className="grid gap-2.5">
              <li>
                <Link
                  href="/nosotros"
                  className="font-cond font-semibold uppercase tracking-[.04em] text-muted-foreground hover:text-white transition-colors"
                >
                  Nosotros
                </Link>
              </li>
              <li>
                <Link
                  href="/quiero-pelear"
                  className="font-cond font-semibold uppercase tracking-[.04em] text-muted-foreground hover:text-white transition-colors"
                >
                  Quiero pelear
                </Link>
              </li>
              <li>
                <Link
                  href="/patrocinar"
                  className="font-cond font-semibold uppercase tracking-[.04em] text-muted-foreground hover:text-white transition-colors"
                >
                  Patrocinar
                </Link>
              </li>
            </ul>
          </nav>
          <nav aria-label="Legal">
            <h2 className="font-cond font-extrabold uppercase tracking-[.16em] text-[13px] text-yellow mb-4">
              Legal
            </h2>
            <ul className="grid gap-2.5">
              <li>
                <Link
                  href="/contacto"
                  className="font-cond font-semibold uppercase tracking-[.04em] text-muted-foreground hover:text-white transition-colors"
                >
                  Contacto
                </Link>
              </li>
              <li>
                <Link
                  href="/privacidad"
                  className="font-cond font-semibold uppercase tracking-[.04em] text-muted-foreground hover:text-white transition-colors"
                >
                  Privacidad
                </Link>
              </li>
            </ul>
          </nav>
        </div>
        <div className="mt-14 pt-6 border-t border-border flex flex-wrap justify-between gap-2.5 text-[#666] text-sm">
          <span>© {new Date().getFullYear()} Guerra Campal</span>
          <span>Santiago, Chile</span>
        </div>
      </div>
    </footer>
  );
}
