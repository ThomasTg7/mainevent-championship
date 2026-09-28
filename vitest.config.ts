import { configDefaults, defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    setupFiles: ["./src/test/setup.ts"],
    globals: false,
    // e2e/ son specs de Playwright, no de Vitest; sin esto, Vitest los
    // recoge también por el patrón *.spec.ts y choca con el runner de Playwright.
    exclude: [...configDefaults.exclude, "e2e/**"],
    // PGlite (WASM) arranca varias instancias en paralelo durante la suite
    // completa; el timeout por defecto (5s) alcanza a fallar por contención
    // de CPU aunque cada test, aislado, tarde ~1s.
    testTimeout: 15000,
  },
});
