"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { requireAdmin } from "@/lib/require-admin";
import { logAudit } from "@/features/audit/log";
import { addAllowedEmail, removeAllowedEmail } from "./allowlist";
import { allowedEmailSchema } from "./schema";

export type AllowedEmailActionState = { error?: string };

export async function addAllowedEmailAction(formData: FormData): Promise<AllowedEmailActionState> {
  const admin = await requireAdmin();

  const parsed = allowedEmailSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Correo inválido" };
  }

  await addAllowedEmail(db, parsed.data.email, admin.userId);
  await logAudit(db, {
    actorId: admin.userId,
    action: "create",
    entityType: "allowed_email",
    entityId: parsed.data.email,
    summary: `Se agregó ${parsed.data.email} a la lista blanca`,
  });

  revalidatePath("/admin/usuarios");
  return {};
}

export async function removeAllowedEmailAction(email: string): Promise<AllowedEmailActionState> {
  const admin = await requireAdmin();

  const parsed = allowedEmailSchema.safeParse({ email });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Correo inválido" };
  }

  try {
    await removeAllowedEmail(db, parsed.data.email, admin.userId);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "No se pudo quitar el correo" };
  }

  await logAudit(db, {
    actorId: admin.userId,
    action: "delete",
    entityType: "allowed_email",
    entityId: parsed.data.email,
    summary: `Se quitó ${parsed.data.email} de la lista blanca`,
  });

  revalidatePath("/admin/usuarios");
  return {};
}
