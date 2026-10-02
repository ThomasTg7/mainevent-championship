import { execSync } from "node:child_process";
import { sql } from "drizzle-orm";
// playwright.config.ts ya apuntó DATABASE_URL a la BD de e2e antes de cargar este
// archivo, así que `@/db` se conecta a esa base y no a la de desarrollo.
import { db } from "@/db";
import { createAdminWithPassword } from "@/features/admin-users/accounts";
import { seedDivisions } from "@/features/divisions/seed";
import { seedEvents } from "@/features/events/seed";
import { createFighter, deleteFighter } from "@/features/fighters/service";
import { seedFighters } from "@/features/fighters/seed";
import { seedPosts } from "@/features/posts/seed";
import { daysAgo, insertPost } from "@/features/posts/test-helpers";
import { divisions } from "@/db/schema/divisions";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD } from "./fixtures/admin";
import { createE2eCard } from "./fixtures/events";

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

  await db.execute(sql`TRUNCATE allowed_emails, "user", audit_log, verification, rate_limit, divisions, fighters, events, submission_techniques, posts, post_categories CASCADE`);
  await seedDivisions(db);
  await seedFighters(db);
  await seedEvents(db);
  await seedPosts(db);
  await seedPaginationPosts();
  await seedHiddenFighters();
  await seedCardFighters();
  await seedSoldOutTicketsEvent();
  await createAdminWithPassword(auth, db, SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD);
}

/**
 * Un próximo evento con un tramo agotado, para `/entradas`. Va aquí (antes de la primera visita) y no dentro del spec: la
 * lista de próximos está en caché 5 min y un evento creado directo en la base, sin pasar por una action, no la invalida.
 */
async function seedSoldOutTicketsEvent(): Promise<void> {
  await createE2eCard(
    "Evento E2E Entradas Agotadas",
    { "Cartelera estelar": [["uno", "dos"]] },
    {
      startsDate: "2031-10-04",
      ticketUrl: "https://tickets.example.cl/agotadas",
      ticketTiers: [
        { name: "General", description: "Galería", priceClp: 12000, soldOut: false },
        { name: "VIP", description: "Palco", priceClp: 90000, soldOut: true },
      ],
      ticketPoints: "Solo en la ticketera",
    },
  );
}

/** Un borrador y uno en la papelera: las pruebas del sitio público comprueban que nunca se ven. */
async function seedHiddenFighters(): Promise<void> {
  const [ligero] = await db.select({ id: divisions.id }).from(divisions).where(eq(divisions.slug, "peso-ligero"));
  if (!ligero) throw new Error("Falta la división Ligero");
  const base = { gender: "male", nationality: "CL", divisionId: ligero.id } as const;
  await createFighter(db, { ...base, firstName: "Borrador", lastName: "Oculto" }, "e2e");
  const trashed = await createFighter(db, { ...base, firstName: "Papelera", lastName: "Oculta", status: "published" }, "e2e");
  await deleteFighter(db, trashed.id, "e2e");
}

/**
 * Peleadores en borrador para armar carteleras en los e2e del panel: no salen en el sitio público (ni cambian el récord ni
 * el historial de los del seed) y el buscador del armador los encuentra por «Cartel Uno», «Cartel Dos»…
 */
async function seedCardFighters(): Promise<void> {
  const [ligero] = await db.select({ id: divisions.id }).from(divisions).where(eq(divisions.slug, "peso-ligero"));
  if (!ligero) throw new Error("Falta la división Ligero");
  for (const lastName of ["Uno", "Dos", "Tres", "Cuatro", "Cinco", "Seis", "Siete", "Ocho"]) {
    await createFighter(db, { gender: "male", nationality: "CL", divisionId: ligero.id, firstName: "Cartel", lastName }, "e2e");
  }
}

/** Cuatro noticias más viejas que las del seed: juntas pasan de 12 y la lista tiene segunda página. Van aquí por la caché del listado. */
async function seedPaginationPosts(): Promise<void> {
  for (let index = 1; index <= 4; index += 1) {
    await insertPost(db, { slug: `relleno-e2e-${index}`, title: `Relleno E2E ${index}`, createdAt: daysAgo(40 + index) });
  }
}
