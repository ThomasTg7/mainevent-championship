import path from "node:path";
import { db } from "@/db";
import { seedMainevent } from "@/features/demo/mainevent-seed";
import { getStorage } from "@/lib/storage";

/**
 * Demo de Mainevent Championship (solo desarrollo). Los seeds genéricos de `src/features/*\/seed.ts` siguen siendo los
 * datos de las pruebas e2e (`e2e/global-setup.ts`).
 */
seedMainevent(db, { storage: getStorage(), assetsDir: path.join(process.cwd(), "scripts/demo-assets") })
  .then(() => {
    console.info("Seed de Mainevent completado");
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
