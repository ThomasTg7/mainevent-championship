import { Logo } from "@/components/brand/logo";

export default function HomePage() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center gap-6 text-center px-6">
      <Logo size="lg" />
      <h1 className="font-display uppercase text-white text-[clamp(40px,8vw,96px)] leading-[.9]">Próximamente</h1>
      <p className="font-cond uppercase tracking-[.08em] text-muted-foreground max-w-md">
        Estamos preparando el sitio de Guerra Campal. Vuelve pronto.
      </p>
    </div>
  );
}
