import type { Request, Response } from "express";
import * as service from "../services/influencers.service.js";

export async function crear(req: Request, res: Response) {
  const influencer = await service.crearInfluencer(req.body);
  res.status(201).json(influencer);
}

export async function listar(req: Request, res: Response) {
  const activo = req.query.activo === "true" ? true : req.query.activo === "false" ? false : undefined;
  const influencers = await service.listarInfluencers(activo);
  res.json(influencers);
}

export async function obtener(req: Request, res: Response) {
  const influencer = await service.obtenerInfluencer(req.params.id);
  res.json(influencer);
}

export async function mi(req: Request, res: Response) {
  const influencer = await service.obtenerInfluencerPorUsuario(req.usuario!.sub);
  res.json(influencer);
}

export async function actualizar(req: Request, res: Response) {
  const influencer = await service.actualizarInfluencer(req.params.id, req.body);
  res.json(influencer);
}

export async function eliminar(req: Request, res: Response) {
  await service.eliminarInfluencer(req.params.id);
  res.status(204).send();
}

export async function crearMetrica(req: Request, res: Response) {
  const metrica = await service.crearMetrica(req.params.id, req.body);
  res.status(201).json(metrica);
}

export async function actualizarMetrica(req: Request, res: Response) {
  const metrica = await service.actualizarMetrica(req.params.id, req.params.metricaId, req.body);
  res.json(metrica);
}

export async function listarMetricas(req: Request, res: Response) {
  const metricas = await service.listarMetricas(req.params.id);
  res.json(metricas);
}

export async function topInfluencers(req: Request, res: Response) {
  const limite = Math.min(parseInt(req.query.limite as string) || 5, 20);
  const top = await service.obtenerTopInfluencers(limite);
  res.json(top);
}

export async function crearTarea(req: Request, res: Response) {
  const tarea = await service.crearTarea(req.params.id, req.body);
  res.status(201).json(tarea);
}

export async function actualizarTarea(req: Request, res: Response) {
  const tarea = await service.actualizarTarea(req.params.id, req.params.tareaId, req.body);
  res.json(tarea);
}

export async function eliminarTarea(req: Request, res: Response) {
  await service.eliminarTarea(req.params.id, req.params.tareaId);
  res.status(204).send();
}

export async function marcarMiTarea(req: Request, res: Response) {
  const tarea = await service.actualizarMiTarea(req.usuario!.sub, req.params.tareaId, req.body.cantidadCompletada);
  res.json(tarea);
}

export async function crearObjetivo(req: Request, res: Response) {
  const { objetivo, creado } = await service.crearObjetivo(req.params.id, req.body);
  res.status(creado ? 201 : 200).json(objetivo);
}

export async function actualizarObjetivo(req: Request, res: Response) {
  const objetivo = await service.actualizarObjetivo(req.params.id, req.params.objetivoId, req.body);
  res.json(objetivo);
}

export async function eliminarObjetivo(req: Request, res: Response) {
  await service.eliminarObjetivo(req.params.id, req.params.objetivoId);
  res.status(204).send();
}

export async function marcarMiObjetivo(req: Request, res: Response) {
  const objetivo = await service.marcarMiObjetivo(req.usuario!.sub, req.params.objetivoId, req.body.cantidadCompletada);
  res.json(objetivo);
}
