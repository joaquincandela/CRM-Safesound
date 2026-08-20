import type { Request, Response, NextFunction } from "express";
import type { ZodTypeAny, z } from "zod";

// Valida body/query/params contra esquemas Zod y reemplaza el valor parseado
// (ya tipado/coercionado). Los errores caen al errorHandler central.
type Schemas = { body?: ZodTypeAny; query?: ZodTypeAny; params?: ZodTypeAny };

export function validate(schemas: Schemas) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (schemas.body) req.body = schemas.body.parse(req.body);
      if (schemas.query) Object.assign(req.query, schemas.query.parse(req.query));
      if (schemas.params) Object.assign(req.params, schemas.params.parse(req.params));
      next();
    } catch (e) {
      next(e);
    }
  };
}

export type Infer<T extends ZodTypeAny> = z.infer<T>;
