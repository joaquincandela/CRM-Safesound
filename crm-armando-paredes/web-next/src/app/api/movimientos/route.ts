import { parseBody, getSearchParams, extractToken, apiSuccess, apiCreated, apiError } from "@/lib/api-helpers";
import { verificarToken } from "@/lib/auth";
import * as service from "@/lib/services/movimientos.service";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const params = getSearchParams(req);
    const movimientos = await service.listarMovimientos({
      productoId: params.productoId,
      tipo: params.tipo,
      referenciaTipo: params.referenciaTipo,
      desde: params.desde ? new Date(params.desde) : undefined,
      hasta: params.hasta ? new Date(params.hasta) : undefined,
    });
    return apiSuccess(movimientos);
  } catch (e) { return apiError(e); }
}

export async function POST(req: Request) {
  try {
    const token = extractToken(req);
    if (!token) return apiError(new Error("No autorizado"));
    const user = verificarToken(token);
    if (!["ADMIN", "INVENTARIO", "OPERACIONES"].includes(user.rol)) return apiError(new Error("Acceso denegado"));
    const body = await parseBody(req);
    const movimiento = await service.registrarMovimiento(body, user.sub);
    return apiCreated(movimiento);
  } catch (e) { return apiError(e); }
}
