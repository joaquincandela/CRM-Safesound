import type { Request, Response } from "express";
import * as service from "../services/proveedores.service.js";

export async function crear(req: Request, res: Response) {
  const proveedor = await service.crearProveedor(req.body);
  res.status(201).json(proveedor);
}

export async function listar(req: Request, res: Response) {
  const { activo, buscar } = req.query;
  const proveedores = await service.listarProveedores({
    activo: activo === "true" ? true : activo === "false" ? false : undefined,
    buscar: buscar as string,
  });
  res.json(proveedores);
}

export async function obtener(req: Request, res: Response) {
  const proveedor = await service.obtenerProveedor(req.params.id);
  res.json(proveedor);
}

export async function actualizar(req: Request, res: Response) {
  const proveedor = await service.actualizarProveedor(req.params.id, req.body);
  res.json(proveedor);
}

export async function eliminar(req: Request, res: Response) {
  await service.eliminarProveedor(req.params.id);
  res.status(204).send();
}
