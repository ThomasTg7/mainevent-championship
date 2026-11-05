import { cn } from "@/lib/cn";

/** Decorative crest motif from the Mainevent Championship logo: the open yellow ring and its three stars. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 400 400" fill="none" className={cn("pointer-events-none", className)}>
      <path d="M318 96A160 160 0 1 0 262 344" stroke="var(--color-brand)" strokeWidth="10" strokeLinecap="round" />
      <path d="M262 344c22-9 40-22 54-38" stroke="var(--color-brand-orange)" strokeWidth="10" strokeLinecap="round" />
      <path d="m200 8 7 15 16 2-12 11 3 16-14-8-14 8 3-16-12-11 16-2z" fill="var(--color-brand)" />
      <path d="m30 188 6 12 13 2-10 9 3 13-12-6-12 6 3-13-10-9 13-2z" fill="var(--color-brand)" />
      <path d="m370 188 6 12 13 2-10 9 3 13-12-6-12 6 3-13-10-9 13-2z" fill="var(--color-brand)" />
    </svg>
  );
}
