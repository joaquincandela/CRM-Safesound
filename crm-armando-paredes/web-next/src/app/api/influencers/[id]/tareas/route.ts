import { parseBody, extractToken, apiSuccess, apiCreated, apiError } from "@/lib/api-helpers";
import { verificarToken } from "@/lib/auth";
import * as service from "@/lib/services/influencers.service";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = extractToken(req);
    if (!token) return apiError(new Error("No autorizado"));
    const user = verificarToken(token);
    if (user.rol !== "ADMIN") return apiError(new Error("Acceso denegado"));
    const { id } = await params;
    const body = await parseBody(req);
    const tarea = await service.crearTarea(id, body);
    return apiCreated(tarea);
  } catch (e) { return apiError(e); }
}
