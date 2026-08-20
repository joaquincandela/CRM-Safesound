import { timingSafeEqual } from "node:crypto";
import rateLimit from "express-rate-limit";
import type { Request, Response, NextFunction } from "express";
import { env } from "../config/env.js";
import { Unauthorized } from "../lib/errors.js";

/** Comparación en tiempo constante (evita timing attacks sobre el secreto). */
function secretosIguales(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

// Rate limit estricto para webhooks: endpoints públicos, blanco de abuso.
export const webhookLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 min
  limit: 120, // 120 req/min por IP
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: { code: "RATE_LIMITED", message: "Demasiadas solicitudes" } },
});

// Rate limit general para la API autenticada.
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 300,
  standardHeaders: "draft-7",
  legacyHeaders: false,
});

/** Valida el secreto compartido del webhook (header x-webhook-secret). */
export function verifyWebhookSecret(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers["x-webhook-secret"];
  // El header puede llegar como string[] si se envía repetido; normalizamos.
  const secret = Array.isArray(header) ? header[0] : header;
  if (!secret || !secretosIguales(secret, env.WEBHOOK_SECRET)) {
    return next(Unauthorized("Secreto de webhook inválido"));
  }
  next();
}
