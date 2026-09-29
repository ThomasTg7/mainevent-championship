import path from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { signInAsAdmin } from "./fixtures/admin";

const BODY_PHOTO = path.join(__dirname, "fixtures", "fighter-body.png");

async function expectNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
}

test.beforeEach(async ({ page }) => {
  await signInAsAdmin(page);
});

test("el listado muestra los peleadores sin scroll horizontal en móvil y PC", async ({ page }) => {
  await page.goto("/admin/peleadores");
  await expect(page.getByRole("heading", { name: "Peleadores", level: 1 })).toBeVisible();
  await expect(page.getByRole("link", { name: "Editar Matías Pérez" }).first()).toBeVisible();
  for (const size of [{ width: 375, height: 800 }, { width: 1440, height: 900 }]) {
    await page.setViewportSize(size);
    await expectNoHorizontalScroll(page);
  }
});

test("crear a Tomás Vera con foto, publicarlo, enviarlo a la papelera y restaurarlo", async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto("/admin/peleadores/nuevo");

  // Sin nombre: el error aparece junto al campo, en la pestaña correspondiente.
  await page.getByRole("button", { name: "Crear peleador" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "El nombre es obligatorio" })).toBeVisible();
  await expect(page.getByRole("alert").filter({ hasText: "Selecciona una división" })).toBeVisible();

  await page.getByLabel("Nombre", { exact: true }).fill("Tomás");
  await page.getByLabel("Apellido").fill("Vera");
  await page.getByLabel("Apodo").fill("El Tanque");
  await page.getByLabel("División").selectOption({ label: "Ligero · hasta 70.3 kg" });

  await page.getByRole("tab", { name: "Fotos" }).click();
  await page.locator('input[type="file"]').first().setInputFiles(BODY_PHOTO);
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Texto alternativo").fill("Tomás Vera de frente");
  await dialog.getByRole("button", { name: "Guardar imagen" }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByRole("img", { name: "Tomás Vera de frente" })).toBeVisible();

  await page.getByRole("tab", { name: "Publicación" }).click();
  await page.getByRole("radio", { name: "Programar" }).check();
  await expect(page.getByText("Elige fecha y hora")).toBeVisible();
  await expect(page.getByRole("button", { name: "Crear peleador" })).toBeDisabled();
  await page.getByRole("radio", { name: "Publicado" }).check();
  await expect(page.getByRole("button", { name: "Crear peleador" })).toBeEnabled();

  await page.getByRole("button", { name: "Crear peleador" }).click();
  await expect(page).toHaveURL(/\/admin\/peleadores\/[0-9a-f-]+\?creado=1$/);
  await expect(page.getByRole("heading", { name: "Tomás Vera", level: 1 })).toBeVisible();
  await expect(page.getByLabel("Enlace de la ficha")).toHaveValue("tomas-vera");

  // Publicado: el listado público lo muestra, con su foto.
  await page.goto("/peleadores?q=vera");
  await expect(page.getByRole("heading", { name: "Tomás Vera", level: 2 })).toBeVisible();
  await expect(page.getByRole("img", { name: "Tomás Vera de frente" })).toBeVisible();

  await page.goto("/admin/peleadores?q=vera");
  const row = page.getByRole("row").filter({ hasText: "Tomás Vera" });
  await expect(row.getByText("Publicado")).toBeVisible();
  await row.getByRole("button", { name: "Enviar a la papelera a Tomás Vera" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Enviar a la papelera" }).click();
  await expect(page.getByText("Ningún peleador coincide con esos filtros")).toBeVisible();

  // En la papelera: ya no aparece en el sitio (la caché se invalida al enviarlo).
  await page.goto("/peleadores?q=vera");
  await expect(page.getByText("Sin resultados")).toBeVisible();

  await page.goto("/admin/papelera");
  await page.getByRole("listitem").or(page.getByRole("row")).filter({ hasText: "Tomás Vera" }).getByRole("button", { name: "Restaurar" }).click();
  await page.goto("/admin/peleadores?q=vera");
  await expect(page.getByRole("row").filter({ hasText: "Tomás Vera" })).toBeVisible();
  await page.goto("/peleadores?q=vera");
  await expect(page.getByRole("heading", { name: "Tomás Vera", level: 2 })).toBeVisible();
});

test("editar un peleador conserva lo escrito y el enlace al renombrarlo", async ({ page }) => {
  // Joaquín Núñez no aparece en las pruebas del sitio público: renombrarlo no las afecta (corren en paralelo).
  await page.goto("/admin/peleadores?q=nunez");
  await page.getByRole("link", { name: "Editar Joaquín Núñez" }).first().click();
  await page.getByLabel("Nombre", { exact: true }).fill("Joaquín Andrés");
  await page.getByRole("tab", { name: "Físico" }).click();
  await page.getByLabel("Gimnasio").fill("Andes Fight Club");
  await page.getByRole("button", { name: "Guardar cambios" }).click();
  await expect(page.getByText("Cambios guardados")).toBeVisible();
  await expect(page.getByLabel("Gimnasio")).toHaveValue("Andes Fight Club");
  await page.getByRole("tab", { name: "Datos" }).click();
  await expect(page.getByLabel("Nombre", { exact: true })).toHaveValue("Joaquín Andrés");
  await expect(page.getByLabel("Enlace de la ficha")).toHaveValue("joaquin-nunez");
});

test("el formulario se usa en celular sin scroll horizontal", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto("/admin/peleadores/nuevo");
  await expectNoHorizontalScroll(page);
  for (const tab of ["Físico", "Récord total", "Fotos", "Redes", "Publicación"]) {
    await page.getByRole("tab", { name: tab }).click();
    await expectNoHorizontalScroll(page);
  }
  await expect(page.getByRole("button", { name: "Crear peleador" })).toBeInViewport();
});
