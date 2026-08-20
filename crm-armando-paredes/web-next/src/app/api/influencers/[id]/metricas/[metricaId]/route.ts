import { parseBody, extractToken, apiSuccess, apiError } from "@/lib/api-helpers";
import { verificarToken } from "@/lib/auth";
import * as service from "@/lib/services/influencers.service";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string; metricaId: string }> }) {
  try {
    const token = extractToken(req);
    if (!token) return apiError(new Error("No autorizado"));
    const user = verificarToken(token);
    if (!["ADMIN", "VENTAS"].includes(user.rol)) return apiError(new Error("Acceso denegado"));
    const { id, metricaId } = await params;
    const body = await parseBody(req);
    const metrica = await service.actualizarMetrica(id, metricaId, body);
    return apiSuccess(metrica);
  } catch (e) { return apiError(e); }
}
