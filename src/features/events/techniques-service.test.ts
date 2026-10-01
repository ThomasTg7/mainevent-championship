import { asc, eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Db } from "@/db";
import { auditLog } from "@/db/schema/audit";
import { submissionTechniques } from "@/db/schema/events";
import { createTestDb } from "@/test/db";
import { listTechniques } from "./admin-queries";
import { addBout, saveSegment } from "./card-service";
import { seedSubmissionTechniques } from "./seed";
import { createEvent } from "./service";
import { deleteTechnique, reorderTechniques, saveTechnique } from "./techniques-service";
import { validEventInput } from "./test-helpers";
import { recordBoutResult } from "@/features/results/service";
import { createFighter } from "@/features/fighters/service";
import { divisionIdBySlug, validFighterInput } from "@/features/fighters/test-helpers";

let db: Db;
let close: () => Promise<void>;

beforeAll(async () => {
  ({ db, close } = await createTestDb());
  await seedSubmissionTechniques(db);
});
afterAll(() => close());

const MISSING = "00000000-0000-4000-8000-000000000000";
const names = async () => (await listTechniques(db)).map((technique) => technique.name);
const auditActions = async (id: string) => (await db.select().from(auditLog).where(eq(auditLog.entityId, id))).map((entry) => entry.action);

describe("saveTechnique", () => {
  it("adds a technique at the end of the catalog and audits it", async () => {
    const { id } = await saveTechnique(db, { name: "  Ezekiel  " }, "admin-1");
    expect((await names()).at(-1)).toBe("Ezekiel");
    expect(await auditActions(id)).toEqual(["create"]);
  });

  it("renames one, keeping its place", async () => {
    const before = await listTechniques(db);
    const target = before[2]!;
    await saveTechnique(db, { id: target.id, name: "Triángulo de brazo" }, "admin-1");
    const after = await listTechniques(db);
    expect(after.map((technique) => technique.id)).toEqual(before.map((technique) => technique.id));
    expect(after[2]!.name).toBe("Triángulo de brazo");
    expect(await auditActions(target.id)).toEqual(["update"]);
  });

  it("rejects an empty name, a name that already exists (ignoring case) and a missing technique", async () => {
    await expect(saveTechnique(db, { name: "   " }, "admin-1")).rejects.toThrow("Escribe el nombre de la técnica");
    await expect(saveTechnique(db, { name: "mataleón" }, "admin-1")).rejects.toThrow("Ya existe una técnica con ese nombre");
    await expect(saveTechnique(db, { id: MISSING, name: "Nueva" }, "admin-1")).rejects.toThrow("No se encontró la técnica");
    const [other] = await listTechniques(db);
    await expect(saveTechnique(db, { id: other!.id, name: "Kimura" }, "admin-1")).rejects.toThrow("Ya existe una técnica con ese nombre");
  });

  it("lets a technique keep its own name when it is saved again", async () => {
    const [first] = await listTechniques(db);
    await expect(saveTechnique(db, { id: first!.id, name: first!.name }, "admin-1")).resolves.toEqual({ id: first!.id });
  });
});

describe("reorderTechniques", () => {
  it("writes the new order", async () => {
    const before = (await listTechniques(db)).map((technique) => technique.id);
    const reversed = [...before].reverse();
    await reorderTechniques(db, reversed, "admin-1");
    expect((await listTechniques(db)).map((technique) => technique.id)).toEqual(reversed);
    const rows = await db.select({ sortOrder: submissionTechniques.sortOrder }).from(submissionTechniques).orderBy(asc(submissionTechniques.sortOrder));
    expect(rows.map((row) => row.sortOrder)).toEqual(rows.map((_, index) => index));
  });

  it("rejects a list that is not exactly the catalog", async () => {
    const ids = (await listTechniques(db)).map((technique) => technique.id);
    await expect(reorderTechniques(db, ids.slice(1), "admin-1")).rejects.toThrow("La lista de técnicas cambió");
    await expect(reorderTechniques(db, [...ids.slice(1), ids[1]!], "admin-1")).rejects.toThrow("La lista de técnicas cambió");
  });
});

describe("deleteTechnique", () => {
  it("deletes an unused technique and keeps the order contiguous", async () => {
    const { id } = await saveTechnique(db, { name: "Para borrar" }, "admin-1");
    await deleteTechnique(db, id, "admin-1");
    expect(await names()).not.toContain("Para borrar");
    const rows = await db.select({ sortOrder: submissionTechniques.sortOrder }).from(submissionTechniques).orderBy(asc(submissionTechniques.sortOrder));
    expect(rows.map((row) => row.sortOrder)).toEqual(rows.map((_, index) => index));
    expect(await auditActions(id)).toEqual(["create", "delete"]);
    await expect(deleteTechnique(db, id, "admin-1")).rejects.toThrow("No se encontró la técnica");
  });

  it("does not delete a technique used in a fight, and says how many", async () => {
    const ligero = await divisionIdBySlug(db, "peso-ligero");
    const [red, blue] = [
      (await createFighter(db, validFighterInput(ligero, { firstName: "Uno", lastName: "Técnico" }), "admin-1")).id,
      (await createFighter(db, validFighterInput(ligero, { firstName: "Dos", lastName: "Técnico" }), "admin-1")).id,
    ];
    const event = await createEvent(db, validEventInput({ name: "Con técnica" }), "admin-1");
    const segment = await saveSegment(db, event.id, { name: "Estelar" }, "admin-1");
    const bout = await addBout(db, segment.id, { redFighterId: red, blueFighterId: blue, divisionId: ligero }, "admin-1");
    const [technique] = await listTechniques(db);
    await recordBoutResult(db, bout.id, { outcome: "red_win", method: "submission", submissionTechniqueId: technique!.id, endRound: 1, endTimeSeconds: 90 }, "admin-1");

    await expect(deleteTechnique(db, technique!.id, "admin-1")).rejects.toThrow("Se usó en 1 pelea: no se puede eliminar");
    expect((await listTechniques(db)).find((row) => row.id === technique!.id)).toBeDefined();
  });
});
