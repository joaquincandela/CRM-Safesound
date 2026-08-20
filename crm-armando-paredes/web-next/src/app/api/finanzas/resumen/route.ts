import { getSearchParams, extractToken, apiSuccess, apiError } from "@/lib/api-helpers";
import { verificarToken } from "@/lib/auth";
import * as service from "@/lib/services/finanzas.service";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const token = extractToken(req);
    if (!token) return apiError(new Error("No autorizado"));
    const user = verificarToken(token);
    if (user.rol !== "ADMIN") return apiError(new Error("Acceso denegado"));
    const params = getSearchParams(req);
    if (!params.desde || !params.hasta) {
      return apiError(new Error("Se requieren parámetros 'desde' y 'hasta'"));
    }
    const resumen = await service.obtenerResumenFinanciero(new Date(params.desde), new Date(params.hasta));
    return apiSuccess(resumen);
  } catch (e) { return apiError(e); }
}
