import { Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { adminPath } from "@/lib/site-urls";

const ACTIONS = [
  { href: adminPath("/peleadores/nuevo"), label: "Peleador" },
  { href: adminPath("/eventos/nuevo"), label: "Evento" },
  { href: adminPath("/noticias/nueva"), label: "Noticia" },
] as const;

/** Lo que más se crea, a un toque desde el inicio. */
export function QuickActions() {
  return (
    <nav aria-label="Accesos rápidos" className="flex flex-wrap gap-2">
      {ACTIONS.map((action) => (
        <Button key={action.href} asChild variant="outline" size="lg" className="flex-1 sm:flex-none">
          <Link href={action.href}>
            <Plus aria-hidden /> {action.label}
          </Link>
        </Button>
      ))}
    </nav>
  );
}
