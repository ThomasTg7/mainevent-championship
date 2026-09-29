"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { requireAdmin } from "@/lib/require-admin";
import { restore } from "./trash";

const restoreSchema = z.object({
  entityType: z.string().min(1),
  id: z.string().min(1),
});

export async function restoreAction(entityType: string, id: string): Promise<{ error?: string }> {
  const admin = await requireAdmin();

  const parsed = restoreSchema.safeParse({ entityType, id });
  if (!parsed.success) {
    return { error: "Datos inválidos" };
  }

  try {
    await restore(db, parsed.data.entityType, parsed.data.id, admin.userId);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "No se pudo restaurar" };
  }

  revalidatePath("/admin/papelera");
  return {};
}
