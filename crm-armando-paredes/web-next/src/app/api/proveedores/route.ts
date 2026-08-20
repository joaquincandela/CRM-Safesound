import { parseBody, getSearchParams, extractToken, apiSuccess, apiCreated, apiError } from "@/lib/api-helpers";
import { verificarToken } from "@/lib/auth";
import * as service from "@/lib/services/proveedores.service";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const params = getSearchParams(req);
    const proveedores = await service.listarProveedores({
      activo: params.activo === "true" ? true : params.activo === "false" ? false : undefined,
      buscar: params.buscar,
    });
    return apiSuccess(proveedores);
  } catch (e) { return apiError(e); }
}

export async function POST(req: Request) {
  try {
    const token = extractToken(req);
    if (!token) return apiError(new Error("No autorizado"));
    const user = verificarToken(token);
    if (!["ADMIN", "OPERACIONES"].includes(user.rol)) return apiError(new Error("Acceso denegado"));
    const body = await parseBody(req);
    const proveedor = await service.crearProveedor(body);
    return apiCreated(proveedor);
  } catch (e) { return apiError(e); }
}
