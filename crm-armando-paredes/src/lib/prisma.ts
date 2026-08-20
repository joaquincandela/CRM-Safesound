import { PrismaClient } from "@prisma/client";
import type { PGlite } from "@electric-sql/pglite";

// Singleton del PrismaClient.
// - Producción/dev: driver adapter de pg (Postgres real) vía DATABASE_URL.
// - Tests: PGlite (Postgres en WASM, en memoria) cuando PRISMA_DRIVER=pglite,
//   para correr la suite sin Docker ni base de datos externa.
let prisma: PrismaClient;
let pglite: PGlite | undefined;

if (process.env.PRISMA_DRIVER === "pglite") {
  const { PGlite } = await import("@electric-sql/pglite");
  const { PrismaPGlite } = await import("pglite-prisma-adapter");
  pglite = new PGlite();
  // El adapter community aún no tipa contra la interfaz de Prisma 7 → cast.
  prisma = new PrismaClient({ adapter: new PrismaPGlite(pglite) as never });
} else {
  const { PrismaPg } = await import("@prisma/adapter-pg");
  const { env } = await import("../config/env.js");
  prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: env.DATABASE_URL }) });
}

export { prisma, pglite };

export type Db = PrismaClient | Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0];
