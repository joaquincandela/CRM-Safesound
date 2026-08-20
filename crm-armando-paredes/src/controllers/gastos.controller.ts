import type { Request, Response } from "express";
import * as service from "../services/gastos.service.js";

export async function crear(req: Request, res: Response) {
  const usuarioId = req.usuario?.sub;
  if (!usuarioId) return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "No autenticado" } });

  const gasto = await service.crearGasto(req.body, usuarioId);
  res.status(201).json(gasto);
}

export async function listar(req: Request, res: Response) {
  const { proveedorId, categoria, desde, hasta } = req.query;
  const gastos = await service.listarGastos({
    proveedorId: proveedorId as string,
    categoria: categoria as string,
    desde: desde ? new Date(desde as string) : undefined,
    hasta: hasta ? new Date(hasta as string) : undefined,
  });
  res.json(gastos);
}

export async function obtener(req: Request, res: Response) {
  const gasto = await service.obtenerGasto(req.params.id);
  res.json(gasto);
}

export async function actualizar(req: Request, res: Response) {
  const gasto = await service.actualizarGasto(req.params.id, req.body);
  res.json(gasto);
}

export async function eliminar(req: Request, res: Response) {
  await service.eliminarGasto(req.params.id);
  res.status(204).send();
}
