import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import * as schema from "@/db/schema";
import type { Db } from "@/db";

export async function createTestDb(): Promise<{ db: Db; close(): Promise<void> }> {
  const client = new PGlite();
  const db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder: "./drizzle" });

  return {
    // PGlite implementa el mismo dialecto Postgres que postgres.js; se
    // castea a Db porque drizzle tipa cada driver con su propio HKT.
    db: db as unknown as Db,
    close: () => client.close(),
  };
}
