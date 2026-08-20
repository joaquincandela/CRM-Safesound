import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    // PGlite es en-memoria por archivo de test: corremos sin paralelismo entre
    // archivos para que cada uno tenga su DB aislada y estable.
    fileParallelism: false,
    env: {
      PRISMA_DRIVER: "pglite",
      DATABASE_URL: "postgres://test", // ignorado en modo pglite, evita validación
      JWT_SECRET: "test-secret",
      WEBHOOK_SECRET: "test-webhook-secret",
      NODE_ENV: "test",
    },
  },
});
