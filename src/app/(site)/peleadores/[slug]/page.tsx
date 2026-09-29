import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { db } from "@/db";
import { getCachedPublicFighter } from "@/features/fighters/cached-queries";
import { FighterHero } from "@/features/fighters/components/fighter-hero";
import { FighterInfo } from "@/features/fighters/components/fighter-info";
import { PreviewBanner } from "@/features/fighters/components/preview-banner";
import { RecordSummary } from "@/features/fighters/components/record-summary";
import { divisionTitle } from "@/features/fighters/labels";
import { getPublicFighterBySlug } from "@/features/fighters/queries";
import { verifyPreviewToken } from "@/features/publication/preview";

/**
 * Con un token de vista previa válido para este peleador se muestra aunque sea borrador (sin caché);
 * en cualquier otro caso, solo si es público ahora. Se comparte entre la página y `generateMetadata`.
 */
const loadFighter = cache(async (slug: string, previewToken: string | undefined) => {
  if (previewToken) {
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
  return (
    <>
      <FighterHero
        fighter={fighter}
        // Con el récord calculado (Plan 03) estas cifras pasan a ser KO/TKO, sumisiones y victorias totales.
        figures={[
          { label: "Victorias", value: proRecord.wins, accent: true },
          { label: "Derrotas", value: proRecord.losses },
          { label: "Empates", value: proRecord.draws },
        ]}
      />
      <RecordSummary manual={{ pro: proRecord, amateur: fighter.amateurRecord }} />
      {/* Huecos para lo que suman los planes siguientes: historial de peleas (03) y noticias relacionadas (04). */}
      <div data-slot="fighter-history" />
      <FighterInfo fighter={fighter} />
      <div data-slot="fighter-news" />
      {isPreview ? <PreviewBanner /> : null}
    </>
  );
}
