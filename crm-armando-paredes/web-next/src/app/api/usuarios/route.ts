import { parseBody, getSearchParams, extractToken, apiSuccess, apiCreated, apiError } from "@/lib/api-helpers";
import { verificarToken } from "@/lib/auth";
import * as service from "@/lib/services/usuarios.service";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const token = extractToken(req);
    if (!token) return apiError(new Error("No autorizado"));
    const user = verificarToken(token);
    if (user.rol !== "ADMIN") return apiError(new Error("Acceso denegado"));
    const params = getSearchParams(req);
    const usuarios = await service.listarUsuarios({
      activo: params.activo === "true" ? true : params.activo === "false" ? false : undefined,
      rol: params.rol,
    });
    return apiSuccess(usuarios);
  } catch (e) { return apiError(e); }
}

export async function POST(req: Request) {
  try {
    const token = extractToken(req);
    if (!token) return apiError(new Error("No autorizado"));
    const user = verificarToken(token);
    if (user.rol !== "ADMIN") return apiError(new Error("Acceso denegado"));
    const body = await parseBody(req);
    const usuario = await service.crearUsuario(body);
    return apiCreated(usuario);
  } catch (e) { return apiError(e); }
}
