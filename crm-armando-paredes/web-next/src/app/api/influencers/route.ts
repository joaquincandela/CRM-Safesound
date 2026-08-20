import { parseBody, getSearchParams, extractToken, apiSuccess, apiCreated, apiError } from "@/lib/api-helpers";
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
    const activo = params.activo === "true" ? true : params.activo === "false" ? false : undefined;
    const influencers = await service.listarInfluencers(activo);
    return apiSuccess(influencers);
  } catch (e) { return apiError(e); }
}

export async function POST(req: Request) {
  try {
    const token = extractToken(req);
    if (!token) return apiError(new Error("No autorizado"));
    const user = verificarToken(token);
    if (user.rol !== "ADMIN") return apiError(new Error("Acceso denegado"));
    const body = await parseBody(req);
    const influencer = await service.crearInfluencer(body);
    return apiCreated(influencer);
  } catch (e) { return apiError(e); }
}
