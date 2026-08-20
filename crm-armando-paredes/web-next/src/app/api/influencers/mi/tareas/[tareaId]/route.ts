import { parseBody, extractToken, apiSuccess, apiError } from "@/lib/api-helpers";
import { verificarToken } from "@/lib/auth";
import * as service from "@/lib/services/influencers.service";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: Promise<{ tareaId: string }> }) {
  try {
    const token = extractToken(req);
    if (!token) return apiError(new Error("No autorizado"));
    const user = verificarToken(token);
    const { tareaId } = await params;
    const body = await parseBody(req);
    const tarea = await service.actualizarMiTarea(user.sub, tareaId, body.cantidadCompletada);
    return apiSuccess(tarea);
  } catch (e) { return apiError(e); }
}
