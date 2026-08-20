import { parseBody, extractToken, apiSuccess, apiNoContent, apiError } from "@/lib/api-helpers";
import { verificarToken } from "@/lib/auth";
import * as service from "@/lib/services/costeoImportacion.service";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const costeo = await service.obtenerCosteo(id);
    return apiSuccess(costeo);
  } catch (e) { return apiError(e); }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = extractToken(req);
    if (!token) return apiError(new Error("No autorizado"));
    const user = verificarToken(token);
    if (!["ADMIN", "INVENTARIO", "OPERACIONES"].includes(user.rol)) return apiError(new Error("Acceso denegado"));
    const { id } = await params;
    const body = await parseBody(req);
    const costeo = await service.actualizarCosteo(id, body);
    return apiSuccess(costeo);
  } catch (e) { return apiError(e); }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = extractToken(req);
    if (!token) return apiError(new Error("No autorizado"));
    const user = verificarToken(token);
    if (!["ADMIN", "INVENTARIO", "OPERACIONES"].includes(user.rol)) return apiError(new Error("Acceso denegado"));
    const { id } = await params;
    const costeo = await service.eliminarCosteo(id);
    return apiSuccess(costeo);
  } catch (e) { return apiError(e); }
}
