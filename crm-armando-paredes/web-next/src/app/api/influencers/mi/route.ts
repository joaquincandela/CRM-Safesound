import { extractToken, apiSuccess, apiError } from "@/lib/api-helpers";
import { verificarToken } from "@/lib/auth";
import * as service from "@/lib/services/influencers.service";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const token = extractToken(req);
    if (!token) return apiError(new Error("No autorizado"));
    const user = verificarToken(token);
    if (user.rol !== "INFLUENCER") return apiError(new Error("Acceso denegado"));
    const influencer = await service.obtenerInfluencerPorUsuario(user.sub);
    return apiSuccess(influencer);
  } catch (e) { return apiError(e); }
}
