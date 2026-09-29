import { expect, test, type Page } from "@playwright/test";

async function expectNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
}

const card = (page: Page, name: string) => page.getByRole("heading", { name, level: 2 });

test("filtrar por división muestra solo a los peleadores de esa división", async ({ page }) => {
  await page.goto("/peleadores?division=peso-ligero");
  await expect(page.getByRole("heading", { name: "Peleadores", level: 1 })).toBeVisible();
  await expect(card(page, "Matías Pérez")).toBeVisible();
  await expect(card(page, "Diego Soto")).toBeVisible();
  await expect(card(page, "Camila Rojas")).toHaveCount(0);
  await expect(card(page, "Ignacio Fuentes")).toHaveCount(0);
});

test("buscar por apodo, sin tildes ni mayúsculas, desde el buscador", async ({ page }) => {
  await page.goto("/peleadores");
  await page.getByRole("searchbox", { name: "Buscar" }).fill("LEONA");
  await expect(page).toHaveURL(/q=LEONA/);
  await expect(card(page, "Camila Rojas")).toBeVisible();
  await expect(card(page, "Matías Pérez")).toHaveCount(0);

  await page.goto("/peleadores?q=perez");
  await expect(card(page, "Matías Pérez")).toBeVisible();
});

test("por defecto solo se ven los activos; los retirados se piden con el filtro de estado", async ({ page }) => {
  await page.goto("/peleadores");
  await expect(card(page, "Matías Pérez")).toBeVisible();
  await expect(card(page, "Nicolás Ibarra")).toHaveCount(0);
  await page.goto("/peleadores?estado=retired");
  await expect(card(page, "Nicolás Ibarra")).toBeVisible();
  await expect(card(page, "Matías Pérez")).toHaveCount(0);
});

test("un peleador sin foto muestra la silueta de la marca", async ({ page }) => {
  await page.goto("/peleadores?q=camila");
  const cardArticle = page.getByRole("article").filter({ has: card(page, "Camila Rojas") });
  await expect(cardArticle.locator('[data-slot="fighter-silhouette"]')).toBeVisible();
  await expect(cardArticle.locator("img")).toHaveCount(0);
});

test("la tarjeta muestra nombre, apodo, país, división y récord", async ({ page }) => {
  await page.goto("/peleadores?q=toro");
  const cardArticle = page.getByRole("article").filter({ has: card(page, "Matías Pérez") });
  await expect(cardArticle.getByText("“El Toro”")).toBeVisible();
  await expect(cardArticle.getByRole("img", { name: "Chile" })).toBeVisible();
  await expect(cardArticle.getByText("Peso Ligero · 70.3 kg / 155 lb")).toBeVisible();
  await expect(cardArticle.locator('[data-count="12"]')).toHaveText("12");
  await expect(cardArticle.getByRole("link", { name: "Matías Pérez" })).toHaveAttribute("href", "/peleadores/matias-perez");
});

test("con «reducir movimiento» los récords se ven de inmediato", async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto("/peleadores?q=toro");
  await expect(page.locator('[data-count="12"]')).toHaveText("12");
  await context.close();
});

test("sin resultados muestra un mensaje y la salida para ver a todos", async ({ page }) => {
  await page.goto("/peleadores?q=zzzzzz");
  await expect(page.getByText("Sin resultados")).toBeVisible();
  await page.getByRole("link", { name: "Ver todos los peleadores" }).click();
  await expect(card(page, "Matías Pérez")).toBeVisible();
});

for (const width of [320, 375, 768, 1440]) {
  test(`sin scroll horizontal a ${width} px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/peleadores");
    await expect(card(page, "Matías Pérez")).toBeVisible();
    await expectNoHorizontalScroll(page);
  });
}
