import Link from "next/link";
import { Button } from "@/components/ui-gc/button";
import type { EventPageDTO } from "@/features/events/dto";
import { TicketTiers } from "@/features/events/components/ticket-tiers";
import { formatShortDate } from "@/lib/format-date";

/**
 * «Asegura tu lugar» (maqueta): los tramos de entradas del próximo evento sobre la franja amarilla y el botón a la ticketera.
 * Sin tramos ni ticketera no hay nada que ofrecer: la sección no se dibuja (las entradas siguen en `/entradas`).
 */
export function TicketsCta({ event }: { event: EventPageDTO }) {
  const hasTiers = event.ticketTiers.length > 0;
  if (!hasTiers && !event.ticketUrl) return null;

  return (
    <section id="entradas" aria-labelledby="home-tickets-title" className={`relative isolate overflow-hidden bg-black pt-[clamp(72px,10vw,140px)] lg:pb-[clamp(72px,10vw,140px)] ${hasTiers ? "" : "pb-[clamp(72px,10vw,140px)]"}`}>
      {/* La franja diagonal amarilla es de escritorio; en celular los tramos van en un bloque amarillo bajo el texto. */}
      <div aria-hidden className="absolute inset-x-0 -inset-y-[20%] -z-10 hidden bg-[linear-gradient(115deg,transparent_0_48%,#FFB400_48%_100%)] lg:block" />
      <div className="mx-auto grid w-full max-w-[1320px] items-center gap-10 px-[clamp(16px,4vw,64px)] lg:grid-cols-2 lg:gap-10">
        <div data-reveal>
          <p className="mb-3.5 flex items-center gap-2.5 font-cond text-[13px] font-extrabold uppercase tracking-[.2em] text-yellow before:block before:h-[3px] before:w-7 before:bg-yellow">
            {event.name} · {formatShortDate(new Date(event.startsAt))}
          </p>
          <h2 id="home-tickets-title" className="font-display text-[clamp(56px,8vw,118px)] uppercase leading-[.9] text-white">
            Asegura
            <br />
            tu <span className="text-yellow">lugar</span>
          </h2>
          <p className="my-5 max-w-[44ch] text-[17px] text-muted-foreground">
            {event.ticketUrl ? "Entradas a la venta en nuestra ticketera oficial." : "Los precios de cada tramo están abajo."}
            {event.ticketPoints ? " También en puntos de venta físicos." : ""}
          </p>
          <div className="flex flex-wrap gap-3">
            {event.ticketUrl ? (
              <Button variant="primary" asChild>
                <a href={event.ticketUrl} target="_blank" rel="noopener noreferrer">
                  Ir a la ticketera <span aria-hidden>↗</span>
                </a>
              </Button>
            ) : null}
            <Button variant="ghost" asChild>
              <Link href="/entradas">Ver precios y puntos de venta</Link>
            </Button>
          </div>
        </div>
        {hasTiers ? (
          <div data-reveal className="-mx-[clamp(16px,4vw,64px)] bg-yellow px-[clamp(16px,4vw,64px)] py-12 lg:mx-0 lg:bg-transparent lg:p-0">
            <TicketTiers tiers={event.ticketTiers} ticketUrl={event.ticketUrl} eventName={event.name} />
          </div>
        ) : null}
      </div>
    </section>
  );
}
