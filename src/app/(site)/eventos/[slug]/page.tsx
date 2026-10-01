import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { SectionHeading } from "@/components/ui-gc/section-heading";
import { db } from "@/db";
import { getCachedPublicEvent } from "@/features/events/cached-queries";
import { EVENT_HERO_ID, EventHero } from "@/features/events/components/event-hero";
import { EventGallery } from "@/features/events/components/event-gallery";
import { EventSchedule } from "@/features/events/components/event-schedule";
import { EventStickyBar } from "@/features/events/components/event-sticky-bar";
import { EventVideo } from "@/features/events/components/event-video";
import { BoutAccordion } from "@/features/events/components/bout-accordion";
import { BoutRow } from "@/features/events/components/bout-row";
import { FightCardTabs } from "@/features/events/components/fight-card-tabs";
import { LiveRefresher } from "@/features/events/components/live-refresher";
import { VenueMap } from "@/features/events/components/venue-map";
import { getPublicEventBySlug } from "@/features/events/queries";
import { pickMainBout } from "@/features/events/main-bout";
import { showsCountdown } from "@/features/events/public-format";
import { PreviewBanner } from "@/features/fighters/components/preview-banner";
import { verifyPreviewToken } from "@/features/publication/preview";
import { formatShortDate, formatTime } from "@/lib/format-date";

/**
 * Con un token de vista previa válido para este evento se muestra aunque sea borrador (sin caché); en cualquier otro
 * caso, solo si es público ahora. Se comparte entre la página y `generateMetadata`.
 */
const loadEvent = cache(async (slug: string, previewToken: string | undefined) => {
  // La firma y la fecha se revisan antes de leer: un `?preview=` inventado no cuesta una consulta sin caché.
  if (previewToken && verifyPreviewToken(previewToken)) {
    const draft = await getPublicEventBySlug(db, slug, { preview: true });
    if (draft && verifyPreviewToken(previewToken, { entity: "event", id: draft.id })) {
      return { event: draft, isPreview: true };
    }
  }
  return { event: await getCachedPublicEvent(slug), isPreview: false };
});

function previewParam(value: string | string[] | undefined): string | undefined {
  return typeof value === "string" && value ? value : undefined;
}

export async function generateMetadata({ params, searchParams }: PageProps<"/eventos/[slug]">): Promise<Metadata> {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const { event, isPreview } = await loadEvent(slug, previewParam(query.preview));
  if (!event) return { title: "Evento no encontrado | Guerra Campal" };

  const main = pickMainBout(event.segments.flatMap((segment) => segment.bouts), (bout) => bout.status === "cancelled");
  const start = new Date(event.startsAt);
  const versus = main ? `${main.red.firstName} ${main.red.lastName} vs ${main.blue.firstName} ${main.blue.lastName}. ` : "";
  return {
    title: `${event.name} | Guerra Campal`,
    description: `${versus}${formatShortDate(start)} a las ${formatTime(start)} en ${event.venue.name}, ${event.venue.city}. Cartelera, horarios y entradas.`,
    ...(isPreview ? { robots: { index: false, follow: false } } : {}),
  };
}

export default async function EventPage({ params, searchParams }: PageProps<"/eventos/[slug]">) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const { event, isPreview } = await loadEvent(slug, previewParam(query.preview));
  if (!event) notFound();

  const start = new Date(event.startsAt);
  const isOver = event.eventStatus === "completed" || event.eventStatus === "cancelled";
  const canBuy = !isOver;
  // Sin ticketera, «Entradas» lleva a la página de entradas del sitio (tramos y puntos de venta).
  const ticketHref = canBuy ? (event.ticketUrl ?? "/entradas") : undefined;
  const ticketExternal = Boolean(canBuy && event.ticketUrl);
  const segments = event.segments.filter((segment) => segment.bouts.length > 0);

  return (
    <>
      {event.eventStatus === "live" ? <LiveRefresher intervalMs={20_000} /> : null}
      <EventHero event={event} ticketHref={ticketHref} ticketExternal={ticketExternal} showCountdown={showsCountdown(event)} />
      <EventStickyBar
        heroId={EVENT_HERO_ID}
        name={event.name}
        meta={`${formatShortDate(start)} · ${formatTime(start)} hrs · ${event.venue.name}`}
        ticketHref={ticketHref}
        external={ticketExternal}
      />

      <section id="cartelera" aria-labelledby="cartelera-title" className="bg-white py-[clamp(72px,10vw,140px)] text-black">
        <div className="mx-auto w-full max-w-[1320px] px-[clamp(16px,4vw,64px)]">
          <SectionHeading kicker={event.eventStatus === "completed" ? "Resultados" : "Cartelera"} title={<span id="cartelera-title">{event.eventStatus === "completed" ? "Cartelera y resultados" : "Cartelera"}</span>} tone="light" />
          {segments.length > 0 ? (
            <BoutAccordion>
              <FightCardTabs
                segments={segments.map((segment) => ({
                  id: segment.id,
                  name: segment.name,
                  content: segment.bouts.map((bout) => <BoutRow key={bout.id} bout={bout} />),
                }))}
              />
            </BoutAccordion>
          ) : (
            <p className="border border-dashed border-neutral-300 px-6 py-12 text-center font-cond text-lg font-semibold uppercase tracking-[.06em] text-neutral-600">
              Pronto anunciaremos la cartelera de {event.name}.
            </p>
          )}
          <EventSchedule event={event} />
        </div>
      </section>

      <section aria-labelledby="venue-title" className="bg-black py-[clamp(56px,8vw,110px)]">
        <div className="mx-auto w-full max-w-[1320px] px-[clamp(16px,4vw,64px)]">
          <p id="venue-title" className="mb-8 flex items-center gap-2.5 font-cond text-[13px] font-extrabold uppercase tracking-[.2em] text-yellow before:block before:h-[3px] before:w-7 before:bg-yellow">
            El lugar
          </p>
          <VenueMap name={event.venue.name} address={event.venue.address} city={event.venue.city} lat={event.venue.lat} lng={event.venue.lng} />
        </div>
      </section>

      {event.gallery.length > 0 ? (
        <section aria-labelledby="gallery-title" className="border-t border-border bg-black py-[clamp(56px,8vw,110px)]">
          <div className="mx-auto w-full max-w-[1320px] px-[clamp(16px,4vw,64px)]">
            <SectionHeading kicker="Fotos" title={<span id="gallery-title">Galería</span>} />
            <EventGallery media={event.gallery} eventName={event.name} />
          </div>
        </section>
      ) : null}

      {event.streamUrl ? (
        <section aria-labelledby="video-title" className="border-t border-border bg-black py-[clamp(56px,8vw,110px)]">
          <div className="mx-auto w-full max-w-[1320px] px-[clamp(16px,4vw,64px)]">
            <SectionHeading kicker={event.eventStatus === "completed" ? "Video" : "Transmisión"} title={<span id="video-title">{event.eventStatus === "completed" ? "Revive la velada" : "Míralo en vivo"}</span>} />
            <EventVideo url={event.streamUrl} title={event.eventStatus === "completed" ? "Ver el video" : "Ver la transmisión"} />
          </div>
        </section>
      ) : null}

      {isPreview ? <PreviewBanner subject="este evento" /> : null}
    </>
  );
}
