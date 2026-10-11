import { readFile } from "node:fs/promises";
import { sql } from "drizzle-orm";
import { db } from "@/db";

async function main() {
  const filename = process.argv.includes("--rollback") ? "ofl-content-rollback.sql" : "ofl-content.sql";
  const statement = await readFile(new URL(filename, import.meta.url), "utf8");
  await db.transaction(async (tx) => {
    for (const step of statement.split("-- statement-breakpoint")) await tx.execute(sql.raw(step));
  });
  console.info("Actualización de contenido completada; cambios registrados en auditoría.");
}

main().then(() => process.exit(0)).catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
