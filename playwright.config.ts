import os from "node:os";
import path from "node:path";
import { defineConfig, devices } from "@playwright/test";

// Next.js carga .env automáticamente para `next dev`, pero el proceso de
// Playwright (config, globalSetup) no lo hace por su cuenta.
try {
  process.loadEnvFile();
} catch {
  // sin .env local (por ejemplo en CI, donde las variables ya están en el entorno)
}

// Los e2e usan su propia base (se vacía en cada corrida) para no ensuciar la de
// desarrollo. `next dev` no pisa variables que ya vienen del entorno.
process.env.DATABASE_URL =
  process.env.E2E_DATABASE_URL ?? "postgres://postgres:postgres@localhost:5432/guerra_campal_e2e";

// Las imágenes subidas en los e2e van a una carpeta temporal, no a .storage/ del proyecto.
process.env.STORAGE_LOCAL_DIR = path.join(os.tmpdir(), "guerra-campal-e2e-storage");

process.env.E2E_DIST_DIR = ".next-e2e";

const PORT = 3100;

// El sitio en localhost y el panel en admin.localhost (mismo servidor; el proxy decide por dominio).
// `next dev` no pisa variables que ya vienen del entorno, así que ganan sobre las de .env.
process.env.SITE_URL = `http://localhost:${PORT}`;
process.env.ADMIN_URL = `http://admin.localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  fullyParallel: true,
  reporter: "list",
  // `next dev` compila cada ruta la primera vez que se visita; con varios
  // workers a la vez eso puede pasar de los 5 s por defecto.
  expect: { timeout: 30_000 },
  use: {
    baseURL: `http://localhost:${PORT}`,
  },
  webServer: {
    command: `pnpm run dev --port ${PORT}`,
    url: `http://localhost:${PORT}`,
    // Nunca reutilizar un `pnpm dev` ya abierto: apuntaría a la BD de desarrollo.
    reuseExistingServer: false,
    timeout: 60_000,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
