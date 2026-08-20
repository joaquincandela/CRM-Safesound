import type { Request, Response, NextFunction } from "express";
import { verificarToken, type JwtPayload } from "../services/auth.service.js";
import { Unauthorized, Forbidden } from "../lib/errors.js";

// Extiende Request con el usuario autenticado.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      usuario?: JwtPayload;
    }
  }
}

/** Exige un Bearer token válido; adjunta req.usuario. */
export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return next(Unauthorized("Falta el header Authorization"));
  req.usuario = verificarToken(header.slice(7));
  next();
}

/** Exige que el usuario tenga uno de los roles especificados. */
export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.usuario) return next(Unauthorized("No autenticado"));
    if (!roles.includes(req.usuario.rol)) return next(Forbidden());
    next();
  };
}
