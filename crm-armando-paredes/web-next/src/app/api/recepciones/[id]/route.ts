import { extractToken, apiSuccess, apiNoContent, apiError } from "@/lib/api-helpers";
import { verificarToken } from "@/lib/auth";
import * as service from "@/lib/services/recepciones.service";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const recepcion = await service.obtenerRecepcion(id);
    return apiSuccess(recepcion);
  } catch (e) { return apiError(e); }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = extractToken(req);
    if (!token) return apiError(new Error("No autorizado"));
    const user = verificarToken(token);
    if (!["ADMIN", "INVENTARIO"].includes(user.rol)) return apiError(new Error("Acceso denegado"));
    const { id } = await params;
    await service.eliminarRecepcion(id);
    return apiNoContent();
  } catch (e) { return apiError(e); }
}
