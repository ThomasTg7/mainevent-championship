import { db, type Db } from "@/db";
import { seedDivisions } from "@/features/divisions/seed";

export async function seed(db: Db): Promise<void> {
  await seedDivisions(db);
  // Cada plan agrega aquí su propio seedX(db).
}

seed(db)
  .then(() => {
    console.info("Seed completado");
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
