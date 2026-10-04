import Link from "next/link";
import { FighterCard } from "@/features/fighters/components/fighter-card";
import type { HomeFighterHighlight } from "../dto";
import { PinnedTrack } from "./pinned-track";

export const FIGHTERS_SECTION_ID = "peleadores";

/**
 * «Peleadores» (maqueta): los campeones y los primeros de cada división, con su etiqueta y el número que muestra `/rankings`,
 * y una tarjeta final «Todo el plantel». En escritorio la sección se fija y la pista avanza con el scroll; en celular es un
 * carrusel con imán. Sin peleadores no se dibuja.
 */
export function FightersPin({ fighters }: { fighters: HomeFighterHighlight[] }) {
  if (fighters.length === 0) return null;

  return (
    <section id={FIGHTERS_SECTION_ID} aria-labelledby="home-fighters-title" className="overflow-hidden">
      <div className="mx-auto w-full max-w-[1320px] px-[clamp(16px,4vw,64px)] pt-[clamp(72px,9vh,120px)]">
        <div data-reveal className="mb-7 flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="mb-3.5 flex items-center gap-2.5 font-cond text-[13px] font-extrabold uppercase tracking-[.2em] text-yellow before:block before:h-[3px] before:w-7 before:bg-yellow">El plantel</p>
            <h2 id="home-fighters-title" className="font-display text-[clamp(40px,6vw,78px)] uppercase leading-[.9] text-white">
              Peleadores
            </h2>
          </div>
          <Link href="/peleadores" className="inline-flex min-h-11 items-center border-b-2 border-yellow pb-1 font-cond text-sm font-extrabold uppercase tracking-[.1em] text-white">
            Ver todos <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
      <PinnedTrack sectionId={FIGHTERS_SECTION_ID} label="Peleadores destacados">
        {fighters.map(({ fighter, badge, backdrop }, index) => (
          <li key={fighter.id} className="w-[min(78vw,300px)] shrink-0 snap-start md:w-[340px]">
            <FighterCard fighter={fighter} heading="h3" badge={badge ?? undefined} backdrop={backdrop ?? undefined} priority={index < 2} />
          </li>
        ))}
        <li className="w-[min(78vw,300px)] shrink-0 snap-start md:w-[340px]">
          <Link href="/peleadores" className="grid h-full min-h-[300px] place-items-center bg-yellow p-6 text-center text-black outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
            <span>
              <span className="block font-display text-[clamp(44px,8vw,58px)] uppercase leading-[.9]">
                Todo el
                <br />
                plantel
              </span>
              <span className="mt-3.5 block font-cond text-base font-bold uppercase tracking-[.06em]">Ver peleadores →</span>
            </span>
          </Link>
        </li>
      </PinnedTrack>
    </section>
  );
}
