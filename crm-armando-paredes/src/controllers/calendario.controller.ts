import type { Request, Response } from "express";
import * as service from "../services/calendario.service.js";

export async function listar(req: Request, res: Response) {
  const { desde, hasta } = req.query;
  const tareas = await service.listarTareasCalendario(
    req.usuario!.sub,
    typeof desde === "string" ? new Date(desde) : undefined,
    typeof hasta === "string" ? new Date(hasta) : undefined,
  );
  res.json(tareas);
}

export async function crear(req: Request, res: Response) {
  const tarea = await service.crearTareaCalendario(req.usuario!.sub, req.body);
  res.status(201).json(tarea);
}

export async function actualizar(req: Request, res: Response) {
  const tarea = await service.actualizarTareaCalendario(req.usuario!.sub, req.params.id, req.body);
  res.json(tarea);
}

export async function eliminar(req: Request, res: Response) {
  await service.eliminarTareaCalendario(req.usuario!.sub, req.params.id);
  res.status(204).send();
}
