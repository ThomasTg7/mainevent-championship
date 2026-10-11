import { expect, test } from "@playwright/test";

for (const width of [375, 1440]) {
  test(`contenido público de OFL a ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    for (const path of ["/", "/eventos", "/eventos/ofl-5", "/noticias", "/noticias/cartelera-completa-de-ofl-5-confirmada", "/peleadores/diego-soto", "/entradas"]) {
      await page.goto(path);
      await expect(page.locator("body")).not.toContainText(/guerra\s+campal/i);
      await expect(page.locator('a[href*="guerra-campal"]')).toHaveCount(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);
    }
  });
}

test("los enlaces antiguos redirigen permanentemente sin perder la query ni el detalle de pelea", async ({ page, request }) => {
  for (const [legacy, current] of [
    ["/eventos/guerra-campal-5?origen=compartido", "/eventos/ofl-5?origen=compartido"],
    ["/noticias/resumen-de-guerra-campal-4", "/noticias/resumen-de-ofl-4"],
  ]) {
    const response = await request.get(legacy!, { maxRedirects: 0 });
    expect(response.status()).toBe(308);
    const destination = new URL(response.headers().location!, response.url());
    expect(destination.pathname + destination.search).toBe(current);
    await page.goto(legacy!);
    await expect(page).toHaveURL(new RegExp(current!.replace("?", "\\?") + "$"));
    await expect(page.locator("h1")).toBeVisible();
  }
  await page.goto("/eventos/ofl-1");
  await page.getByRole("tabpanel").locator("[data-bout]").first().getByRole("button", { name: /Ver datos/ }).click();
  const detail = page.getByRole("link", { name: /Ver la pelea y las tarjetas/ }).first();
  const href = await detail.getAttribute("href");
  expect(href).toContain("/eventos/ofl-1/peleas/");
  await page.goto(href!.replace("ofl-1", "guerra-campal-1"));
  await expect(page).toHaveURL(new RegExp(href! + "$"));
  await expect(page.locator("h1")).toBeVisible();
});
