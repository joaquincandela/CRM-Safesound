import { parseBody, extractToken, apiSuccess, apiNoContent, apiError } from "@/lib/api-helpers";
import { verificarToken } from "@/lib/auth";
import * as service from "@/lib/services/usuarios.service";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = extractToken(req);
    if (!token) return apiError(new Error("No autorizado"));
    const user = verificarToken(token);
    if (user.rol !== "ADMIN") return apiError(new Error("Acceso denegado"));
    const { id } = await params;
    const usuario = await service.obtenerUsuario(id);
    return apiSuccess(usuario);
  } catch (e) { return apiError(e); }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = extractToken(req);
    if (!token) return apiError(new Error("No autorizado"));
    const user = verificarToken(token);
    if (user.rol !== "ADMIN") return apiError(new Error("Acceso denegado"));
    const { id } = await params;
    const body = await parseBody(req);
    const usuario = await service.actualizarUsuario(id, body);
    return apiSuccess(usuario);
  } catch (e) { return apiError(e); }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = extractToken(req);
    if (!token) return apiError(new Error("No autorizado"));
    const user = verificarToken(token);
    if (user.rol !== "ADMIN") return apiError(new Error("Acceso denegado"));
    const { id } = await params;
    await service.eliminarUsuario(id);
    return apiNoContent();
  } catch (e) { return apiError(e); }
}
