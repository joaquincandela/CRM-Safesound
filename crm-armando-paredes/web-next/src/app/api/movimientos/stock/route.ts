import { apiSuccess, apiError } from "@/lib/api-helpers";
import * as service from "@/lib/services/movimientos.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const stocks = await service.obtenerStockTodosLosProductos();
    return apiSuccess(stocks);
  } catch (e) { return apiError(e); }
}
