import { expect, type Page } from "@playwright/test";

// Admin creado por e2e/global-setup.ts en la BD de e2e (se vacía en cada corrida).
export const SEED_ADMIN_EMAIL = "seed-admin@guerracampal.cl";
export const SEED_ADMIN_PASSWORD = "SeedPassword123!";

export async function signInAsAdmin(page: Page): Promise<void> {
  await page.goto("/admin/login");
  await page.getByLabel("Correo").fill(SEED_ADMIN_EMAIL);
  await page.getByLabel("Contraseña").fill(SEED_ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page).toHaveURL(/\/admin$/);
}
