export class AppError extends Error {
  constructor(public statusCode: number, public code: string, message: string) {
    super(message);
    this.name = "AppError";
  }
}

export function NotFound(resource = "Recurso") {
  return new AppError(404, "NOT_FOUND", `${resource} no encontrado`);
}

export function Unauthorized(message = "No autorizado") {
  return new AppError(401, "UNAUTHORIZED", message);
}

export function Forbidden(message = "Acceso denegado") {
  return new AppError(403, "FORBIDDEN", message);
}

export function BadRequest(message: string) {
  return new AppError(400, "BAD_REQUEST", message);
}
