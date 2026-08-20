import { getSearchParams, extractToken, apiSuccess, apiError } from "@/lib/api-helpers";
import { verificarToken } from "@/lib/auth";
import { buscarGlobal } from "@/lib/services/buscar.service";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const token = extractToken(req);
    if (!token) return apiError(new Error("No autorizado"));
    verificarToken(token);
    const params = getSearchParams(req);
    const resultados = await buscarGlobal(params.q || "");
    return apiSuccess(resultados);
  } catch (e) { return apiError(e); }
}
