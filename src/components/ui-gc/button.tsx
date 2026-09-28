import { Slot } from "@radix-ui/react-slot";
import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "ghost" | "dark";

type ButtonProps = ComponentPropsWithoutRef<"button"> & {
  variant: ButtonVariant;
  asChild?: boolean;
};

const baseClasses =
  "inline-flex items-center justify-center gap-[.6em] font-cond font-extrabold uppercase tracking-[.08em] text-[15px] px-7 py-[15px] relative isolate overflow-hidden transition-[color,transform] duration-300 ease-gc active:scale-[.97] before:content-[''] before:absolute before:inset-0 before:-z-10 before:transition-transform before:duration-500 before:ease-gc";

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-yellow text-black before:bg-white before:-translate-x-full hover:before:translate-x-0",
  ghost: "border-2 border-white text-white hover:text-black before:bg-white before:translate-y-full hover:before:translate-y-0",
  dark: "bg-black text-white hover:text-black before:bg-yellow before:-translate-x-full hover:before:translate-x-0",
};

export function Button({ variant, asChild, className, ...props }: ButtonProps) {
  const Component = asChild ? Slot : "button";

  return <Component className={cn(baseClasses, variantClasses[variant], className)} {...props} />;
}
