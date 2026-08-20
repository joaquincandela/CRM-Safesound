import type { Request, Response } from "express";
import * as service from "../services/ordenesCompra.service.js";

export async function crear(req: Request, res: Response) {
  const orden = await service.crearOrdenCompra(req.body);
  res.status(201).json(orden);
}

export async function listar(req: Request, res: Response) {
  const { proveedorId, estado, desde, hasta } = req.query;
  const ordenes = await service.listarOrdenesCompra({
    proveedorId: proveedorId as string,
    estado: estado as string,
    desde: desde ? new Date(desde as string) : undefined,
    hasta: hasta ? new Date(hasta as string) : undefined,
  });
  res.json(ordenes);
}

export async function obtener(req: Request, res: Response) {
  const orden = await service.obtenerOrdenCompra(req.params.id);
  res.json(orden);
}

export async function actualizar(req: Request, res: Response) {
  const orden = await service.actualizarOrdenCompra(req.params.id, req.body);
  res.json(orden);
}

export async function eliminar(req: Request, res: Response) {
  await service.eliminarOrdenCompra(req.params.id);
  res.status(204).send();
}
