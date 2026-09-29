"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { formValues, zodFieldErrors, type FormActionState } from "@/lib/form-errors";
import { requireAdmin } from "@/lib/require-admin";
import { adminPath, publicUrl } from "@/lib/site-urls";
import { runFormAction } from "@/lib/run-form-action";
import { publicationInputSchema } from "@/features/publication/schema";
import { createPreviewToken } from "@/features/publication/preview";
import { revalidateFighter } from "./cache";
import { getFighterSlug } from "./queries";
import { fighterIdSchema, fighterInputSchema } from "./schema";
import { createFighter, deleteFighter, setFighterPublication, updateFighter } from "./service";

/** Carpeta del listado en `src/app` (para `revalidatePath`); en el navegador es `adminPath("/peleadores")`. */
const ADMIN_PATH = "/admin/peleadores";
const NOT_FOUND: FormActionState = { error: "No se encontró al peleador" };

const isFighterId = (id: unknown): id is string => fighterIdSchema.safeParse(id).success;

const run = (task: () => Promise<FormActionState | void>, formData?: FormData) => runFormAction("Error en peleadores", task, formData);

/** Valida en el servidor para devolver un error por campo; el servicio vuelve a validar. */
function invalidForm(formData: FormData): FormActionState | null {
  const parsed = fighterInputSchema.safeParse(formValues(formData));
  return parsed.success ? null : { fieldErrors: zodFieldErrors(parsed.error), values: formValues(formData) };
}

export async function createFighterAction(_previous: FormActionState, formData: FormData): Promise<FormActionState> {
  const admin = await requireAdmin();
  const invalid = invalidForm(formData);
  if (invalid) return invalid;

  let createdId: string | undefined;
  const result = await run(async () => {
    const created = await createFighter(db, formValues(formData), admin.userId);
    createdId = created.id;
    revalidateFighter(created.id);
    revalidatePath(ADMIN_PATH);
  }, formData);
  return createdId ? { redirectTo: adminPath(`/peleadores/${createdId}?creado=1`) } : result;
}

export async function updateFighterAction(id: string, _previous: FormActionState, formData: FormData): Promise<FormActionState> {
  const admin = await requireAdmin();
  if (!isFighterId(id)) return NOT_FOUND;
  const invalid = invalidForm(formData);
  if (invalid) return invalid;

  return run(async () => {
    await updateFighter(db, id, formValues(formData), admin.userId);
    revalidateFighter(id);
    revalidatePath(ADMIN_PATH);
    return { success: "Cambios guardados" };
  }, formData);
}

export async function setFighterPublicationAction(id: string, input: unknown): Promise<FormActionState> {
  const admin = await requireAdmin();
  if (!isFighterId(id)) return NOT_FOUND;
  const parsed = publicationInputSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  return run(async () => {
    await setFighterPublication(db, id, parsed.data, admin.userId);
    revalidateFighter(id);
    revalidatePath(ADMIN_PATH);
    return { success: parsed.data.status === "published" ? "Peleador publicado" : "Publicación actualizada" };
  });
}

export async function deleteFighterAction(id: string): Promise<FormActionState> {
  const admin = await requireAdmin();
  if (!isFighterId(id)) return NOT_FOUND;
  return run(async () => {
    await deleteFighter(db, id, admin.userId);
    revalidateFighter(id);
    revalidatePath(ADMIN_PATH);
    revalidatePath("/admin/papelera");
    return { success: "Enviado a la papelera" };
  });
}

/** Enlace de vista previa del peleador (borrador incluido), válido 1 hora. Se pide al hacer clic para que no caduque. */
export async function createFighterPreviewLinkAction(id: string): Promise<string | null> {
  await requireAdmin();
  if (!isFighterId(id)) return null;
  const slug = await getFighterSlug(db, id);
  // Absoluto: el panel está en otro dominio que la ficha pública.
  return slug ? publicUrl(`/peleadores/${slug}?preview=${createPreviewToken("fighter", id)}`) : null;
}
