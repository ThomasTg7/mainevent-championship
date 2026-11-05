import { PosterStage } from "@/components/brand/poster-stage";
import { MediaImage } from "@/components/media/media-image";
import { SectionHeading } from "@/components/ui-gc/section-heading";
import { formatShortDate, formatTime } from "@/lib/format-date";
import type { EventPageDTO } from "../dto";

/**
 * El afiche oficial del evento sobre el escenario dorado. El afiche se inclina un poco al pasar el mouse (solo
 * `transform`, quieto con «reducir movimiento»). Sin afiche cargado no se muestra nada.
 */
export function EventPoster({ event }: { event: EventPageDTO }) {
  const poster = event.posterMedia;
  if (!poster) return null;
  const start = new Date(event.startsAt);
  return (
    <section aria-labelledby="poster-title" className="relative isolate overflow-hidden bg-black py-[clamp(56px,8vw,110px)]">
      <PosterStage embers={false} />
      <div className="relative mx-auto grid w-full max-w-[1320px] items-center gap-10 px-[clamp(16px,4vw,64px)] md:grid-cols-[minmax(0,1fr)_minmax(0,420px)] lg:gap-16">
        <div data-reveal>
          <SectionHeading kicker="Afiche oficial" title={<span id="poster-title">{event.name}</span>} />
          <p className="font-cond text-lg font-semibold uppercase tracking-[.08em] text-white/85">
            {formatShortDate(start)} · {formatTime(start)} hrs
          </p>
          <p className="mt-1 text-white/60">{event.venue.name}</p>
        </div>
        <figure className="mec-poster-frame mx-auto w-full max-w-[420px]">
          <div className="mec-poster-card relative overflow-hidden border border-brand-gold/40 shadow-[0_30px_70px_-25px_rgba(255,170,20,.5)]">
            <MediaImage media={poster} sizes="(min-width: 768px) 420px, 92vw" className="block h-auto w-full" />
          </div>
          <figcaption className="sr-only">Afiche de {event.name}</figcaption>
        </figure>
      </div>
    </section>
  );
}
