import { Slot } from "radix-ui";
import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "ghost" | "dark";

type ButtonProps = ComponentPropsWithoutRef<"button"> & {
  variant: ButtonVariant;
  asChild?: boolean;
};

const baseClasses =
  "inline-flex min-h-12 items-center justify-center gap-[.6em] font-cond font-extrabold uppercase tracking-[.06em] text-[15px] px-7 py-[15px] relative isolate overflow-hidden cursor-pointer transition-transform duration-200 ease-ofl active:scale-[.97] disabled:opacity-50 disabled:pointer-events-none before:content-[''] before:pointer-events-none before:absolute before:inset-0 before:-z-10 before:transition-transform before:duration-250 before:ease-ofl";

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-brand text-white before:bg-brand-hover before:-translate-x-full hover:before:translate-x-0 hover:-translate-y-0.5",
  ghost: "border border-white/45 text-white before:bg-surface-2 before:translate-y-full hover:before:translate-y-0",
  dark: "bg-black text-white hover:text-white before:bg-brand before:-translate-x-full hover:before:translate-x-0",
};

export function Button({ variant, asChild, className, ...props }: ButtonProps) {
  const Component = asChild ? Slot.Root : "button";

  return <Component className={cn(baseClasses, variantClasses[variant], className)} {...props} />;
}
