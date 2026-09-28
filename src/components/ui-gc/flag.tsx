import * as Flags from "country-flag-icons/react/3x2";
import { cn } from "@/lib/cn";

type FlagProps = {
  code: string;
  className?: string;
};

export function Flag({ code, className }: FlagProps) {
  const FlagIcon = Flags[code.toUpperCase() as keyof typeof Flags];

  if (!FlagIcon) {
    return null;
  }

  return <FlagIcon aria-hidden="true" className={cn("h-[15px] w-[22px] object-cover", className)} />;
}
