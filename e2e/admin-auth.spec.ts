import { expect, test } from "@playwright/test";
import { SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD } from "./global-setup";

const SECTIONS = [
  "Inicio",
  "Peleadores",
  "Divisiones",
  "Eventos",
  "Noticias",
  "Rankings",
  "Patrocinadores",
  "Bandeja",
  "Configuración",
  "Usuarios",
  "Papelera",
  "Historial",
];

test("visitar /admin sin sesión termina en /admin/login", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login$/);
});

test("login del admin muestra Inicio, el sidebar completo, y agregar/ver un usuario queda en el historial", async ({
  page,
}) => {
  const newEmail = `nuevo-${Date.now()}@x.cl`;

  await page.goto("/admin/login");
  await page.getByLabel("Correo").fill(SEED_ADMIN_EMAIL);
  await page.getByLabel("Contraseña").fill(SEED_ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Ingresar" }).click();

  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole("heading", { name: "Inicio" })).toBeVisible();

  const sidebarLinks = page.locator('[data-slot="sidebar-menu-button"]');
  await expect(sidebarLinks).toHaveCount(SECTIONS.length);
  for (const section of SECTIONS) {
    await expect(sidebarLinks.filter({ hasText: section })).toHaveCount(1);
  }

  await page.getByRole("link", { name: "Usuarios" }).click();
  await expect(page).toHaveURL(/\/admin\/usuarios$/);

  await page.getByLabel("Correo").fill(newEmail);
  await page.getByRole("button", { name: "Agregar" }).click();

  await expect(page.getByRole("cell", { name: newEmail })).toBeVisible();

  await page.getByRole("link", { name: "Historial" }).click();
  await expect(page).toHaveURL(/\/admin\/historial$/);
  await expect(page.getByRole("cell", { name: new RegExp(newEmail) }).first()).toBeVisible();
});
