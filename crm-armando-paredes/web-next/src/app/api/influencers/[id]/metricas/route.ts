import { parseBody, extractToken, apiSuccess, apiCreated, apiError } from "@/lib/api-helpers";
import { verificarToken } from "@/lib/auth";
import * as service from "@/lib/services/influencers.service";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = extractToken(req);
    if (!token) return apiError(new Error("No autorizado"));
    const user = verificarToken(token);
    if (!["ADMIN", "VENTAS"].includes(user.rol)) return apiError(new Error("Acceso denegado"));
    const { id } = await params;
    const metricas = await service.listarMetricas(id);
    return apiSuccess(metricas);
  } catch (e) { return apiError(e); }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = extractToken(req);
    if (!token) return apiError(new Error("No autorizado"));
    const user = verificarToken(token);
    if (!["ADMIN", "VENTAS"].includes(user.rol)) return apiError(new Error("Acceso denegado"));
    const { id } = await params;
    const body = await parseBody(req);
    const metrica = await service.crearMetrica(id, body);
    return apiCreated(metrica);
  } catch (e) { return apiError(e); }
}
