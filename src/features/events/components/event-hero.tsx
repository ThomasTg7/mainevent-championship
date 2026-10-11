import { BRAND } from "@/domain/brand";
import { SmoothAnchor } from "@/components/motion/smooth-anchor";
import { Button } from "@/components/ui-gc/button";
import { Tag } from "@/components/ui-gc/tag";
import { formatShortDate, formatTime } from "@/lib/format-date";
import type { EventPageDTO } from "../dto";
import { pickMainBout } from "../main-bout";
import { eventStatusTag } from "../public-format";
import { Countdown } from "./countdown";
import { EventHeroArt } from "./event-hero-art";

export const EVENT_HERO_ID = "event-hero";
type EventHeroProps = { event: EventPageDTO; ticketHref?: string; ticketExternal?: boolean; showCountdown: boolean };

/** Full-width photography with centered event billing and actions. */
export function EventHero({ event, ticketHref, ticketExternal = false, showCountdown }: EventHeroProps) {
  const main = pickMainBout(event.segments.flatMap((segment) => segment.bouts), (bout) => bout.status === "cancelled");
  const start = new Date(event.startsAt);
  const status = eventStatusTag(event.eventStatus);
  return (
    <section id={EVENT_HERO_ID} data-site-hero aria-labelledby="event-title" className="ofl-hero relative isolate flex min-h-[max(760px,100svh)] items-end overflow-hidden pt-24 text-center lg:min-h-[max(850px,100svh)]">
      <EventHeroArt event={event} main={main} />
      <div className="relative z-[4] mx-auto w-full max-w-[1320px] px-[clamp(16px,4vw,64px)] pb-12 pt-56 lg:pb-12 lg:pt-40">
        <div className="mx-auto max-w-[960px]">
          <p className="mb-5 hidden font-cond text-sm font-bold tracking-[.16em] text-white uppercase lg:block">{BRAND.name}</p>
          <div className="mb-5 flex flex-wrap items-center justify-center gap-2">
            <Tag tone="brand">{event.name}</Tag><Tag tone={status.tone}>{status.label}</Tag>
          </div>
          <h1 id="event-title" className="font-display text-[clamp(44px,8vw,100px)] uppercase leading-[.98] tracking-[-.025em] text-white [overflow-wrap:anywhere] lg:flex lg:flex-wrap lg:items-center lg:justify-center lg:gap-x-6">
            {main ? <><span data-slot="hero-red" className="block">{main.red.lastName}</span><span className="my-2 block font-cond text-[.3em] font-bold tracking-[.12em] ofl-gradient-text">VS</span><span data-slot="hero-blue" className="block">{main.blue.lastName}</span></> : event.name}
          </h1>
          <div aria-hidden className="ofl-hero-rule mx-auto mt-7" />
          <p className="mt-5 font-cond text-base font-semibold tracking-[.03em] text-white sm:text-lg">{formatShortDate(start)} · {formatTime(start)} hrs</p>
          <p className="mt-1 text-sm text-white/70">{event.venue.name}{event.venue.city ? `, ${event.venue.city}` : ""}</p>
          {showCountdown ? <Countdown target={event.startsAt} className="my-6 justify-center" /> : <div className="h-6" />}
          <div className="flex flex-wrap justify-center gap-3">
            {ticketHref ? <Button variant="primary" asChild><a href={ticketHref} {...(ticketExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}>Comprar entradas</a></Button> : null}
            <Button variant="ghost" asChild><SmoothAnchor href="#cartelera">{event.eventStatus === "completed" ? "Ver cartelera y resultados" : "Ver cartelera completa"}</SmoothAnchor></Button>
            <Button variant="primary" asChild>{event.streamUrl ? <a href={event.streamUrl} target="_blank" rel="noopener noreferrer">Dónde ver</a> : <SmoothAnchor href="#donde-ver">Dónde ver</SmoothAnchor>}</Button>
          </div>
          {!event.streamUrl ? <p id="donde-ver" className="mt-4 scroll-mt-28 text-sm text-white/80">Pronto anunciaremos dónde ver este evento.</p> : null}
        </div>
      </div>
    </section>
  );
}
