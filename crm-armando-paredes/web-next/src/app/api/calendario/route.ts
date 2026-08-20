import { parseBody, getSearchParams, extractToken, apiSuccess, apiCreated, apiError } from "@/lib/api-helpers";
import { verificarToken } from "@/lib/auth";
import * as service from "@/lib/services/calendario.service";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const token = extractToken(req);
    if (!token) return apiError(new Error("No autorizado"));
    const user = verificarToken(token);
    const params = getSearchParams(req);
    const tareas = await service.listarTareasCalendario(
      user.sub,
      params.desde ? new Date(params.desde) : undefined,
      params.hasta ? new Date(params.hasta) : undefined
    );
    return apiSuccess(tareas);
  } catch (e) { return apiError(e); }
}

export async function POST(req: Request) {
  try {
    const token = extractToken(req);
    if (!token) return apiError(new Error("No autorizado"));
    const user = verificarToken(token);
    const body = await parseBody(req);
    const tarea = await service.crearTareaCalendario(user.sub, body);
    return apiCreated(tarea);
  } catch (e) { return apiError(e); }
}
