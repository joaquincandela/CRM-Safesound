import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { beforeAll, beforeEach } from "vitest";
import { pglite } from "../src/lib/prisma.js";

// Aplica el schema (DDL generado con `prisma migrate diff`) a la PGlite en
// memoria una vez por archivo de test, y limpia las tablas antes de cada test.

const ddlPath = fileURLToPath(new URL("../prisma/schema.sql", import.meta.url));

beforeAll(async () => {
  if (!pglite) throw new Error("PGlite no inicializado (¿PRISMA_DRIVER=pglite?)");
  const ddl = readFileSync(ddlPath, "utf8");
  await pglite.exec(ddl);
});

beforeEach(async () => {
  if (!pglite) return;
  const res = await pglite.query<{ tablename: string }>(
    `SELECT tablename FROM pg_tables WHERE schemaname = 'public'`,
  );
  const tablas = res.rows
    .map((r) => `"${r.tablename}"`)
    .filter((t) => !t.includes("_prisma_migrations"));
  if (tablas.length) {
    await pglite.exec(`TRUNCATE ${tablas.join(", ")} RESTART IDENTITY CASCADE;`);
  }
});
