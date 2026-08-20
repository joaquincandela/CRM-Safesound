import { extractToken, apiSuccess, apiError } from "@/lib/api-helpers";
import { verificarToken } from "@/lib/auth";
import * as service from "@/lib/services/dashboard.service";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const token = extractToken(req);
    if (!token) return apiError(new Error("No autorizado"));
    verificarToken(token);
    const kpis = await service.obtenerKPIsDashboard();
    return apiSuccess(kpis);
  } catch (e) {
    console.error("Dashboard KPI error:", e);
    return apiError(e);
  }
}
