import Image from "next/image";
import { BRAND } from "@/domain/brand";
import { cn } from "@/lib/cn";

type LogoSize = "sm" | "md" | "lg";

type LogoProps = {
  size?: LogoSize;
  priority?: boolean;
};

const sizeClasses: Record<LogoSize, string> = {
  sm: "size-14",
  md: "size-16",
  lg: "size-44",
};

/** Transparent Mainevent Championship crest (wolf, ring and stars) contained in its reserved space. */
export function Logo({ size = "md", priority = false }: LogoProps) {
  return (
    <span
      role="img"
      aria-label={BRAND.name}
      className={cn("relative inline-block shrink-0 overflow-hidden", sizeClasses[size])}
    >
      <Image src="/mainevent-logo-transparent.webp" alt="" aria-hidden width={400} height={400} priority={priority} sizes={size === "lg" ? "192px" : "112px"} className="size-full object-contain" />
    </span>
  );
}
