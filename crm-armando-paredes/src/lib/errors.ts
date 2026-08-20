// Error de aplicación con status HTTP. El error handler central lo traduce
// a una respuesta JSON consistente. Cualquier otro error => 500.
export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const NotFound = (recurso: string) =>
  new AppError(404, `${recurso} no encontrado`, "NOT_FOUND");

export const BadRequest = (msg: string, details?: unknown) =>
  new AppError(400, msg, "BAD_REQUEST", details);

export const Unauthorized = (msg = "No autorizado") =>
  new AppError(401, msg, "UNAUTHORIZED");

export const Forbidden = (msg = "No tiene permisos para esta acción") =>
  new AppError(403, msg, "FORBIDDEN");

export const Conflict = (msg: string) => new AppError(409, msg, "CONFLICT");
