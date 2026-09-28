import { defineConfig, devices } from "@playwright/test";

// Next.js carga .env automáticamente para `next dev`, pero el proceso de
// Playwright (config, globalSetup) no lo hace por su cuenta.
try {
  process.loadEnvFile();
} catch {
  // sin .env local (por ejemplo en CI, donde las variables ya están en el entorno)
}

const PORT = 3100;

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  fullyParallel: true,
  reporter: "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
  },
  webServer: {
    command: `pnpm run dev --port ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
