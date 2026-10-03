import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Db } from "@/db";
import { createTestDb } from "@/test/db";
import { setChampion } from "./service";
import { divisionIdBySlug, insertRankableFighter } from "./test-helpers";
import { describeTitleChange } from "./title-change";

let db: Db;
let close: () => Promise<void>;
let ligero: string;

beforeAll(async () => {
  ({ db, close } = await createTestDb());
  ligero = await divisionIdBySlug(db, "peso-ligero");
});
afterAll(() => close());

describe("describeTitleChange", () => {
  it("names the new champion, the division and the current champion", async () => {
    const [champion, challenger] = [
      await insertRankableFighter(db, ligero, { firstName: "Matías", lastName: "Pérez" }),
      await insertRankableFighter(db, ligero, { firstName: "Diego", lastName: "Soto" }),
    ];
    await setChampion(db, "pro", ligero, champion, "admin-1");

    const prompt = await describeTitleChange(db, { divisionId: ligero, level: "pro", newChampionId: challenger });

    expect(prompt).toEqual({
      candidate: { divisionId: ligero, level: "pro", newChampionId: challenger },
      newChampionName: "Diego Soto",
      divisionLabel: "Peso Ligero",
      currentChampionName: "Matías Pérez",
    });
  });

  it("returns null when the stored champion is already that fighter (a later correction does not repeat the prompt)", async () => {
    const fighter = await insertRankableFighter(db, ligero);
    await setChampion(db, "pro", ligero, fighter, "admin-1");
    expect(await describeTitleChange(db, { divisionId: ligero, level: "pro", newChampionId: fighter })).toBeNull();
  });

  it("has no current champion for a vacant title", async () => {
    const medio = await divisionIdBySlug(db, "peso-medio");
    const challenger = await insertRankableFighter(db, medio, { firstName: "Ana", lastName: "Lopez" });
    const prompt = await describeTitleChange(db, { divisionId: medio, level: "pro", newChampionId: challenger });
    expect(prompt?.currentChampionName).toBeNull();
  });

  it("returns null when the fighter or the division no longer exists", async () => {
    expect(await describeTitleChange(db, { divisionId: ligero, level: "pro", newChampionId: "00000000-0000-4000-8000-000000000000" })).toBeNull();
  });
});
