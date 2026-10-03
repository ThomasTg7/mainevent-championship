import type { Metadata } from "next";
import { PageHeader, PageShell } from "@/components/site/page-shell";
import { getCachedPublicEvents } from "@/features/events/cached-queries";
import { TicketsList } from "@/features/events/components/tickets-list";
import { getCachedSetting } from "@/features/settings/cached-queries";
import { TicketsFaq } from "@/features/settings/components/tickets-faq";

export const metadata: Metadata = {
  title: "Entradas | Guerra Campal",
  description: "Precios de las entradas de los próximos eventos de Guerra Campal, enlace a la ticketera y puntos de venta.",
};

export default async function EntradasPage() {
  // Solo los próximos (la primera página: 12 eventos por delante son más que de sobra para vender entradas).
  const [{ items }, faq] = await Promise.all([getCachedPublicEvents("upcoming", 1), getCachedSetting("ticketsFaq")]);

  return (
    <PageShell>
      <PageHeader title="Entradas" />
      <TicketsList events={items} />
      <TicketsFaq items={faq.items} />
    </PageShell>
  );
}
