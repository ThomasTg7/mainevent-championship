import { Inbox } from "lucide-react";
import Link from "next/link";
import { adminPath } from "@/lib/site-urls";

/** Mensajes de la bandeja que nadie ha respondido: un solo toque lleva a leerlos. */
export function InboxCard({ count }: { count: number }) {
  const caption = count === 0 ? "mensajes nuevos: la bandeja está al día" : count === 1 ? "mensaje nuevo en la bandeja" : "mensajes nuevos en la bandeja";
  return (
    <Link
      href={adminPath("/bandeja?estado=nuevos")}
      data-slot="inbox-card"
      className="flex min-h-11 items-center gap-4 border border-border bg-card p-5 transition-colors hover:border-primary focus-visible:outline-2 focus-visible:outline-primary sm:p-6"
    >
      <Inbox aria-hidden className={`size-8 shrink-0 ${count > 0 ? "text-primary" : "text-muted-foreground"}`} />
      <span className="flex flex-col">
        <span className="text-3xl leading-none font-semibold tabular-nums">{count}</span>
        <span className="text-muted-foreground">{caption}</span>
      </span>
    </Link>
  );
}
