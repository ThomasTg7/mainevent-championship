import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { db } from "@/db";
import type { ComputedRecord } from "@/domain/record";
import { getCachedFighterBouts, getCachedPublicFighter } from "@/features/fighters/cached-queries";
import type { ManualRecord } from "@/features/fighters/dto";
import { FightHistory } from "@/features/fighters/components/fight-history";
import { FighterGallery } from "@/features/fighters/components/fighter-gallery";
import { FighterHero } from "@/features/fighters/components/fighter-hero";
import { FighterInfo } from "@/features/fighters/components/fighter-info";
import { NextBout } from "@/features/fighters/components/next-bout";
import { PreviewBanner } from "@/features/fighters/components/preview-banner";
import { RecordSummary } from "@/features/fighters/components/record-summary";
import { divisionTitle } from "@/features/fighters/labels";
import { getPublicFighterBySlug } from "@/features/fighters/queries";
import { getCachedPostsForFighter } from "@/features/posts/cached-queries";
import { RelatedNewsRail } from "@/features/posts/components/related-news-rail";
import { verifyPreviewToken } from "@/features/publication/preview";

/**
 * Con un token de vista previa válido para este peleador se muestra aunque sea borrador (sin caché);
 * en cualquier otro caso, solo si es público ahora. Se comparte entre la página y `generateMetadata`.
 */
const loadFighter = cache(async (slug: string, previewToken: string | undefined) => {
  // La firma y la fecha se revisan antes de leer: un `?preview=` inventado no cuesta una consulta sin caché.
  if (previewToken && verifyPreviewToken(previewToken)) {
    const draft = await getPublicFighterBySlug(db, slug, { preview: true });
    if (draft && verifyPreviewToken(previewToken, { entity: "fighter", id: draft.id })) {
      return { fighter: draft, isPreview: true };
    }
  }
  return { fighter: await getCachedPublicFighter(slug), isPreview: false };
});

function previewParam(value: string | string[] | undefined): string | undefined {
  return typeof value === "string" && value ? value : undefined;
}

/**
 * Las tres cifras del hero (spec §3): KO/TKO, sumisiones y victorias del récord profesional en Guerra Campal; un
 * peleador que aún no pelea en la promotora muestra Victorias, Derrotas y Empates del récord total (nunca 0-0-0).
 */
function heroFigures(gc: ComputedRecord, manual: ManualRecord) {
  const hasFights = gc.wins + gc.losses + gc.draws + gc.noContests > 0;
  if (hasFights) {
    return [
      { label: "KO/TKO", value: gc.winsBy.koTko, accent: true },
      { label: "Sumisión", value: gc.winsBy.submission },
      { label: "Victorias", value: gc.wins },
    ];
  }
  return [
    { label: "Victorias", value: manual.wins, accent: true },
    { label: "Derrotas", value: manual.losses },
    { label: "Empates", value: manual.draws },
  ];
}

export async function generateMetadata({ params, searchParams }: PageProps<"/peleadores/[slug]">): Promise<Metadata> {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const { fighter, isPreview } = await loadFighter(slug, previewParam(query.preview));
  if (!fighter) return { title: "Peleador no encontrado | Guerra Campal" };

  const name = `${fighter.firstName} ${fighter.lastName}`;
  return {
    title: `${name}${fighter.nickname ? ` «${fighter.nickname}»` : ""} | Guerra Campal`,
    description: `Ficha de ${name}, peleador de ${divisionTitle(fighter.division)} en Guerra Campal: récord, datos y redes.`,
    ...(isPreview ? { robots: { index: false, follow: false } } : {}),
  };
}

export default async function FighterPage({ params, searchParams }: PageProps<"/peleadores/[slug]">) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const { fighter, isPreview } = await loadFighter(slug, previewParam(query.preview));
  if (!fighter) notFound();

  const { proRecord } = fighter;
  const [{ computed, history, nextBout }, news] = await Promise.all([getCachedFighterBouts(fighter.id), getCachedPostsForFighter(fighter.id)]);
  return (
    <>
      <FighterHero fighter={fighter} figures={heroFigures(computed.pro, proRecord)} />
      <NextBout nextBout={nextBout} lastFight={history[0] ?? null} />
      <FighterInfo fighter={fighter} />
      <RecordSummary manual={{ pro: proRecord, amateur: fighter.amateurRecord }} computed={computed} />
      <div data-slot="fighter-history">
        <FightHistory rows={history} />
      </div>
      <FighterGallery media={fighter.gallery} name={`${fighter.firstName} ${fighter.lastName}`} />
      <div data-slot="fighter-news">
        <RelatedNewsRail posts={news} />
      </div>
      {isPreview ? <PreviewBanner /> : null}
    </>
  );
}
