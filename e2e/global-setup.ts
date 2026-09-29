import { execSync } from "node:child_process";
import { sql } from "drizzle-orm";
// playwright.config.ts ya apuntó DATABASE_URL a la BD de e2e antes de cargar este
// archivo, así que `@/db` se conecta a esa base y no a la de desarrollo.
import { db } from "@/db";
import { createAdminWithPassword } from "@/features/admin-users/accounts";
import { seedDivisions } from "@/features/divisions/seed";
import { seedFighters } from "@/features/fighters/seed";
import { auth } from "@/lib/auth";
import { SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD } from "./fixtures/admin";

async function waitForPostgres(): Promise<void> {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      execSync("docker compose exec -T postgres pg_isready -U postgres", { stdio: "ignore" });
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
  throw new Error("Postgres no respondió a tiempo para los e2e");
}

function ensureE2eDatabase(): void {
  const databaseName = new URL(process.env.DATABASE_URL ?? "").pathname.slice(1);
  const exists = execSync(
    `docker compose exec -T postgres psql -U postgres -tAc "SELECT 1 FROM pg_database WHERE datname = '${databaseName}'"`,
  )
    .toString()
    .trim();
  if (exists !== "1") {
    execSync(`docker compose exec -T postgres createdb -U postgres ${databaseName}`, { stdio: "inherit" });
  }
}

export default async function globalSetup(): Promise<void> {
  execSync("docker compose up -d", { stdio: "inherit" });
  await waitForPostgres();
  ensureE2eDatabase();
  execSync("pnpm db:migrate", { stdio: "inherit" });

  await db.execute(sql`TRUNCATE allowed_emails, "user", audit_log, verification, rate_limit, divisions, fighters CASCADE`);
  await seedDivisions(db);
  await seedFighters(db);
  await createAdminWithPassword(auth, db, SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD);
}
