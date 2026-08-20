import type { Request, Response, NextFunction, RequestHandler } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { AppError } from "../lib/errors.js";

/** Envuelve handlers async para que los rejects lleguen al error handler. */
export const asyncHandler =
  (fn: RequestHandler): RequestHandler =>
  (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

/** 404 para rutas no registradas. */
export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ error: { code: "NOT_FOUND", message: `Ruta no encontrada: ${req.method} ${req.path}` } });
}

/** Manejo centralizado de errores: traduce a JSON consistente. */
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  // Errores de validación de Zod.
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: { code: "VALIDATION_ERROR", message: "Datos inválidos", details: err.issues },
    });
  }

  // Errores de aplicación controlados.
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: { code: err.code ?? "APP_ERROR", message: err.message, details: err.details },
    });
  }

  // Errores conocidos de Prisma.
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002")
      return res.status(409).json({ error: { code: "UNIQUE_VIOLATION", message: "Registro duplicado" } });
    if (err.code === "P2025")
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "Registro no encontrado" } });
    return res.status(400).json({ error: { code: "DB_ERROR", message: err.message } });
  }

  // Cualquier otra cosa: 500 sin filtrar detalles internos.
  console.error("[ERROR no controlado]", err);
  res.status(500).json({ error: { code: "INTERNAL", message: "Error interno del servidor" } });
}
