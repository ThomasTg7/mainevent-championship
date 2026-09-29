import { expect, test, type Page } from "@playwright/test";
import { SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD } from "./fixtures/admin";

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

async function signIn(page: Page) {
  await page.goto("/admin/login");
  await page.getByLabel("Correo").fill(SEED_ADMIN_EMAIL);
  await page.getByLabel("Contraseña").fill(SEED_ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page).toHaveURL(/\/admin$/);
}

test("visitar /admin sin sesión termina en /admin/login", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login$/);
});

test("login del admin muestra Inicio, el sidebar completo, y dar acceso queda en el historial", async ({ page }) => {
  const newEmail = `nuevo-${Date.now()}@x.cl`;

  await signIn(page);
  await expect(page.getByRole("heading", { name: "Inicio" })).toBeVisible();

  const sections = page.locator('[data-slot="sidebar-content"] [data-slot="sidebar-menu-button"]');
  await expect(sections).toHaveCount(SECTIONS.length);
  for (const section of SECTIONS) {
    await expect(sections.filter({ hasText: section })).toHaveCount(1);
  }

  await page.getByRole("link", { name: "Usuarios" }).click();
  await expect(page).toHaveURL(/\/admin\/usuarios$/);

  await page.getByLabel("Correo del nuevo administrador").fill(newEmail);
  await page.getByRole("button", { name: "Dar acceso" }).click();

  await expect(page.getByRole("cell", { name: newEmail })).toBeVisible();

  await page.getByRole("link", { name: "Historial" }).click();
  await expect(page).toHaveURL(/\/admin\/historial$/);
  await expect(page.getByRole("cell", { name: new RegExp(newEmail) }).first()).toBeVisible();
});

test("contraseña incorrecta muestra el error junto al campo", async ({ page }) => {
  await page.goto("/admin/login");
  await page.getByLabel("Correo").fill(SEED_ADMIN_EMAIL);
  await page.getByLabel("Contraseña").fill("no-es-la-clave");
  await page.getByRole("button", { name: "Ingresar" }).click();

  await expect(page.getByText("Correo o contraseña incorrectos.")).toBeVisible();
});

test("un rechazo de Google por lista blanca se explica en el login", async ({ page }) => {
  await page.goto("/admin/login?error=EMAIL_NOT_ALLOWED");

  await expect(page.getByText("Este correo no tiene acceso al panel.")).toBeVisible();
});

test("recuperar contraseña responde siempre con el mismo mensaje", async ({ page }) => {
  await page.goto("/admin/login");
  await page.getByRole("link", { name: "¿Olvidaste tu contraseña?" }).click();
  await expect(page).toHaveURL(/\/admin\/recuperar$/);

  await page.getByLabel("Correo").fill("nadie@x.cl");
  await page.getByRole("button", { name: "Enviar enlace" }).click();

  await expect(page.getByRole("status")).toContainText("Si el correo tiene acceso al panel");
});

test("un enlace de contraseña inválido ofrece pedir otro", async ({ page }) => {
  await page.goto("/admin/restablecer?error=INVALID_TOKEN");

  await expect(page.getByText("El enlace no es válido o ya venció. Pide uno nuevo.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Pedir un enlace nuevo" })).toBeVisible();
});

test("cerrar sesión vuelve al login y protege el panel", async ({ page }) => {
  await signIn(page);

  await page.getByRole("button", { name: "Cerrar sesión" }).click();
  await expect(page).toHaveURL(/\/admin\/login$/);

  await page.goto("/admin/usuarios");
  await expect(page).toHaveURL(/\/admin\/login$/);
});
