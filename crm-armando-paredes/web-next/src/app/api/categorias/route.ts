import { NextResponse } from "next/server";
import { parseBody, getSearchParams, extractToken, apiSuccess, apiCreated, apiError } from "@/lib/api-helpers";
import { verificarToken } from "@/lib/auth";
import * as service from "@/lib/services/categorias.service";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const params = getSearchParams(req);
    const categorias = await service.listarCategorias(
      params.activo === "true" ? true : params.activo === "false" ? false : undefined
    );
    return apiSuccess(categorias);
  } catch (e) { return apiError(e); }
}

export async function POST(req: Request) {
  try {
    const token = extractToken(req);
    if (!token) return apiError(new Error("No autorizado"));
    const user = verificarToken(token);
    if (!["ADMIN", "INVENTARIO"].includes(user.rol)) return apiError(new Error("Acceso denegado"));
    const body = await parseBody(req);
    const categoria = await service.crearCategoria(body);
    return apiCreated(categoria);
  } catch (e) { return apiError(e); }
}
