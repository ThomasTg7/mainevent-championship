import { execSync } from "node:child_process";
import { db } from "@/db";
import { addAllowedEmail } from "@/features/admin-users/allowlist";
import { auth } from "@/lib/auth";

export const SEED_ADMIN_EMAIL = "seed-admin@guerracampal.cl";
export const SEED_ADMIN_PASSWORD = "SeedPassword123!";

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

export default async function globalSetup(): Promise<void> {
  execSync("docker compose up -d", { stdio: "inherit" });
  await waitForPostgres();
  execSync("pnpm db:migrate", { stdio: "inherit" });

  await addAllowedEmail(db, SEED_ADMIN_EMAIL, null);

  try {
    await auth.api.signUpEmail({
      body: { email: SEED_ADMIN_EMAIL, password: SEED_ADMIN_PASSWORD, name: SEED_ADMIN_EMAIL },
    });
  } catch {
    // El admin de prueba ya existe de una corrida anterior; no es un error.
  }
}
