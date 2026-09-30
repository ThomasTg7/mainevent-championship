import type { Metadata } from "next";
import { getCachedPublicEvents } from "@/features/events/cached-queries";
import { TicketsList } from "@/features/events/components/tickets-list";

export const metadata: Metadata = {
  title: "Entradas | Guerra Campal",
  description: "Precios de las entradas de los próximos eventos de Guerra Campal, enlace a la ticketera y puntos de venta.",
};

export default async function EntradasPage() {
  // Solo los próximos (la primera página: 12 eventos por delante son más que de sobra para vender entradas).
  const { items } = await getCachedPublicEvents("upcoming", 1);

  return (
    <div className="mx-auto w-full max-w-[1320px] px-[clamp(16px,4vw,64px)] pb-24 pt-[calc(76px+clamp(32px,6vw,72px))]">
      <header className="mb-14">
        <p className="mb-3.5 flex items-center gap-2.5 font-cond text-[13px] font-extrabold uppercase tracking-[.2em] text-yellow before:block before:h-[3px] before:w-7 before:bg-yellow">
          Guerra Campal
        </p>
        <h1 className="font-display text-[clamp(44px,8vw,96px)] uppercase leading-[.9] text-white">Entradas</h1>
      </header>
      <TicketsList events={items} />
      {/* Preguntas frecuentes de entradas: las agrega el Plan 06 (Configuración del sitio). */}
      <div data-slot="tickets-faq" />
    </div>
  );
}
