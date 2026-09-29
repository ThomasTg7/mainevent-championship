import type { TrashableEntity } from "./trash";

// Registro único de entidades con papelera. Vive en un solo archivo (y no en
// cada feature) para que la página de Papelera y el cron de purga vean todas
// las entidades aunque no importen sus módulos. Cada plan agrega la suya, p. ej.:
// { type: "fighter", label: "Peleador", table: fighters, title: sql`${fighters.firstName} || ' ' || ${fighters.lastName}` }
export const TRASHABLE_ENTITIES: TrashableEntity[] = [];
