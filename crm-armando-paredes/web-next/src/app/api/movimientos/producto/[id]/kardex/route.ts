import { getSearchParams, apiSuccess, apiError } from "@/lib/api-helpers";
import * as service from "@/lib/services/movimientos.service";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const query = getSearchParams(req);
    const kardex = await service.obtenerKardexProducto(
      id,
      query.desde ? new Date(query.desde) : undefined,
      query.hasta ? new Date(query.hasta) : undefined
    );
    return apiSuccess(kardex);
  } catch (e) { return apiError(e); }
}
