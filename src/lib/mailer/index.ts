import { createConsoleMailer } from "./console";
import { createResendMailer } from "./resend";
import type { Mailer } from "./types";

export type { Mailer, MailMessage } from "./types";

type MailerEnv = Record<string, string | undefined>;

export function getMailer(env: MailerEnv = process.env): Mailer {
  if (env.MAIL_DRIVER !== "resend") {
    return createConsoleMailer();
  }
  if (!env.RESEND_API_KEY || !env.MAIL_FROM) {
    throw new Error("MAIL_DRIVER=resend requiere RESEND_API_KEY y MAIL_FROM");
  }
  return createResendMailer({ apiKey: env.RESEND_API_KEY, from: env.MAIL_FROM });
}
