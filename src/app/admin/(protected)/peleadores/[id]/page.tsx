import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminPage } from "@/components/admin/admin-page";
import { db } from "@/db";
import { listCountries } from "@/domain/countries";
import { listDivisions } from "@/features/divisions/queries";
import { createFighterPreviewLinkAction, updateFighterAction } from "@/features/fighters/actions";
import { FighterForm } from "@/features/fighters/components/fighter-form";
import { fighterToFormValues } from "@/features/fighters/form-values";
import { getFighterForEdit } from "@/features/fighters/queries";
import { requireAdmin } from "@/lib/require-admin";

export const metadata: Metadata = { title: "Editar peleador" };

export default async function AdminEditarPeleadorPage({ params, searchParams }: PageProps<"/admin/peleadores/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const [edit, divisions, query] = await Promise.all([getFighterForEdit(db, id), listDivisions(db), searchParams]);
  if (!edit) notFound();

  const { fighter, bodyMedia, headshotMedia } = edit;
  return (
    <AdminPage title={`${fighter.firstName} ${fighter.lastName}`}>
      <FighterForm
        action={updateFighterAction.bind(null, fighter.id)}
        defaults={fighterToFormValues(fighter)}
        divisions={divisions}
        countries={listCountries()}
        bodyMedia={bodyMedia}
        headshotMedia={headshotMedia}
        publication={{ status: fighter.status, publishAt: fighter.publishAt }}
        previewHref={createFighterPreviewLinkAction.bind(null, fighter.id)}
        isEdit
        justCreated={query.creado === "1"}
      />
    </AdminPage>
  );
}
