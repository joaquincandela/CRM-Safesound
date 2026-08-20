import { getSearchParams, extractToken, apiSuccess, apiError } from "@/lib/api-helpers";
import { verificarToken } from "@/lib/auth";
import * as service from "@/lib/services/influencers.service";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const token = extractToken(req);
    if (!token) return apiError(new Error("No autorizado"));
    const user = verificarToken(token);
    if (!["ADMIN", "VENTAS"].includes(user.rol)) return apiError(new Error("Acceso denegado"));
    const params = getSearchParams(req);
    const limite = Math.min(parseInt(params.limite || "5"), 20);
    const top = await service.obtenerTopInfluencers(limite);
    return apiSuccess(top);
  } catch (e) { return apiError(e); }
}
