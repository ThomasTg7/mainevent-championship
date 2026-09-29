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

// Logo provisorio "GC": único lugar a reemplazar cuando llegue el oficial.
export function Logo({ size = "md" }: LogoProps) {
  return (
    <span
      role="img"
      aria-label="Guerra Campal"
      className={cn("inline-flex items-center font-display leading-none tracking-[.02em]", sizeClasses[size])}
    >
      <span aria-hidden="true" className="text-white">
        G
      </span>
      <span aria-hidden="true" className="text-yellow">
        C
      </span>
    </span>
  );
}
