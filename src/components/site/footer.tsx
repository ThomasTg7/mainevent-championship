import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/brand/logo";
import { getCachedSetting } from "@/features/settings/cached-queries";
import { socialLinks } from "@/features/settings/social-links";
import { NAV_LINKS } from "./nav-links";

const LINK_CLASS = "font-cond font-semibold uppercase tracking-[.04em] text-muted-foreground hover:text-white transition-colors";

function FooterColumn({ label, title, children }: { label: string; title: string; children: ReactNode }) {
  return (
    <nav aria-label={label}>
      <h2 className="font-cond font-extrabold uppercase tracking-[.16em] text-[13px] text-yellow mb-4">{title}</h2>
      <ul className="grid gap-2.5">{children}</ul>
    </nav>
  );
}

function FooterLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <li>
      <Link href={href} className={LINK_CLASS}>
        {children}
      </Link>
    </li>
  );
}

export async function Footer() {
  const [socials, footer, contact] = await Promise.all([getCachedSetting("socials"), getCachedSetting("footer"), getCachedSetting("contact")]);
  const networks = socialLinks(socials);

  return (
    <footer className="pt-20 pb-10 border-t border-border">
      <div className="max-w-[1320px] mx-auto w-full px-[clamp(16px,4vw,64px)]">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-5">
            <Logo size="lg" />
            {footer.tagline ? <p className="max-w-xs text-muted-foreground">{footer.tagline}</p> : null}
            {networks.length > 0 ? (
              <nav aria-label="Redes sociales">
                <ul className="flex flex-wrap gap-x-5 gap-y-2.5">
                  {networks.map((network) => (
                    <li key={network.network}>
                      <a href={network.href} target="_blank" rel="noopener noreferrer" className={LINK_CLASS}>
                        {network.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            ) : null}
          </div>
          <FooterColumn label="Secciones" title="Secciones">
            {NAV_LINKS.map((link) => (
              <FooterLink key={link.href} href={link.href}>
                {link.label}
              </FooterLink>
            ))}
          </FooterColumn>
          <FooterColumn label="Promotora" title="Guerra Campal">
            <FooterLink href="/nosotros">Nosotros</FooterLink>
            <FooterLink href="/quiero-pelear">Quiero pelear</FooterLink>
            <FooterLink href="/patrocinar">Patrocinar</FooterLink>
          </FooterColumn>
          <FooterColumn label="Legal" title="Legal">
            <FooterLink href="/contacto">Contacto</FooterLink>
            <FooterLink href="/privacidad">Privacidad</FooterLink>
          </FooterColumn>
        </div>
        <div className="mt-14 pt-6 border-t border-border flex flex-wrap justify-between gap-2.5 text-[#666] text-sm">
          <span>© {new Date().getFullYear()} Guerra Campal</span>
          <span>{contact.address || "Santiago, Chile"}</span>
        </div>
      </div>
    </footer>
  );
}
