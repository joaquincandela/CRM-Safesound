import { parseBody, getSearchParams, extractToken, apiSuccess, apiCreated, apiError } from "@/lib/api-helpers";
import { verificarToken } from "@/lib/auth";
import * as service from "@/lib/services/productos.service";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const params = getSearchParams(req);
    const productos = await service.listarProductos({
      categoriaId: params.categoriaId,
      estado: params.estado as "ACTIVO" | "INACTIVO" | undefined,
      buscar: params.buscar,
    });
    return apiSuccess(productos);
  } catch (e) { return apiError(e); }
}

export async function POST(req: Request) {
  try {
    const token = extractToken(req);
    if (!token) return apiError(new Error("No autorizado"));
    const user = verificarToken(token);
    if (!["ADMIN", "INVENTARIO"].includes(user.rol)) return apiError(new Error("Acceso denegado"));
    const body = await parseBody(req);
    const producto = await service.crearProducto(body, user.sub);
    return apiCreated(producto);
  } catch (e) { return apiError(e); }
}
