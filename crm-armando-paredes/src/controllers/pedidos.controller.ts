import type { Request, Response } from "express";
import * as service from "../services/pedidos.service.js";

export async function crear(req: Request, res: Response) {
  const usuarioId = req.usuario?.sub;
  if (!usuarioId) return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "No autenticado" } });
  const pedido = await service.crearPedido(req.body, usuarioId);
  res.status(201).json(pedido);
}

export async function listar(req: Request, res: Response) {
  const { clienteId, estado, desde, hasta, buscar } = req.query;
  const pedidos = await service.listarPedidos({
    clienteId: clienteId as string,
    estado: estado as string,
    desde: desde ? new Date(desde as string) : undefined,
    hasta: hasta ? new Date(hasta as string) : undefined,
    buscar: buscar as string,
  });
  res.json(pedidos);
}

export async function obtener(req: Request, res: Response) {
  const pedido = await service.obtenerPedido(req.params.id);
  res.json(pedido);
}

export async function actualizar(req: Request, res: Response) {
  const usuarioId = req.usuario?.sub;
  if (!usuarioId) return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "No autenticado" } });
  const pedido = await service.actualizarPedido(req.params.id, req.body, usuarioId);
  res.json(pedido);
}

export async function eliminar(req: Request, res: Response) {
  const usuarioId = req.usuario?.sub;
  await service.eliminarPedido(req.params.id, usuarioId);
  res.status(204).send();
}
