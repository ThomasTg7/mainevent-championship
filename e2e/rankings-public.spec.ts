import { expect, test, type Page } from "@playwright/test";

// Dependen del seed (`seedRankings`): ningún otro spec toca a Pérez, Soto ni la división Ligero.

async function expectNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
}

test("rankings: pestañas Pro y Amateur, libra por libra primero, campeón y puestos con su fecha", async ({ page }) => {
  await page.goto("/rankings");

  await expect(page.getByRole("heading", { level: 1, name: "Rankings" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Pro", exact: true })).toHaveAttribute("aria-current", "page");
  await expect(page.getByText(/^Actualizado \d/).first()).toBeVisible();

  // Libra por libra va primero, y cada división trae su campeón y sus puestos numerados.
  const cards = page.getByRole("article");
  await expect(cards.first()).toHaveAccessibleName("Ranking libra por libra");
  const ligero = page.getByRole("article", { name: "Ranking Peso Ligero" });
  await expect(ligero.getByText("★ Campeón")).toBeVisible();
  await expect(ligero.getByRole("link", { name: "Matías Pérez" })).toBeVisible();
  await expect(ligero.getByRole("listitem").nth(0)).toContainText("Diego Soto");
  await expect(ligero.getByRole("listitem").nth(1)).toContainText("Felipe Araya");
  // La primera versión: todos NUEVO.
  await expect(ligero.getByLabel("Nuevo en el ranking")).toHaveCount(2);

  await page.getByRole("link", { name: "Amateur", exact: true }).click();
  await expect(page).toHaveURL(/nivel=amateur/);
  const amateur = page.getByRole("article", { name: "Ranking Peso Paja fem." });
  await expect(amateur.getByRole("link", { name: "Valentina Cortés" }).first()).toBeVisible();
  await expect(amateur.getByRole("listitem")).toHaveCount(1);
  await expect(page.getByRole("article", { name: "Ranking Peso Ligero" })).toHaveCount(0);
});

test("rankings en el celular: sin scroll horizontal y la lista de puestos legible", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 375, height: 812 }, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  await page.goto("/rankings");
  await expect(page.getByRole("article", { name: "Ranking Peso Ligero" })).toBeVisible();
  await expectNoHorizontalScroll(page);
  await context.close();
});

test("la ficha del campeón muestra «Campeón pro · Peso Ligero» y su puesto libra por libra", async ({ page }) => {
  await page.goto("/peleadores/matias-perez");
  const tags = page.locator('[data-slot="fighter-tags"]');
  await expect(tags.getByText("Campeón pro · Peso Ligero")).toBeVisible();
  await expect(tags.getByText("#1 P4P")).toBeVisible();
});

test("la ficha de quien es campeón amateur y está rankeado muestra las tres etiquetas", async ({ page }) => {
  await page.goto("/peleadores/valentina-cortes");
  const tags = page.locator('[data-slot="fighter-tags"]');
  await expect(tags.getByText("Campeón amateur · Peso Paja fem.")).toBeVisible();
  await expect(tags.getByText("#1 Peso Paja fem.")).toBeVisible();
  await expect(tags.getByText("#5 P4P")).toBeVisible();
});

test("un peleador sin ranking no lleva etiquetas de ranking", async ({ page }) => {
  await page.goto("/peleadores/nicolas-ibarra");
  const tags = page.locator('[data-slot="fighter-tags"]');
  await expect(tags.getByText("Retirado")).toBeVisible();
  await expect(tags.getByText(/Campeón|^#\d/)).toHaveCount(0);
});

test("la cartelera de la pelea por el título muestra «C» y «#1» junto a cada peleador", async ({ page }) => {
  await page.goto("/eventos/guerra-campal-5");
  const ranks = page.locator('[data-slot="bout-rank"]');
  // Pérez (campeón, esquina roja) lleva «C» y Soto (el #1 de la división) lleva «#1»; los otros campeones de la cartelera también llevan «C».
  const withLabel = (name: string, label: RegExp) => page.locator("[data-corner]").filter({ hasText: name }).filter({ has: ranks.filter({ hasText: label }) });
  await expect(withLabel("Pérez", /^C$/)).toHaveCount(1);
  await expect(withLabel("Soto", /^#1$/)).toHaveCount(1);
});
