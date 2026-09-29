import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { Db } from "@/db";
import * as mediaQueries from "@/features/media/queries";
import { createTestDb } from "@/test/db";
import { getFighterForEdit, getPublicFighterBySlug, listAdminFighters, listPublicFighters } from "./queries";
import type { FighterFilters } from "./schema";
import { createFighter, deleteFighter, setFighterPublication } from "./service";
import { divisionIdBySlug, insertMedia, validFighterInput } from "./test-helpers";

vi.mock("@/features/media/queries", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/media/queries")>();
  return { ...actual, getMediaByIds: vi.fn(actual.getMediaByIds) };
});

let db: Db;
let close: () => Promise<void>;
let ids: { matias: string; diego: string; camila: string; draft: string; trashed: string };
let bodyMediaId: string;

async function publish(id: string) {
  await setFighterPublication(db, id, { status: "published", publishAt: null }, "admin-1");
}

beforeAll(async () => {
  ({ db, close } = await createTestDb());
  const ligero = await divisionIdBySlug(db, "peso-ligero");
  const paja = await divisionIdBySlug(db, "peso-paja-femenino");
  bodyMediaId = await insertMedia(db, "fighter_body");
  const headshot = await insertMedia(db, "fighter_headshot");

  const matias = await createFighter(
    db,
    validFighterInput(ligero, { proWins: 12, proLosses: 2, weightKg: 70.3, bodyMediaId, headshotMediaId: headshot }),
    "admin-1",
  );
  const diego = await createFighter(
    db,
    validFighterInput(ligero, { firstName: "Diego", lastName: "Soto", nickname: "La Sombra", nationality: "AR", bodyMediaId }),
    "admin-1",
  );
  const camila = await createFighter(
    db,
    validFighterInput(paja, { firstName: "Camila", lastName: "Rojas", nickname: "La Leona", gender: "female" }),
    "admin-1",
  );
  const draft = await createFighter(db, validFighterInput(ligero, { firstName: "Borrador", lastName: "Oculto" }), "admin-1");
  const trashed = await createFighter(db, validFighterInput(ligero, { firstName: "Papelera", lastName: "Oculta" }), "admin-1");
  await Promise.all([matias.id, diego.id, camila.id, trashed.id].map(publish));
  await deleteFighter(db, trashed.id, "admin-1");
  ids = { matias: matias.id, diego: diego.id, camila: camila.id, draft: draft.id, trashed: trashed.id };
});
afterAll(() => close());

async function listItems(filters: FighterFilters, options?: { preview?: boolean }) {
  return (await listPublicFighters(db, filters, options)).items;
}

const names = (list: { firstName: string }[]) => list.map((fighter) => fighter.firstName).sort();

describe("listPublicFighters", () => {
  it("finds a fighter ignoring accents and case, by last name or nickname", async () => {
    expect(names(await listItems({ q: "perez" }))).toEqual(["Matías"]);
    expect(names(await listItems({ q: "PÉREZ" }))).toEqual(["Matías"]);
    expect(names(await listItems({ q: "TORO" }))).toEqual(["Matías"]);
    expect(names(await listItems({ q: "leona" }))).toEqual(["Camila"]);
    expect(names(await listItems({ q: "matias toro" }))).toEqual(["Matías"]);
  });

  it("treats LIKE wildcards in the search as plain text", async () => {
    expect(await listItems({ q: "%" })).toEqual([]);
    expect(await listItems({ q: "_" })).toEqual([]);
  });

  it("never lists drafts or trashed fighters", async () => {
    expect(names(await listItems({}))).toEqual(["Camila", "Diego", "Matías"]);
  });

  it("combines division and nationality filters with AND", async () => {
    expect(names(await listItems({ division: "peso-ligero" }))).toEqual(["Diego", "Matías"]);
    expect(names(await listItems({ division: "peso-ligero", nationality: "AR" }))).toEqual(["Diego"]);
    expect(await listItems({ division: "peso-paja-femenino", nationality: "AR" })).toEqual([]);
  });

  it("filters by gender and career status", async () => {
    expect(names(await listItems({ gender: "female" }))).toEqual(["Camila"]);
    expect(await listItems({ status: "retired" })).toEqual([]);
    expect(await listItems({ status: "active" })).toHaveLength(3);
  });

  it("returns card data with the division and the pro manual record", async () => {
    const [matias] = await listItems({ q: "matias" });
    expect(matias).toMatchObject({
      slug: "matias-perez",
      nickname: "El Toro",
      nationality: "CL",
      division: { name: "Ligero", slug: "peso-ligero", limitKg: 70.3 },
      record: { wins: 12, losses: 2, draws: 0 },
    });
  });

  it("loads the photos of the whole page with a single media query", async () => {
    vi.mocked(mediaQueries.getMediaByIds).mockClear();
    const list = await listItems({});
    expect(mediaQueries.getMediaByIds).toHaveBeenCalledTimes(1);
    expect(list.find((fighter) => fighter.firstName === "Matías")?.bodyMedia?.id).toBe(bodyMediaId);
    expect(list.find((fighter) => fighter.firstName === "Diego")?.bodyMedia?.id).toBe(bodyMediaId);
    expect(list.find((fighter) => fighter.firstName === "Camila")?.bodyMedia).toBeNull();
  });
});

describe("getPublicFighterBySlug", () => {
  it("returns the full profile with both photos", async () => {
    const profile = await getPublicFighterBySlug(db, "matias-perez");
    expect(profile).toMatchObject({ firstName: "Matías", weightKg: 70.3, proRecord: { wins: 12, losses: 2, draws: 0, noContests: 0 } });
    expect(profile?.bodyMedia?.id).toBe(bodyMediaId);
    expect(profile?.headshotMedia).not.toBeNull();
  });

  it("returns null for drafts, trashed fighters and unknown slugs", async () => {
    expect(await getPublicFighterBySlug(db, "borrador-oculto")).toBeNull();
    expect(await getPublicFighterBySlug(db, "papelera-oculta")).toBeNull();
    expect(await getPublicFighterBySlug(db, "no-existe")).toBeNull();
  });

  it("returns a draft when previewing", async () => {
    expect((await getPublicFighterBySlug(db, "borrador-oculto", { preview: true }))?.firstName).toBe("Borrador");
  });

  it("hides a scheduled fighter until its date", async () => {
    const ligero = await divisionIdBySlug(db, "peso-ligero");
    const { id } = await createFighter(db, validFighterInput(ligero, { firstName: "Futuro", lastName: "Estrella" }), "admin-1");
    await setFighterPublication(db, id, { status: "scheduled", publishAt: new Date(Date.now() + 86_400_000) }, "admin-1");
    expect(await getPublicFighterBySlug(db, "futuro-estrella")).toBeNull();
    await setFighterPublication(db, id, { status: "scheduled", publishAt: new Date(Date.now() - 1000) }, "admin-1");
    expect((await getPublicFighterBySlug(db, "futuro-estrella"))?.firstName).toBe("Futuro");
  });
});

describe("listAdminFighters", () => {
  it("lists drafts too but not trashed fighters, paginated with hasMore", async () => {
    const all = await listAdminFighters(db, {});
    expect(all.items.map((fighter) => fighter.id)).toContain(ids.draft);
    expect(all.items.map((fighter) => fighter.id)).not.toContain(ids.trashed);
    expect(all.hasMore).toBe(false);

    const firstPage = await listAdminFighters(db, {}, { pageSize: 2 });
    expect(firstPage.items).toHaveLength(2);
    expect(firstPage.hasMore).toBe(true);
    const secondPage = await listAdminFighters(db, {}, { page: 2, pageSize: 2 });
    expect(secondPage.items.length).toBeGreaterThan(0);
    expect(secondPage.items.map((fighter) => fighter.id)).not.toContain(firstPage.items[0]?.id);
  });

  it("filters by publication status and searches like the public list", async () => {
    const drafts = await listAdminFighters(db, { publication: "draft" });
    expect(drafts.items.every((fighter) => fighter.status === "draft")).toBe(true);
    expect((await listAdminFighters(db, { q: "BORRADOR" })).items.map((fighter) => fighter.id)).toEqual([ids.draft]);
  });
});

describe("getFighterForEdit", () => {
  it("returns raw columns and both images, regardless of publication", async () => {
    const edit = await getFighterForEdit(db, ids.matias);
    expect(edit?.fighter.slug).toBe("matias-perez");
    expect(edit?.bodyMedia?.id).toBe(bodyMediaId);
    expect(await getFighterForEdit(db, ids.draft)).not.toBeNull();
    expect(await getFighterForEdit(db, "00000000-0000-4000-8000-000000000000")).toBeNull();
  });
});
