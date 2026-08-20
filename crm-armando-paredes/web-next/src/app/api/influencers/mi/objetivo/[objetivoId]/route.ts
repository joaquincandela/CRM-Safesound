import { parseBody, extractToken, apiSuccess, apiError } from "@/lib/api-helpers";
import { verificarToken } from "@/lib/auth";
import * as service from "@/lib/services/influencers.service";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: Promise<{ objetivoId: string }> }) {
  try {
    const token = extractToken(req);
    if (!token) return apiError(new Error("No autorizado"));
    const user = verificarToken(token);
    const { objetivoId } = await params;
    const body = await parseBody(req);
    const objetivo = await service.marcarMiObjetivo(user.sub, objetivoId, body.cantidadCompletada);
    return apiSuccess(objetivo);
  } catch (e) { return apiError(e); }
}
