import type { Request, Response } from "express";
import * as service from "../services/usuarios.service.js";

export async function crear(req: Request, res: Response) {
  const usuario = await service.crearUsuario(req.body);
  res.status(201).json(usuario);
}

export async function listar(req: Request, res: Response) {
  const { activo, rol } = req.query;
  const usuarios = await service.listarUsuarios({
    activo: activo === "true" ? true : activo === "false" ? false : undefined,
    rol: rol as string,
  });
  res.json(usuarios);
}

export async function obtener(req: Request, res: Response) {
  const usuario = await service.obtenerUsuario(req.params.id);
  res.json(usuario);
}

export async function actualizar(req: Request, res: Response) {
  const usuario = await service.actualizarUsuario(req.params.id, req.body);
  res.json(usuario);
}

export async function eliminar(req: Request, res: Response) {
  await service.eliminarUsuario(req.params.id);
  res.status(204).send();
}
