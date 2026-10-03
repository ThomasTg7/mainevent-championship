import { expect, test, type Page } from "@playwright/test";
import { adminUrl, signInAsAdmin } from "./fixtures/admin";

// La configuración del sitio es una sola para todos los specs: estos tests la cambian en orden, uno tras otro.
test.describe.configure({ mode: "serial" });

test.beforeEach(async ({ page }) => {
  await signInAsAdmin(page);
});

async function openSettings(page: Page, tab: string) {
  await page.goto(adminUrl("/configuracion"));
  await page.getByRole("tab", { name: tab, exact: true }).click();
}

async function save(page: Page) {
  await page.getByRole("button", { name: "Guardar cambios" }).click();
  await expect(page.getByText("Cambios guardados")).toBeVisible();
}

async function expectNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
}

test("el Instagram guardado en Configuración queda enlazado en el footer", async ({ page }) => {
  await openSettings(page, "Redes");
  await page.getByLabel("Instagram").fill("@guerracampal_e2e");
  await save(page);

  await page.goto("/");
  const footer = page.getByRole("contentinfo");
  await expect(footer.getByRole("link", { name: "Instagram" })).toHaveAttribute("href", "https://www.instagram.com/guerracampal_e2e");
  // Lo que no tiene perfil no aparece.
  await expect(footer.getByRole("link", { name: "TikTok" })).toHaveCount(0);
});

test("un enlace de red que no es válido se rechaza junto al campo y no se guarda", async ({ page }) => {
  await openSettings(page, "Redes");
  await page.getByLabel("TikTok").fill("javascript:alert(1)");
  await page.getByRole("button", { name: "Guardar cambios" }).click();

  await expect(page.getByText("Escribe el usuario (p. ej. @guerracampal) o el enlace completo del perfil")).toBeVisible();
  await page.goto("/");
  await expect(page.getByRole("contentinfo").getByRole("link", { name: "TikTok" })).toHaveCount(0);
});

test("/privacidad muestra el texto guardado y la fecha de actualización", async ({ page }) => {
  await openSettings(page, "Privacidad");
  await page.getByRole("textbox", { name: "Política de privacidad" }).click();
  await page.keyboard.type("Cuidamos tus datos personales según la Ley 19.628.");
  await save(page);

  await page.goto("/privacidad");
  await expect(page.getByRole("heading", { name: "Política de privacidad", level: 1 })).toBeVisible();
  await expect(page.getByText("Cuidamos tus datos personales según la Ley 19.628.")).toBeVisible();
  // La fecha va con el formato de `formatDate` (es-CL, hora de Chile).
  await expect(page.getByText(/Actualizado el \d/)).toBeVisible();
});

test("el editor de los textos no ofrece fotos ni videos", async ({ page }) => {
  await openSettings(page, "Nosotros");
  await expect(page.getByRole("textbox", { name: "Texto de Nosotros" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Negrita" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Imagen" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Video o publicación/ })).toHaveCount(0);

  await page.getByRole("textbox", { name: "Texto de Nosotros" }).click();
  await page.keyboard.type("Somos la promotora de MMA de Chile.");
  await save(page);

  await page.goto("/nosotros");
  await expect(page.getByRole("heading", { name: "Nosotros", level: 1 })).toBeVisible();
  await expect(page.getByText("Somos la promotora de MMA de Chile.")).toBeVisible();
});

test("/contacto muestra los datos de contacto guardados", async ({ page }) => {
  await openSettings(page, "Contacto");
  await page.getByLabel("Correo de contacto").fill("hola@guerracampal.cl");
  await page.getByLabel("WhatsApp").fill("+56 9 1234 5678");
  await save(page);

  await page.goto("/contacto");
  await expect(page.getByRole("heading", { name: "Contacto", level: 1 })).toBeVisible();
  await expect(page.getByRole("link", { name: "hola@guerracampal.cl" })).toHaveAttribute("href", "mailto:hola@guerracampal.cl");
  await expect(page.getByRole("link", { name: /WhatsApp/ })).toHaveAttribute("href", "https://wa.me/56912345678");
});

test("sin preguntas frecuentes, /entradas no dibuja la sección; con una, sí", async ({ page }) => {
  await openSettings(page, "Preguntas de entradas");
  await expect(page.getByText("Aún no hay preguntas")).toBeVisible();
  await save(page);

  await page.goto("/entradas");
  await expect(page.getByRole("heading", { name: "Entradas", level: 1 })).toBeVisible();
  await expect(page.locator('[data-slot="tickets-faq"]')).toHaveCount(0);

  await openSettings(page, "Preguntas de entradas");
  await page.getByRole("button", { name: "Agregar pregunta" }).click();
  await page.getByLabel("Pregunta 1", { exact: true }).fill("¿Se pueden devolver las entradas?");
  await page.getByLabel("Respuesta 1", { exact: true }).fill("No, pero puedes regalarlas.");
  await save(page);

  await page.goto("/entradas");
  const faq = page.locator('[data-slot="tickets-faq"]');
  await expect(faq.getByRole("heading", { name: "Preguntas frecuentes" })).toBeVisible();
  await expect(faq.getByText("¿Se pueden devolver las entradas?")).toBeVisible();
  await expect(faq.getByText("No, pero puedes regalarlas.")).toBeHidden();
  await faq.getByText("¿Se pueden devolver las entradas?").click();
  await expect(faq.getByText("No, pero puedes regalarlas.")).toBeVisible();
});

test("una pregunta sin respuesta se rechaza con un mensaje", async ({ page }) => {
  await openSettings(page, "Preguntas de entradas");
  await page.getByRole("button", { name: "Agregar pregunta" }).click();
  await page.getByLabel("Pregunta 2", { exact: true }).fill("¿Hay estacionamiento?");
  await page.getByRole("button", { name: "Guardar cambios" }).click();
  await expect(page.getByText("Cada pregunta necesita su respuesta")).toBeVisible();
});

for (const width of [320, 375, 1440]) {
  test(`las páginas fijas y Configuración no tienen scroll horizontal a ${width} px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const path of ["/nosotros", "/contacto", "/privacidad"]) {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expectNoHorizontalScroll(page);
    }
    await page.goto(adminUrl("/configuracion"));
    await expect(page.getByRole("heading", { name: "Configuración", level: 1 })).toBeVisible();
    await expectNoHorizontalScroll(page);
  });
}
