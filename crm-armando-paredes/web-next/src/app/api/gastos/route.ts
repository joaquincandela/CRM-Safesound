import { parseBody, getSearchParams, extractToken, apiSuccess, apiCreated, apiError } from "@/lib/api-helpers";
import { verificarToken } from "@/lib/auth";
import * as service from "@/lib/services/gastos.service";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const token = extractToken(req);
    if (!token) return apiError(new Error("No autorizado"));
    verificarToken(token);
    const params = getSearchParams(req);
    const gastos = await service.listarGastos({
      proveedorId: params.proveedorId,
      categoria: params.categoria,
      desde: params.desde ? new Date(params.desde) : undefined,
      hasta: params.hasta ? new Date(params.hasta) : undefined,
    });
    return apiSuccess(gastos);
  } catch (e) { return apiError(e); }
}

export async function POST(req: Request) {
  try {
    const token = extractToken(req);
    if (!token) return apiError(new Error("No autorizado"));
    const user = verificarToken(token);
    if (user.rol !== "ADMIN") return apiError(new Error("Acceso denegado"));
    const body = await parseBody(req);
    const gasto = await service.crearGasto(body, user.sub);
    return apiCreated(gasto);
  } catch (e) { return apiError(e); }
}
