import { cn } from "@/lib/cn";

/** Decorative diagonal derived from the supplied OFL identity. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 190 380" fill="none" className={cn("pointer-events-none", className)}>
      <path d="M178 12 24 224 147 224" stroke="var(--color-brand)" strokeWidth="6" />
      <path d="M147 224 12 366 69 156" stroke="var(--color-brand-violet)" strokeWidth="6" />
    </svg>
  );
}
