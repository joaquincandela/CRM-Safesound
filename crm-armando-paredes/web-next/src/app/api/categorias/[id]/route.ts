import { parseBody, extractToken, apiSuccess, apiNoContent, apiError } from "@/lib/api-helpers";
import { verificarToken } from "@/lib/auth";
import * as service from "@/lib/services/categorias.service";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const categoria = await service.obtenerCategoria(id);
    return new Response(JSON.stringify(categoria), { status: 200 });
  } catch (e) { return apiError(e); }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = extractToken(req);
    if (!token) return apiError(new Error("No autorizado"));
    const user = verificarToken(token);
    if (!["ADMIN", "INVENTARIO"].includes(user.rol)) return apiError(new Error("Acceso denegado"));
    const { id } = await params;
    const body = await parseBody(req);
    const categoria = await service.actualizarCategoria(id, body);
    return new Response(JSON.stringify(categoria), { status: 200 });
  } catch (e) { return apiError(e); }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = extractToken(req);
    if (!token) return apiError(new Error("No autorizado"));
    const user = verificarToken(token);
    if (!["ADMIN", "INVENTARIO"].includes(user.rol)) return apiError(new Error("Acceso denegado"));
    const { id } = await params;
    await service.eliminarCategoria(id);
    return apiNoContent();
  } catch (e) { return apiError(e); }
}
