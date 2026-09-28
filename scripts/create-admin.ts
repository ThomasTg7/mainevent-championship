import { db } from "@/db";
import { addAllowedEmail, normalizeEmail } from "@/features/admin-users/allowlist";
import { auth } from "@/lib/auth";

async function main() {
  const [, , emailArg, passwordArg] = process.argv;

  if (!emailArg || !passwordArg) {
    console.error("Uso: pnpm tsx scripts/create-admin.ts <email> <password>");
    process.exit(1);
  }

  const email = normalizeEmail(emailArg);

  await addAllowedEmail(db, email, null);

  await auth.api.signUpEmail({
    body: { email, password: passwordArg, name: email },
  });

  console.info(`Administrador creado: ${email}`);
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
