import { apiSuccess, apiError } from "@/lib/api-helpers";
import * as service from "@/lib/services/movimientos.service";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const stock = await service.obtenerStockCalculado(id);
    return apiSuccess({ productoId: id, stock });
  } catch (e) { return apiError(e); }
}
