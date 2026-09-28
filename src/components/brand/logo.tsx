import { cn } from "@/lib/cn";

type LogoSize = "sm" | "md" | "lg";

type LogoProps = {
  size?: LogoSize;
};

const sizeClasses: Record<LogoSize, string> = {
  sm: "text-2xl",
  md: "text-[34px]",
  lg: "text-5xl",
};

export function Logo({ size = "md" }: LogoProps) {
  return (
    <span
      aria-label="Guerra Campal"
      className={cn("inline-flex items-center font-display leading-none tracking-[.02em]", sizeClasses[size])}
    >
      <span className="text-white">G</span>
      <span className="text-yellow">C</span>
    </span>
  );
}
