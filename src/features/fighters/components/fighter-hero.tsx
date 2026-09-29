import { MediaImage } from "@/components/media/media-image";
import { Flag } from "@/components/ui-gc/flag";
import { Tag } from "@/components/ui-gc/tag";
import { countryName, formatWeight } from "@/domain/units";
import type { FighterProfileDTO } from "../dto";
import { CAREER_STATUS_LABELS, divisionTitle } from "../labels";
import { CountFigures, type CountFigure } from "./count-figures";
import { FighterSilhouette } from "./fighter-silhouette";
import { HeroParallax } from "./hero-parallax";

/** La foto del hero es la imagen LCP: ocupa todo el ancho en celular y ~40 % en escritorio. */
export const FIGHTER_HERO_SIZES = "(min-width: 1024px) 40vw, 100vw";

type FighterHeroProps = {
  fighter: FighterProfileDTO;
  /** Las tres cifras grandes. */
  figures: CountFigure[];
};

export function FighterHero({ fighter, figures }: FighterHeroProps) {
  const name = `${fighter.firstName} ${fighter.lastName}`;

  return (
    <section className="relative overflow-hidden bg-black pt-[76px]" aria-labelledby="fighter-name">
      <div className="mx-auto grid w-full max-w-[1320px] items-end px-[clamp(16px,4vw,64px)] lg:grid-cols-[1.15fr_.85fr] lg:gap-8">
        <div className="relative z-10 order-2 pb-10 pt-2 lg:order-1 lg:pb-16 lg:pt-20">
          <div className="mb-5 flex flex-wrap gap-2" data-slot="fighter-tags">
            <Tag tone="yellow">{divisionTitle(fighter.division)}</Tag>
            <Tag tone="outline">{CAREER_STATUS_LABELS[fighter.careerStatus]}</Tag>
            {/* Etiquetas de campeón / ranking: las agrega el Plan 05 en este mismo contenedor. */}
          </div>
          {fighter.nickname ? (
            <p className="font-cond text-[clamp(16px,2.4vw,24px)] font-bold tracking-[.12em] text-yellow">“{fighter.nickname}”</p>
          ) : null}
          <h1 id="fighter-name" className="my-2 font-display text-[clamp(38px,7.5vw,104px)] uppercase leading-[.95] text-white">
            {name}
          </h1>
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 font-cond text-[15px] font-semibold uppercase tracking-[.08em] text-muted-foreground sm:text-base">
            <span className="flex items-center gap-2">
              <Flag code={fighter.nationality} className="h-[18px] w-[27px]" />
              {countryName(fighter.nationality)}
            </span>
            {fighter.weightKg ? <span>{formatWeight(fighter.weightKg)}</span> : null}
          </p>
          {fighter.bio ? (
            <p data-slot="fighter-bio" className="mt-5 line-clamp-5 max-w-xl text-[15px] leading-relaxed text-white/85 sm:text-base">
              {fighter.bio}
            </p>
          ) : null}
          <CountFigures items={figures} className="mt-7 grid max-w-xl grid-cols-3 border-t border-border" valueClassName="text-[clamp(40px,6.5vw,72px)]" />
        </div>

        <div className="relative order-1 mx-auto -mb-2 aspect-[3/4] w-full max-w-[520px] lg:order-2 lg:max-w-none">
          <HeroParallax className="absolute inset-0 will-change-transform">
            {fighter.bodyMedia ? (
              <MediaImage media={fighter.bodyMedia} sizes={FIGHTER_HERO_SIZES} priority className="size-full object-contain object-bottom" />
            ) : (
              <FighterSilhouette className="absolute bottom-0 left-1/2 h-[96%] -translate-x-1/2 text-yellow" />
            )}
          </HeroParallax>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black to-transparent lg:hidden" />
        </div>
      </div>
    </section>
  );
}
