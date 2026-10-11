import type { ReactNode } from "react";
import { Logo } from "@/components/brand/logo";
import { BrandMark } from "@/components/brand/brand-mark";
import { BRAND } from "@/domain/brand";

type AuthCardProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

export function AuthCard({ title, description, children }: AuthCardProps) {
  return (
    <main className="ofl-admin relative isolate min-h-svh flex items-center justify-center overflow-hidden bg-background px-4 py-10">
      <BrandMark className="absolute -right-28 top-0 -z-10 h-full opacity-40 md:right-[12%]" />
      <div className="ofl-admin-section w-full max-w-md flex flex-col gap-6 border-t-2 border-t-brand p-6 sm:p-10">
        <div className="flex justify-center">
          <Logo size="md" priority />
        </div>
        <div className="flex flex-col gap-2 text-center">
          <p className="font-cond text-xs font-bold uppercase tracking-[.2em] text-accent-bright">{BRAND.name} · Administración</p>
          <h1 className="ofl-admin-title">{title}</h1>
          {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
        </div>
        {children}
      </div>
    </main>
  );
}
