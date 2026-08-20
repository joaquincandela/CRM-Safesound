import type { Request, Response } from "express";
import * as service from "../services/productos.service.js";
import { crearProductoSchema, actualizarProductoSchema } from "../validators/productos.validator.js";
import { validate } from "../middleware/validate.js";

export async function crear(req: Request, res: Response) {
  const usuarioId = req.usuario?.sub;
  const producto = await service.crearProducto(req.body, usuarioId);
  res.status(201).json(producto);
}

export async function listar(req: Request, res: Response) {
  const { categoriaId, estado, buscar } = req.query;
  const productos = await service.listarProductos({
    categoriaId: categoriaId as string,
    estado: estado as "ACTIVO" | "INACTIVO",
    buscar: buscar as string,
  });
  res.json(productos);
}

export async function obtener(req: Request, res: Response) {
  const producto = await service.obtenerProducto(req.params.id);
  res.json(producto);
}

export async function actualizar(req: Request, res: Response) {
  const producto = await service.actualizarProducto(req.params.id, req.body);
  res.json(producto);
}

export async function eliminar(req: Request, res: Response) {
  await service.eliminarProducto(req.params.id);
  res.status(204).send();
}

export async function obtenerStock(req: Request, res: Response) {
  const stock = await service.obtenerStockActual(req.params.id);
  res.json({ productoId: req.params.id, stock });
}
