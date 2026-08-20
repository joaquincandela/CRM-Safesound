import { extractToken, apiSuccess, apiError } from "@/lib/api-helpers";
import { verificarToken } from "@/lib/auth";
import * as service from "@/lib/services/costeoImportacion.service";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = extractToken(req);
    if (!token) return apiError(new Error("No autorizado"));
    const user = verificarToken(token);
    if (!["ADMIN", "INVENTARIO", "OPERACIONES"].includes(user.rol)) return apiError(new Error("Acceso denegado"));
    const { id } = await params;
    const costeo = await service.confirmarCosteo(id);
    return apiSuccess(costeo);
  } catch (e) { return apiError(e); }
}
