"use server";

import { headers } from "next/headers";
import { db } from "@/db";
import { getSetting } from "@/features/settings/queries";
import { formList, formValues } from "@/lib/form-errors";
import { getMailer } from "@/lib/mailer";
import { hashIp } from "./rate-limit";
import { submitFighterApplication, submitSponsorship, type SubmitDeps, type SubmitResult } from "./service";

/** Lo que devuelven los formularios públicos: éxito, o los errores por campo y lo que la persona escribió (React vacía el formulario tras cada envío). */
export type PublicFormState = { ok?: true; errors?: Record<string, string>; values?: Record<string, string>; videoLinks?: string[] };

const SEND_FAILED = "No pudimos enviar tu mensaje. Inténtalo de nuevo en unos minutos.";

/** La dirección de quien envía: la primera de `x-forwarded-for` (la pone la plataforma) o `x-real-ip`. Se guarda solo su hash. */
async function clientIpHash(): Promise<string> {
  const requestHeaders = await headers();
  const ip = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() || requestHeaders.get("x-real-ip") || "desconocida";
  return hashIp(ip, process.env.BETTER_AUTH_SECRET ?? "");
}

async function deps(): Promise<SubmitDeps> {
  const [ipHash, contact] = await Promise.all([clientIpHash(), getSetting(db, "contact")]);
  return { db, mailer: getMailer(), notifyEmail: contact.notifyEmail, ipHash };
}

async function run(formData: FormData, submit: (context: SubmitDeps, input: Record<string, unknown>) => Promise<SubmitResult>): Promise<PublicFormState> {
  const input = { ...formValues(formData), videoLinks: formList(formData, "videoLinks") };
  try {
    const result = await submit(await deps(), input);
    if (result.ok) return { ok: true };
    return { errors: result.errors, values: formValues(formData), videoLinks: input.videoLinks };
  } catch (error) {
    console.error("Error al guardar un formulario público", error);
    return { errors: { form: SEND_FAILED }, values: formValues(formData), videoLinks: input.videoLinks };
  }
}

/** «Quiero pelear». Es una server action en un `<form action>`: funciona también sin JavaScript. */
export async function submitFighterApplicationAction(_previous: PublicFormState, formData: FormData): Promise<PublicFormState> {
  return run(formData, submitFighterApplication);
}

/** «Patrocinar». */
export async function submitSponsorshipAction(_previous: PublicFormState, formData: FormData): Promise<PublicFormState> {
  return run(formData, submitSponsorship);
}
