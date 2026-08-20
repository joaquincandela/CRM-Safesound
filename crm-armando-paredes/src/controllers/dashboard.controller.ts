import type { Request, Response } from "express";
import * as service from "../services/dashboard.service.js";

export async function obtenerKPIs(req: Request, res: Response) {
  try {
    const kpis = await service.obtenerKPIsDashboard();
    res.json(kpis);
  } catch (error) {
    console.error("Dashboard KPI error:", error);
    res.status(500).json({
      error: { code: "DASHBOARD_ERROR", message: "Error al obtener KPIs del dashboard" },
    });
  }
}
