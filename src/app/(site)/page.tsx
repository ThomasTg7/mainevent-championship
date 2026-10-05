import type { Metadata } from "next";
import { ScrollReveal } from "@/components/motion/scroll-reveal";
import { formatShortDate } from "@/lib/format-date";
import { pickMainBout } from "@/features/events/main-bout";
import { getHomeData } from "@/features/home/cached-queries";
import { DontMissRail } from "@/features/home/components/dont-miss-rail";
import { FightersPin } from "@/features/home/components/fighters-pin";
import { HomeCardSummary } from "@/features/home/components/home-card-summary";
import { HomeHero } from "@/features/home/components/home-hero";
import { HomeNews } from "@/features/home/components/home-news";
import { IntroLoader } from "@/features/home/components/intro-loader";
import { Marquee } from "@/features/home/components/marquee";
import { RankingsPreview } from "@/features/home/components/rankings-preview";
import { StatsBand } from "@/features/home/components/stats-band";
import { TicketsCta } from "@/features/home/components/tickets-cta";
import type { HomeHero as HomeHeroDTO } from "@/features/home/dto";
import { SponsorStrip } from "@/features/sponsors/components/sponsor-strip";

export const metadata: Metadata = {
  title: "Guerra Campal | MMA en Chile",
  description: "Guerra Campal, la promotora de MMA de Chile: próximo evento, cartelera, peleadores, rankings, noticias y entradas.",
};

/** Los textos de la cinta amarilla: el evento, la fecha, el recinto y, si ya se juega, el combate estelar. */
function marqueeItems(hero: HomeHeroDTO): string[] {
  if (hero.kind === "brand") return [];
  const { event } = hero;
  const main = pickMainBout(event.segments.flatMap((segment) => segment.bouts), (bout) => bout.status === "cancelled");
  const items = [event.name, formatShortDate(new Date(event.startsAt)), event.venue.name];
  if (hero.kind === "next-event" && (event.ticketTiers.length > 0 || event.ticketUrl)) items.push("Entradas a la venta");
  if (main) items.push(`${main.red.lastName} vs ${main.blue.lastName}`);
  return items;
}

export default async function HomePage() {
  const home = await getHomeData();
  const { hero } = home;

  return (
    <>
      <IntroLoader />
      <ScrollReveal />
      <HomeHero hero={hero} />
      <Marquee items={marqueeItems(hero)} />
      {hero.kind !== "brand" ? <HomeCardSummary event={hero.event} rankLabels={hero.rankLabels} kind={hero.kind} /> : null}
      <HomeNews news={home.news} />
      <DontMissRail posts={home.dontMiss} />
      <FightersPin fighters={home.fighters} />
      {home.stats.events > 0 ? <StatsBand stats={home.stats} /> : null}
      <RankingsPreview rankings={home.rankings} />
      {hero.kind === "next-event" ? <TicketsCta event={hero.event} /> : null}
      <SponsorStrip sponsors={home.sponsors} />
    </>
  );
}
