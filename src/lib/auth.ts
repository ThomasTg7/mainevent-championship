import { db } from "@/db";
import { getMailer } from "@/lib/mailer";
import { createAuth, type GoogleCredentials } from "./create-auth";

function googleCredentials(): GoogleCredentials | undefined {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  return clientId && clientSecret ? { clientId, clientSecret } : undefined;
}

const google = googleCredentials();

export const googleSignInEnabled = google !== undefined;

export const auth = createAuth({ db, mailer: getMailer(), google });
