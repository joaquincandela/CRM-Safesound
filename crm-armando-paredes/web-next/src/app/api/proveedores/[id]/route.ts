import { parseBody, extractToken, apiSuccess, apiNoContent, apiError } from "@/lib/api-helpers";
import { verificarToken } from "@/lib/auth";
import * as service from "@/lib/services/proveedores.service";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const proveedor = await service.obtenerProveedor(id);
    return apiSuccess(proveedor);
  } catch (e) { return apiError(e); }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = extractToken(req);
    if (!token) return apiError(new Error("No autorizado"));
    const user = verificarToken(token);
    if (!["ADMIN", "OPERACIONES"].includes(user.rol)) return apiError(new Error("Acceso denegado"));
    const { id } = await params;
    const body = await parseBody(req);
    const proveedor = await service.actualizarProveedor(id, body);
    return apiSuccess(proveedor);
  } catch (e) { return apiError(e); }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = extractToken(req);
    if (!token) return apiError(new Error("No autorizado"));
    const user = verificarToken(token);
    if (user.rol !== "ADMIN") return apiError(new Error("Acceso denegado"));
    const { id } = await params;
    await service.eliminarProveedor(id);
    return apiNoContent();
  } catch (e) { return apiError(e); }
}
