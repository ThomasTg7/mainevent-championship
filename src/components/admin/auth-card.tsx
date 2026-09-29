import type { ReactNode } from "react";
import { Logo } from "@/components/brand/logo";

type AuthCardProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

export function AuthCard({ title, description, children }: AuthCardProps) {
  return (
    <main className="min-h-svh flex items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm flex flex-col gap-6">
        <div className="flex justify-center">
          <Logo size="lg" />
        </div>
        <div className="flex flex-col gap-2 text-center">
          <h1 className="text-xl font-semibold">{title}</h1>
          {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
        </div>
        {children}
      </div>
    </main>
  );
}
