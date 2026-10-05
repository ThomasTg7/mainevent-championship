import type { TicketTier } from "@/db/schema/events";
import { formatClp } from "@/lib/format-money";

type TicketTiersProps = {
  tiers: TicketTier[];
  /** Ticketera del evento: los tramos a la venta llevan a ella (en otra pestaña). */
  ticketUrl: string | null;
  eventName: string;
};

const tierClass = "grid grid-cols-[1fr_auto] items-center gap-4 border-l-[6px] border-yellow bg-black px-5 py-5 text-white sm:px-6";

function TierContent({ tier }: { tier: TicketTier }) {
  return (
    <>
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 font-display text-[26px] uppercase leading-none sm:text-[30px]">
          {tier.name}
          {tier.soldOut ? <span className="bg-red px-2 py-1 font-cond text-[11px] font-extrabold tracking-[.1em] text-white">AGOTADO</span> : null}
        </p>
        {tier.description ? <p className="mt-1 font-cond text-sm font-semibold uppercase tracking-[.06em] text-muted-foreground">{tier.description}</p> : null}
      </div>
      <p className={`font-display text-[28px] leading-none sm:text-[34px] ${tier.soldOut ? "text-muted-foreground line-through" : "text-yellow"}`}>{formatClp(tier.priceClp)}</p>
    </>
  );
}

/** Tramos de precio del evento (estilo `.tier` de la maqueta). Un tramo agotado no tiene enlace. */
export function TicketTiers({ tiers, ticketUrl, eventName }: TicketTiersProps) {
  if (tiers.length === 0) return null;

  return (
    <ul aria-label={`Tramos de entradas de ${eventName}`} className="grid gap-3">
      {tiers.map((tier) => (
        <li key={tier.name} data-tier={tier.name} data-sold-out={tier.soldOut}>
          {ticketUrl && !tier.soldOut ? (
            <a
              href={ticketUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${tier.name}: ${formatClp(tier.priceClp)}. Comprar en la ticketera (se abre en otra pestaña)`}
              className={`${tierClass} transition-[transform,box-shadow] duration-300 ease-gc hover:-translate-x-2 hover:shadow-[10px_10px_0_rgba(255,180,0,.25)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow motion-reduce:transition-none motion-reduce:hover:translate-x-0`}
            >
              <TierContent tier={tier} />
            </a>
          ) : (
            <div className={`${tierClass} ${tier.soldOut ? "border-neutral-600 text-neutral-300" : ""}`}>
              <TierContent tier={tier} />
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
