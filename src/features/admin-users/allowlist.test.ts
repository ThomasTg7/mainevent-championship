import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createTestDb } from "@/test/db";
import type { Db } from "@/db";
import { addAllowedEmail, isEmailAllowed, normalizeEmail, removeAllowedEmail } from "./allowlist";

describe("normalizeEmail", () => {
  it("trims whitespace and lowercases the email", () => {
    expect(normalizeEmail(" Admin@X.cl ")).toBe("admin@x.cl");
  });
});

describe("allowlist", () => {
  let testDb: Awaited<ReturnType<typeof createTestDb>>;
  let db: Db;

  beforeEach(async () => {
    testDb = await createTestDb();
    db = testDb.db;
  });

  afterEach(async () => {
    await testDb.close();
  });

  it("allows an email that was added, regardless of case or whitespace", async () => {
    await addAllowedEmail(db, "Admin@X.cl", null);

    expect(await isEmailAllowed(db, " admin@x.cl ")).toBe(true);
  });

  it("does not allow an email that was never added", async () => {
    expect(await isEmailAllowed(db, "nadie@x.cl")).toBe(false);
  });

  it("refuses to remove the last allowed email", async () => {
    await addAllowedEmail(db, "unico@x.cl", null);

    await expect(removeAllowedEmail(db, "unico@x.cl", null)).rejects.toThrow(
      "No se puede quitar el último administrador",
    );
  });
});
