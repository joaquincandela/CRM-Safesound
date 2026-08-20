import "dotenv/config";

// Validación y tipado de variables de entorno. Falla rápido al arrancar
// si falta algo crítico, en vez de explotar en runtime más tarde.
const NODE_ENV = process.env.NODE_ENV ?? "development";
const isProd = NODE_ENV === "production";

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Falta la variable de entorno requerida: ${name}`);
  return v;
}

/**
 * Secreto obligatorio en producción. En desarrollo cae a un valor por defecto
 * para no fricción local, pero NUNCA arranca en producción con un secreto
 * conocido (que permitiría forjar JWTs o golpear los webhooks).
 */
function requiredSecret(name: string, devFallback: string, minLength = 16): string {
  const v = process.env[name];
  if (!v) {
    if (isProd) throw new Error(`Falta la variable de entorno requerida en producción: ${name}`);
    return devFallback;
  }
  if (isProd && v.length < minLength) {
    throw new Error(`${name} es demasiado corto para producción (mín. ${minLength} caracteres)`);
  }
  return v;
}

export const env = {
  NODE_ENV,
  PORT: Number(process.env.PORT ?? 3001),
  DATABASE_URL: required("DATABASE_URL"),
  JWT_SECRET: requiredSecret("JWT_SECRET", "dev-secret-cambiar-en-produccion", 32),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? "12h",
  // Secreto compartido para validar webhooks entrantes (n8n / Urbania).
  WEBHOOK_SECRET: requiredSecret("WEBHOOK_SECRET", "dev-webhook-secret", 16),
  // Orígenes permitidos para CORS (coma-separados). Ej: "https://web-next-blond.vercel.app".
  // Vacío => en dev se permite cualquier origen; en prod se bloquea todo cross-origin.
  CORS_ORIGINS: (process.env.CORS_ORIGINS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
} as const;
