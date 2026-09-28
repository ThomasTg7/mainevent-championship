import { expect, test } from "@playwright/test";

const MOBILE_VIEWPORTS = [
  { width: 320, height: 700 },
  { width: 375, height: 812 },
];

for (const viewport of MOBILE_VIEWPORTS) {
  test(`no hay overflow horizontal en ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");

    const fitsViewport = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);

    expect(fitsViewport).toBe(true);
  });
}

test("el botón Menú abre el menú móvil y muestra Peleadores", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");

  await page.getByRole("button", { name: "Menú" }).click();

  const mobileMenu = page.getByRole("navigation", { name: "Menú móvil" });
  await expect(mobileMenu.getByRole("link", { name: "Peleadores" })).toBeVisible();
});

test("el nav muestra los 5 links en escritorio", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");

  const nav = page.getByRole("navigation", { name: "Principal" });

  await expect(nav.getByRole("link")).toHaveCount(5);
});
