import { updateTag } from "next/cache";

/** Tag de los listados públicos (`/peleadores`, home). */
export const FIGHTERS_LIST_TAG = "fighters";

export function fighterCacheTag(id: string): string {
  return `fighter:${id}`;
}

/**
 * Expira al instante la ficha del peleador y los listados donde aparece. Solo desde server actions: `updateTag`
 * (a diferencia de `revalidateTag`) no sirve contenido viejo ni una vez, y enviar a la papelera debe ocultarlo ya.
 */
export function revalidateFighter(id: string): void {
  updateTag(fighterCacheTag(id));
  updateTag(FIGHTERS_LIST_TAG);
}
