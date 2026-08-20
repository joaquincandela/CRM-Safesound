import type { Request, Response } from "express";
import * as service from "../services/costeoImportacion.service.js";

export async function crear(req: Request, res: Response) {
  const usuarioId = req.usuario?.sub;
  if (!usuarioId) return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "No autenticado" } });

  const costeo = await service.crearCosteo(req.body, usuarioId);
  res.status(201).json(costeo);
}

export async function listar(req: Request, res: Response) {
  const { recepcionId, desde, hasta } = req.query;
  const costeos = await service.listarCosteos({
    recepcionId: recepcionId as string,
    desde: desde ? new Date(desde as string) : undefined,
    hasta: hasta ? new Date(hasta as string) : undefined,
  });
  res.json(costeos);
}

export async function obtener(req: Request, res: Response) {
  const costeo = await service.obtenerCosteo(req.params.id);
  res.json(costeo);
}

export async function actualizar(req: Request, res: Response) {
  const costeo = await service.actualizarCosteo(req.params.id, req.body);
  res.json(costeo);
}

export async function confirmar(req: Request, res: Response) {
  const costeo = await service.confirmarCosteo(req.params.id);
  res.json(costeo);
}

export async function eliminar(req: Request, res: Response) {
  const costeo = await service.eliminarCosteo(req.params.id);
  res.json(costeo);
}
