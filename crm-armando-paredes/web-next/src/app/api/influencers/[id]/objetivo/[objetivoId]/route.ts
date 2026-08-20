import { parseBody, extractToken, apiSuccess, apiNoContent, apiError } from "@/lib/api-helpers";
import { verificarToken } from "@/lib/auth";
import * as service from "@/lib/services/influencers.service";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string; objetivoId: string }> }) {
  try {
    const token = extractToken(req);
    if (!token) return apiError(new Error("No autorizado"));
    const user = verificarToken(token);
    if (user.rol !== "ADMIN") return apiError(new Error("Acceso denegado"));
    const { id, objetivoId } = await params;
    const body = await parseBody(req);
    const objetivo = await service.actualizarObjetivo(id, objetivoId, body);
    return apiSuccess(objetivo);
  } catch (e) { return apiError(e); }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string; objetivoId: string }> }) {
  try {
    const token = extractToken(req);
    if (!token) return apiError(new Error("No autorizado"));
    const user = verificarToken(token);
    if (user.rol !== "ADMIN") return apiError(new Error("Acceso denegado"));
    const { id, objetivoId } = await params;
    await service.eliminarObjetivo(id, objetivoId);
    return apiNoContent();
  } catch (e) { return apiError(e); }
}
