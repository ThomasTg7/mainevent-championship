import { revalidateTag } from "next/cache";

/** Tag de los listados públicos (`/peleadores`, home). */
export const FIGHTERS_LIST_TAG = "fighters";

export function fighterCacheTag(id: string): string {
  return `fighter:${id}`;
}

/** Invalida la ficha del peleador y los listados donde aparece. Llamar desde toda action que escriba peleadores. */
export function revalidateFighter(id: string): void {
  revalidateTag(fighterCacheTag(id), "max");
  revalidateTag(FIGHTERS_LIST_TAG, "max");
}
