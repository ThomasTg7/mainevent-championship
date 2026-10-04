import { championWord } from "@/domain/rankings";
import type { RankingCardDTO } from "@/features/rankings/dto";

export const MAX_HIGHLIGHTS = 8;
const PER_DIVISION = 3;

export type Highlight = { id: string; badge: string; backdrop: string };

/**
 * Los peleadores destacados de la home salen de las tarjetas pro: de cada división, el campeón y los tres primeros del
 * ranking, sin repetir y hasta 8. El número es el que ya muestra `/rankings` (las tarjetas traen el puesto compactado): no
 * se recalcula. El libra por libra no aporta: sus puestos no son de división.
 */
export function pickHighlights(cards: RankingCardDTO[]): Highlight[] {
  const seen = new Set<string>();
  const picked: Highlight[] = [];
  const add = (id: string, badge: string, backdrop: string) => {
    if (picked.length >= MAX_HIGHLIGHTS || seen.has(id)) return;
    seen.add(id);
    picked.push({ id, badge, backdrop });
  };

  for (const card of cards) {
    if (!card.division) continue;
    if (card.champion) add(card.champion.id, championWord(card.division.gender), "C");
    for (const entry of card.entries.slice(0, PER_DIVISION)) add(entry.fighter.id, `#${entry.position}`, String(entry.position));
  }
  return picked;
}
