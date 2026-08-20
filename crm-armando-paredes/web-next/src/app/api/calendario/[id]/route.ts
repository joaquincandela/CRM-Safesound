import { parseBody, extractToken, apiSuccess, apiNoContent, apiError } from "@/lib/api-helpers";
import { verificarToken } from "@/lib/auth";
import * as service from "@/lib/services/calendario.service";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = extractToken(req);
    if (!token) return apiError(new Error("No autorizado"));
    const user = verificarToken(token);
    const { id } = await params;
    const body = await parseBody(req);
    const tarea = await service.actualizarTareaCalendario(user.sub, id, body);
    return apiSuccess(tarea);
  } catch (e) { return apiError(e); }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = extractToken(req);
    if (!token) return apiError(new Error("No autorizado"));
    const user = verificarToken(token);
    const { id } = await params;
    await service.eliminarTareaCalendario(user.sub, id);
    return apiNoContent();
  } catch (e) { return apiError(e); }
}
