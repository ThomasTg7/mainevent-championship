import Image from "next/image";
import { BRAND } from "@/domain/brand";
import { cn } from "@/lib/cn";

type LogoSize = "sm" | "md" | "lg";

type LogoProps = {
  size?: LogoSize;
  priority?: boolean;
};

const sizeClasses: Record<LogoSize, string> = {
  sm: "h-14 w-24 [&_img]:w-24 [&_img]:-top-5",
  md: "h-16 w-28 [&_img]:w-28 [&_img]:-top-6",
  lg: "h-40 w-48 [&_img]:w-48 [&_img]:-top-4",
};

/** Supplied artwork, with dimensions reserved and the source asset intact. */
export function Logo({ size = "md", priority = false }: LogoProps) {
  return (
    <span
      role="img"
      aria-label={BRAND.name}
      className={cn("relative inline-block shrink-0 overflow-hidden", sizeClasses[size])}
    >
      <Image src="/ofl-logo.webp" alt="" aria-hidden width={400} height={400} priority={priority} sizes={size === "lg" ? "192px" : "112px"} className="absolute left-0 h-auto max-w-none" />
    </span>
  );
}
