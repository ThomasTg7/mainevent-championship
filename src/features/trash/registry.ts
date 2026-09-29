import { sql } from "drizzle-orm";
import { fighters } from "@/db/schema/fighters";
import type { TrashableEntity } from "./trash";

// Registro único de entidades con papelera. Vive en un solo archivo (y no en
// cada feature) para que la página de Papelera y el cron de purga vean todas
// las entidades aunque no importen sus módulos. Cada plan agrega la suya.
export const TRASHABLE_ENTITIES: TrashableEntity[] = [
  { type: "fighter", label: "Peleador", table: fighters, title: sql<string>`${fighters.firstName} || ' ' || ${fighters.lastName}` },
];
