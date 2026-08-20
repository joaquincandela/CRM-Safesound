import type { Request, Response } from "express";
import * as service from "../services/recepciones.service.js";

export async function crear(req: Request, res: Response) {
  const usuarioId = req.usuario?.sub;
  if (!usuarioId) return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "No autenticado" } });

  const recepcion = await service.crearRecepcion(req.body, usuarioId);
  res.status(201).json(recepcion);
}

export async function listar(req: Request, res: Response) {
  const { ordenId, desde, hasta } = req.query;
  const recepciones = await service.listarRecepciones({
    ordenId: ordenId as string,
    desde: desde ? new Date(desde as string) : undefined,
    hasta: hasta ? new Date(hasta as string) : undefined,
  });
  res.json(recepciones);
}

export async function obtener(req: Request, res: Response) {
  const recepcion = await service.obtenerRecepcion(req.params.id);
  res.json(recepcion);
}

export async function eliminar(req: Request, res: Response) {
  await service.eliminarRecepcion(req.params.id);
  res.status(204).send();
}
