import { SmoothAnchor } from "@/components/motion/smooth-anchor";
import { MediaImage } from "@/components/media/media-image";
import { Button } from "@/components/ui-gc/button";
import { Tag } from "@/components/ui-gc/tag";
import { FighterSilhouette } from "@/features/fighters/components/fighter-silhouette";
import { HeroParallax } from "@/features/fighters/components/hero-parallax";
import type { MediaDTO } from "@/features/media/dto";
import { formatShortDate, formatTime } from "@/lib/format-date";
import type { BoutFighterDTO, EventPageDTO } from "../dto";
import { pickMainBout } from "../main-bout";
import { eventStatusTag } from "../public-format";
import { Countdown } from "./countdown";

export const EVENT_HERO_ID = "event-hero";

type EventHeroProps = {
  event: EventPageDTO;
  /** Adónde lleva «Comprar entradas»; sin él no hay botón (evento pasado o cancelado). */
  ticketHref?: string;
  ticketExternal?: boolean;
  /** Si aún falta para la hora del evento (lo decide el servidor al armar la página). */
  showCountdown: boolean;
};

function srcSet(media: MediaDTO): string | undefined {
  return media.variants.length > 0 ? media.variants.map((variant) => `${variant.url} ${variant.width}w`).join(", ") : undefined;
}

/** Imagen de portada: la horizontal en pantallas anchas y, si existe, la vertical en celular. Es la imagen LCP de la página. */
function HeroPicture({ desktop, mobile }: { desktop: MediaDTO; mobile: MediaDTO | null }) {
  const largest = desktop.variants.at(-1);
  return (
    <picture>
      {mobile ? <source media="(max-width: 767px)" srcSet={srcSet(mobile)} sizes="100vw" /> : null}
      <img
        src={largest?.url ?? desktop.originalUrl}
        srcSet={srcSet(desktop)}
        sizes="100vw"
        alt={desktop.alt}
        width={largest?.width || desktop.width || undefined}
        height={largest?.height || desktop.height || undefined}
        fetchPriority="high"
        decoding="async"
        style={{ objectPosition: `${desktop.focal.x * 100}% ${desktop.focal.y * 100}%` }}
        className="absolute inset-0 -z-[8] size-full object-cover opacity-70"
      />
    </picture>
  );
}

/** Un peleador del careo: su foto de cuerpo entero o, sin foto, la silueta con el color de su esquina. El azul va espejado. */
function FighterFigure({ fighter, side, priority }: { fighter: BoutFighterDTO; side: "red" | "blue"; priority: boolean }) {
  const mirrored = side === "blue";
  return (
    <div className={`pointer-events-none absolute bottom-0 z-[2] h-[64%] w-[52%] sm:h-[80%] sm:w-[44%] lg:h-[88%] lg:w-[36%] ${side === "red" ? "left-[-6%] lg:left-[6%]" : "right-[-6%] lg:right-[6%]"}`}>
      <HeroParallax className="absolute inset-0 will-change-transform">
        {fighter.bodyMedia ? (
          <MediaImage
            media={fighter.bodyMedia}
            sizes="(min-width: 1024px) 36vw, 52vw"
            priority={priority}
            className={`size-full object-contain object-bottom ${mirrored ? "-scale-x-100" : ""}`}
          />
        ) : (
          <FighterSilhouette className={`absolute bottom-0 left-1/2 h-full -translate-x-1/2 drop-shadow-[14px_0_30px_rgba(255,180,0,.22)] ${side === "red" ? "text-[#D7263D]" : "-scale-x-100 text-[#1E6FD9]"}`} />
        )}
      </HeroParallax>
    </div>
  );
}

/**
 * Portada del evento: careo espejado del combate estelar (o la imagen de portada), título con los peleadores, fecha,
 * cuenta regresiva y entradas. Arriba solo van el nombre del evento y su estado (próximo, en vivo, finalizado).
 */
export function EventHero({ event, ticketHref, ticketExternal = false, showCountdown }: EventHeroProps) {
  const main = pickMainBout(event.segments.flatMap((segment) => segment.bouts), (bout) => bout.status === "cancelled");
  const start = new Date(event.startsAt);
  const status = eventStatusTag(event.eventStatus);
  const title = main ? (
    <>
      <span data-slot="hero-red">{main.red.lastName}</span>{" "}
      <span className="text-[.38em] text-yellow">VS</span>{" "}
      <span data-slot="hero-blue">{main.blue.lastName}</span>
    </>
  ) : (
    event.name
  );

  return (
    <section id={EVENT_HERO_ID} aria-labelledby="event-title" className="relative isolate flex min-h-[max(640px,100svh)] flex-col justify-end overflow-hidden bg-black pt-[76px]">
      <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_55%_at_50%_38%,#2a1f06_0%,#0b0b0b_55%,#000_100%)]" />
      {event.heroMedia ? <HeroPicture desktop={event.heroMedia} mobile={event.heroMobileMedia} /> : null}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-[12%] -z-[7] select-none text-center font-display text-[24vw] leading-[.85] whitespace-nowrap text-transparent [-webkit-text-stroke:1.5px_rgba(255,255,255,.07)]">
        GUERRA CAMPAL
      </div>
      {main && !event.heroMedia ? (
        <>
          <FighterFigure fighter={main.red} side="red" priority />
          <FighterFigure fighter={main.blue} side="blue" priority={false} />
        </>
      ) : null}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 z-[3] h-[62%] bg-gradient-to-t from-black from-10% via-black/70 to-transparent" />

      <div className="relative z-[4] mx-auto flex w-full max-w-[1320px] flex-col items-center px-[clamp(16px,4vw,64px)] pb-10 text-center sm:pb-14">
        <div className="mb-4 flex flex-wrap items-center justify-center gap-2">
          <Tag tone="yellow">{event.name}</Tag>
          <Tag tone={status.tone}>{status.label}</Tag>
        </div>
        <h1
          id="event-title"
          className="flex flex-wrap items-center justify-center gap-x-[clamp(12px,3vw,40px)] font-display text-[clamp(46px,11vw,168px)] uppercase leading-[.95] text-white [text-shadow:0_2px_24px_rgba(0,0,0,.6)]"
        >
          {title}
        </h1>
        <p className="mt-3 font-cond text-[clamp(14px,1.4vw,18px)] font-semibold uppercase tracking-[.12em] text-white/90">
          {formatShortDate(start)} · <b className="font-bold text-yellow">{formatTime(start)} hrs</b> · {event.venue.name}
          {event.venue.city ? `, ${event.venue.city}` : ""}
        </p>
        {showCountdown ? <Countdown target={event.startsAt} className="my-6" /> : <div className="h-6" />}
        <div className="flex flex-wrap justify-center gap-3">
          {ticketHref ? (
            <Button variant="primary" asChild>
              {ticketExternal ? (
                <a href={ticketHref} target="_blank" rel="noopener noreferrer">
                  Comprar entradas <span aria-hidden>→</span>
                </a>
              ) : (
                <a href={ticketHref}>
                  Comprar entradas <span aria-hidden>→</span>
                </a>
              )}
            </Button>
          ) : null}
          <Button variant="ghost" asChild>
            <SmoothAnchor href="#cartelera">{event.eventStatus === "completed" ? "Ver cartelera y resultados" : "Ver cartelera completa"}</SmoothAnchor>
          </Button>
        </div>
      </div>
    </section>
  );
}
