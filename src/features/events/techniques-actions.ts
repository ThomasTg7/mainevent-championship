"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import type { FormActionState } from "@/lib/form-errors";
import { requireAdmin } from "@/lib/require-admin";
import { runFormAction } from "@/lib/run-form-action";
import { revalidateTechniques } from "./cache";
import { deleteTechnique, reorderTechniques, saveTechnique, type TechniqueInput } from "./techniques-service";

const NOT_FOUND: FormActionState = { error: "No se encontró la técnica" };

const run = (task: () => Promise<FormActionState | void>) => runFormAction("Error en las técnicas de sumisión", task);

function refresh(): void {
  revalidateTechniques();
  revalidatePath("/admin/eventos/tecnicas");
}

export async function saveTechniqueAction(input: TechniqueInput): Promise<FormActionState> {
  const admin = await requireAdmin();
  return run(async () => {
    await saveTechnique(db, input, admin.userId);
    refresh();
    return { success: "Técnica guardada" };
  });
}

export async function reorderTechniquesAction(ids: string[]): Promise<FormActionState> {
  const admin = await requireAdmin();
  const parsed = z.array(z.uuid()).safeParse(ids);
  if (!parsed.success) return { error: "La lista de técnicas cambió: recarga la página e inténtalo de nuevo" };
  return run(async () => {
    await reorderTechniques(db, parsed.data, admin.userId);
    refresh();
    return { success: "Orden guardado" };
  });
}

export async function deleteTechniqueAction(id: string): Promise<FormActionState> {
  const admin = await requireAdmin();
  if (!z.uuid().safeParse(id).success) return NOT_FOUND;
  return run(async () => {
    await deleteTechnique(db, id, admin.userId);
    refresh();
    return { success: "Técnica eliminada" };
  });
}
