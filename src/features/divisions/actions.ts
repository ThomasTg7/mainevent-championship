"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { formValues, zodFieldErrors, type FormActionState } from "@/lib/form-errors";
import { requireAdmin } from "@/lib/require-admin";
import { UserFacingError } from "@/lib/user-facing-error";
import { divisionInputSchema, reorderDivisionsSchema, toggleDivisionSchema } from "./schema";
import { reorderDivisions, saveDivision, toggleDivision } from "./service";

const ADMIN_PATH = "/admin/divisiones";

async function run(task: () => Promise<string>): Promise<FormActionState> {
  try {
    const success = await task();
    revalidatePath(ADMIN_PATH);
    return { success };
  } catch (error) {
    if (error instanceof UserFacingError) return { error: error.message };
    console.error("Error en divisiones", error);
    return { error: "No se pudo completar la acción. Inténtalo de nuevo." };
  }
}

export async function saveDivisionAction(formData: FormData): Promise<FormActionState> {
  const admin = await requireAdmin();

  const parsed = divisionInputSchema.safeParse({
    id: formData.get("id") || undefined,
    name: formData.get("name"),
    gender: formData.get("gender"),
    limitKg: formData.get("limitKg") ? Number(formData.get("limitKg")) : undefined,
    rankingSlots: formData.get("rankingSlots") ? Number(formData.get("rankingSlots")) : undefined,
  });
  if (!parsed.success) {
    return { fieldErrors: zodFieldErrors(parsed.error), values: formValues(formData) };
  }

  const result = await run(async () => {
    await saveDivision(db, parsed.data, admin.userId);
    return "División guardada";
  });
  return result.error ? { ...result, values: formValues(formData) } : result;
}

export async function toggleDivisionAction(id: string, active: boolean): Promise<FormActionState> {
  const admin = await requireAdmin();
  const parsed = toggleDivisionSchema.safeParse({ id, active });
  if (!parsed.success) return { error: "Datos inválidos" };

  return run(async () => {
    await toggleDivision(db, parsed.data.id, parsed.data.active, admin.userId);
    return parsed.data.active ? "División activada" : "División desactivada";
  });
}

export async function reorderDivisionsAction(gender: string, orderedIds: string[]): Promise<FormActionState> {
  const admin = await requireAdmin();
  const parsed = reorderDivisionsSchema.safeParse({ gender, orderedIds });
  if (!parsed.success) return { error: "Datos inválidos" };

  return run(async () => {
    await reorderDivisions(db, parsed.data.gender, parsed.data.orderedIds, admin.userId);
    return "Orden guardado";
  });
}
