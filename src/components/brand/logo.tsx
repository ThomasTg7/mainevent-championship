import Image from "next/image";
import { BRAND } from "@/domain/brand";
import { cn } from "@/lib/cn";

type LogoSize = "sm" | "md" | "lg";

type LogoProps = {
  size?: LogoSize;
  priority?: boolean;
};

const sizeClasses: Record<LogoSize, string> = {
  sm: "h-14 w-24",
  md: "h-16 w-28",
  lg: "h-40 w-48",
};

/** Transparent artwork with the entire lightning bolt contained in its reserved space. */
export function Logo({ size = "md", priority = false }: LogoProps) {
  return (
    <span
      role="img"
      aria-label={BRAND.name}
      className={cn("relative inline-block shrink-0 overflow-hidden", sizeClasses[size])}
    >
      <Image src="/ofl-logo-transparent.webp" alt="" aria-hidden width={400} height={400} priority={priority} sizes={size === "lg" ? "192px" : "112px"} className="size-full object-contain" />
    </span>
  );
}
