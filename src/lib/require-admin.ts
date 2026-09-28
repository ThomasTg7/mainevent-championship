import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { isEmailAllowed } from "@/features/admin-users/allowlist";
import { auth } from "./auth";

export async function requireAdmin(): Promise<{ userId: string; email: string }> {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/admin/login");
  }

  if (!(await isEmailAllowed(db, session.user.email))) {
    redirect("/admin/login");
  }

  return { userId: session.user.id, email: session.user.email };
}
