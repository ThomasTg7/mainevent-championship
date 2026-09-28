import { APIError } from "better-auth/api";
import { eq } from "drizzle-orm";
import type { Db } from "@/db";
import { user as userTable } from "@/db/schema/auth";
import { isEmailAllowed } from "@/features/admin-users/allowlist";

const FORBIDDEN_MESSAGE = "Este correo no tiene acceso";

export function createAuthHooks(db: Db) {
  async function beforeUserCreate(user: { email: string }): Promise<void> {
    if (!(await isEmailAllowed(db, user.email))) {
      throw new APIError("FORBIDDEN", { message: FORBIDDEN_MESSAGE });
    }
  }

  async function beforeSessionCreate(session: { userId: string }): Promise<void> {
    const [row] = await db
      .select({ email: userTable.email })
      .from(userTable)
      .where(eq(userTable.id, session.userId));

    if (!row || !(await isEmailAllowed(db, row.email))) {
      throw new APIError("FORBIDDEN", { message: FORBIDDEN_MESSAGE });
    }
  }

  return { beforeUserCreate, beforeSessionCreate };
}
