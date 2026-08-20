import type { Request, Response } from "express";
import * as service from "../services/categorias.service.js";
import { crearCategoriaSchema, actualizarCategoriaSchema } from "../validators/categorias.validator.js";
import { validate } from "../middleware/validate.js";

export async function crear(req: Request, res: Response) {
  const categoria = await service.crearCategoria(req.body);
  res.status(201).json(categoria);
}

export async function listar(req: Request, res: Response) {
  const { activo } = req.query;
  const categorias = await service.listarCategorias(
    activo === "true" ? true : activo === "false" ? false : undefined
  );
  res.json(categorias);
}

export async function obtener(req: Request, res: Response) {
  const categoria = await service.obtenerCategoria(req.params.id);
  res.json(categoria);
}

export async function actualizar(req: Request, res: Response) {
  const categoria = await service.actualizarCategoria(req.params.id, req.body);
  res.json(categoria);
}

export async function eliminar(req: Request, res: Response) {
  await service.eliminarCategoria(req.params.id);
  res.status(204).send();
}
