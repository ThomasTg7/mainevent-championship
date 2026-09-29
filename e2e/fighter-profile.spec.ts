import { expect, test, type Page } from "@playwright/test";
import { signInAsAdmin } from "./fixtures/admin";

async function expectNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
}

test("la ficha de Matías Pérez muestra apodo, nombre, país, peso y récord manual", async ({ page }) => {
  const response = await page.goto("/peleadores/matias-perez");
  expect(response?.status()).toBe(200);

  await expect(page.getByRole("heading", { name: "Matías Pérez", level: 1 })).toBeVisible();
  await expect(page.getByText("“El Toro”")).toBeVisible();
  await expect(page.getByText("70.3 kg / 155 lb").first()).toBeVisible();
  await expect(page.getByRole("img", { name: "Chile" }).first()).toBeVisible();
  await expect(page.locator('[data-level="pro"]').getByText("12-2-0")).toBeVisible();
  await expect(page).toHaveTitle(/Matías Pérez/);
  // Un solo h1 por página.
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
});

test("sin foto muestra la silueta de la marca en el hero", async ({ page }) => {
  await page.goto("/peleadores/matias-perez");
  await expect(page.locator('section [data-slot="fighter-silhouette"]').first()).toBeVisible();
});

test("la bio breve va en la tarjeta y las pestañas son Datos y Redes", async ({ page }) => {
  await page.goto("/peleadores/matias-perez");
  await expect(page.getByText("Campeón peso ligero.")).toBeVisible();
  await expect(page.getByRole("tab", { name: "Bio" })).toHaveCount(0);

  // Datos se ve de entrada, sin pulsar nada.
  await expect(page.getByRole("tab", { name: "Datos" })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByText("Rancagua")).toBeVisible();
  await expect(page.getByText("180 cm / 5'11\"")).toBeVisible();
  await expect(page.getByText(/años \(nació el/)).toBeVisible();
  await expect(page.getByText("Ortodoxo")).toBeVisible();

  await page.getByRole("tab", { name: "Redes" }).click();
  await expect(page.getByText("Este peleador aún no comparte sus redes.")).toBeVisible();
  await expect(page.getByText("Rancagua")).toHaveCount(0);
  await page.getByRole("tab", { name: "Datos" }).click();
  await expect(page.getByText("Rancagua")).toBeVisible();
});

test("el récord muestra el total y el de Guerra Campal, con GC como abreviatura en el celular", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto("/peleadores/matias-perez");
  const pro = page.locator('[data-level="pro"]');
  await expect(pro.locator('[data-record="total"]')).toContainText("12-2-0");
  await expect(pro.locator('[data-record="gc"]')).toBeVisible();
  await expect(pro.getByText("GC", { exact: true })).toBeVisible();
  // En celular la etiqueta cabe en una línea (el nombre completo queda solo para lectores de pantalla).
  expect((await pro.locator('[data-record="gc"] p').first().boundingBox())?.height).toBeLessThan(24);
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(pro.getByText("Guerra Campal")).toBeVisible();
  await expect(pro.getByText("GC", { exact: true })).toBeHidden();
});

test("las cifras del hero traen su valor final aunque se pida reducir el movimiento", async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto("/peleadores/matias-perez");
  await expect(page.locator('section [data-count="12"]').first()).toHaveText("12");
  await expect(page.locator('section [data-count="2"]').first()).toHaveText("2");
  await context.close();
});

test("un enlace que no existe responde 404 con un mensaje útil", async ({ page }) => {
  const response = await page.goto("/peleadores/no-existe-nadie");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "Peleador no encontrado" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Ver peleadores" })).toBeVisible();
});

test("un borrador y un peleador en la papelera responden 404 y no están en el listado", async ({ page }) => {
  for (const slug of ["borrador-oculto", "papelera-oculta"]) {
    const response = await page.goto(`/peleadores/${slug}`);
    expect(response?.status()).toBe(404);
  }
  await page.goto("/peleadores?q=oculto");
  await expect(page.getByText("Sin resultados")).toBeVisible();
});

test("el borrador se ve con el enlace de vista previa del panel y sin él sigue oculto", async ({ page, context }) => {
  await signInAsAdmin(page);
  await page.goto("/admin/peleadores?q=borrador");
  await page.getByRole("link", { name: "Editar Borrador Oculto" }).click();
  await page.getByRole("tab", { name: "Publicación" }).click();

  const [preview] = await Promise.all([context.waitForEvent("page"), page.getByRole("button", { name: /Vista previa/ }).click()]);
  await preview.waitForLoadState();
  await expect(preview).toHaveURL(/\/peleadores\/borrador-oculto\?preview=/);
  await expect(preview.getByRole("heading", { name: "Borrador Oculto", level: 1 })).toBeVisible();
  await expect(preview.getByRole("status").filter({ hasText: "Vista previa" })).toBeVisible();
  await expect(preview.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);

  // El mismo enlace con el token alterado no abre nada.
  const tampered = preview.url().replace(/preview=([^.]+)\./, "preview=x$1.");
  expect((await page.goto(tampered))?.status()).toBe(404);
});

for (const width of [320, 375, 768, 1440]) {
  test(`la ficha no tiene scroll horizontal a ${width} px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/peleadores/matias-perez");
    await expect(page.getByRole("heading", { name: "Matías Pérez", level: 1 })).toBeVisible();
    await expectNoHorizontalScroll(page);
  });
}
