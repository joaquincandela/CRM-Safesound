import express from "express";
import cors from "cors";
import helmet from "helmet";
import { api } from "./routes/index.js";
import { env } from "./config/env.js";
import { requestLogger } from "./middleware/logger.js";
import { apiLimiter } from "./middleware/rateLimit.js";
import { notFoundHandler, errorHandler } from "./middleware/error.js";

// Construye la app Express (sin escuchar). Facilita los tests.
export function createApp() {
  const app = express();

  // Headers de seguridad (CSP, HSTS, X-Frame-Options, etc.).
  app.use(helmet());

  // CORS: el frontend (Vercel) vive en otro origen y necesita poder llamar a la
  // API desde el navegador. En dev sin lista configurada se permite cualquier
  // origen; en producción solo los de CORS_ORIGINS.
  const allowList = env.CORS_ORIGINS;
  app.use(
    cors({
      origin:
        allowList.length > 0
          ? allowList
          : env.NODE_ENV === "production"
            ? false // prod sin lista => no se permite cross-origin
            : true, // dev => cualquier origen
      credentials: true,
    }),
  );

  app.use(express.json({ limit: "1mb" }));
  app.use(requestLogger);

  // API autenticada bajo /api.
  app.use("/api", apiLimiter, api);

  // 404 + manejo central de errores (siempre al final).
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
