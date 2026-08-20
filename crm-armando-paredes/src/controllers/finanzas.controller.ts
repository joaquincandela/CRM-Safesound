import type { Request, Response } from "express";
import * as service from "../services/finanzas.service.js";

export async function obtenerResumen(req: Request, res: Response) {
  const { desde, hasta } = req.query;
  
  if (!desde || !hasta) {
    return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Se requieren parámetros 'desde' y 'hasta'" } });
  }

  const resumen = await service.obtenerResumenFinanciero(
    new Date(desde as string),
    new Date(hasta as string)
  );
  res.json(resumen);
}
