import { expect, test, type Page } from "@playwright/test";
import { adminUrl, signInAsAdmin } from "./fixtures/admin";

async function expectNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
}

const newsRegion = (page: Page) => page.getByRole("region", { name: "Noticias" });

test("la ficha de un peleador muestra el carrusel «Noticias» con sus noticias relacionadas", async ({ page }) => {
  await page.goto("/peleadores/matias-perez");
  const news = newsRegion(page);
  await expect(news).toBeVisible();
  await expect(news.getByRole("heading", { name: "Noticias", level: 2 })).toBeVisible();
  await expect(news.getByRole("link", { name: /Pérez defiende el cinturón ante Soto/ })).toBeVisible();
  await expect(news.getByRole("link", { name: /Un día en el campamento del campeón/ })).toBeVisible();
  // Una noticia de otro peleador no aparece.
  await expect(news.getByRole("link", { name: /Rojas: «Quiero defender el título/ })).toHaveCount(0);

  await news.getByRole("link", { name: /Pérez defiende el cinturón ante Soto/ }).click();
  await expect(page).toHaveURL(/\/noticias\/perez-defiende-el-cinturon-ante-soto$/);
});

test("un peleador sin noticias relacionadas no muestra la sección", async ({ page }) => {
  await page.goto("/peleadores/felipe-araya");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(newsRegion(page)).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Noticias", level: 2 })).toHaveCount(0);
});

test("la página de un evento muestra sus noticias relacionadas, y sin ninguna no muestra la sección", async ({ page }) => {
  await page.goto("/eventos/ofl-5");
  const news = newsRegion(page);
  await expect(news.getByRole("link", { name: /Cartelera completa de OFL 5 confirmada/ })).toBeVisible();
  await expect(news.getByRole("link", { name: /Entradas para OFL 5/ })).toBeVisible();

  await page.goto("/eventos/ofl-2");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(newsRegion(page)).toHaveCount(0);
});

test("el carrusel no desborda la página en celular ni en PC", async ({ page }) => {
  for (const size of [{ width: 320, height: 800 }, { width: 375, height: 800 }, { width: 1440, height: 900 }]) {
    await page.setViewportSize(size);
    for (const path of ["/peleadores/matias-perez", "/eventos/ofl-5"]) {
      await page.goto(path);
      await expect(newsRegion(page)).toBeVisible();
      await expectNoHorizontalScroll(page);
    }
  }
});

test("relacionar y quitar un peleador desde el panel actualiza su ficha al instante", async ({ page }) => {
  test.setTimeout(120_000);
  const title = `Noticia E2E relacionada ${Date.now()}`;

  // La ficha se visita antes para dejarla en caché: lo que cambie después debe verse por la invalidación, no por casualidad.
  await page.goto("/peleadores/martin-olivares");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(newsRegion(page)).toHaveCount(0);

  await signInAsAdmin(page);
  await page.goto(adminUrl("/noticias/nueva"));
  await page.getByLabel("Título", { exact: true }).fill(title);
  await page.getByLabel("Categoría").selectOption({ label: "Anuncios" });
  await page.getByRole("tab", { name: "Relacionados" }).click();
  const fighters = page.getByRole("group", { name: "Peleadores relacionados" });
  const result = fighters.getByRole("button", { name: /Martín Olivares/ }).first();
  // Si se escribe antes de que React hidrate el formulario, el texto se pierde: se reintenta hasta que aparezca el resultado.
  await expect(async () => {
    await fighters.getByRole("searchbox").fill("");
    await fighters.getByRole("searchbox").fill("Olivares");
    await expect(result).toBeVisible({ timeout: 5_000 });
  }).toPass({ timeout: 60_000 });
  await result.click();
  await page.getByRole("tab", { name: "Publicación" }).click();
  await page.getByRole("radio", { name: "Publicado" }).check();
  await page.getByRole("button", { name: "Crear noticia" }).click();
  await expect(page).toHaveURL(/\/noticias\/[0-9a-f-]+\?creada=1$/);
  const editUrl = page.url();

  await page.goto("/peleadores/martin-olivares");
  await expect(newsRegion(page).getByRole("link", { name: title })).toBeVisible();

  // Quitar la relación: también debe desaparecer de la ficha (se invalida lo de antes y lo de después).
  await page.goto(editUrl);
  await page.getByRole("tab", { name: "Relacionados" }).click();
  await page.getByRole("button", { name: "Quitar a Martín Olivares" }).click();
  await page.getByRole("button", { name: "Guardar cambios" }).click();
  await expect(page.getByText("Cambios guardados").first()).toBeVisible();

  await page.goto("/peleadores/martin-olivares");
  await expect(newsRegion(page)).toHaveCount(0);
});
