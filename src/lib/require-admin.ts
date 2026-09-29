import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "@/db";
import { isEmailAllowed } from "@/features/admin-users/allowlist";
import { auth } from "./auth";

export type AdminIdentity = { userId: string; email: string };

// `cache` evita repetir la consulta de sesión + lista blanca cuando el layout,
// la página y las server actions de un mismo request llaman a requireAdmin().
export const getAdmin = cache(async (): Promise<AdminIdentity | null> => {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session || !(await isEmailAllowed(db, session.user.email))) {
    return null;
  }

  return { userId: session.user.id, email: session.user.email };
});

export async function requireAdmin(): Promise<AdminIdentity> {
  const admin = await getAdmin();

  if (!admin) {
    redirect("/admin/login");
  }

  return admin;
}
