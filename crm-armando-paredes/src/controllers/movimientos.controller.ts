import type { Request, Response } from "express";
import * as service from "../services/movimientos.service.js";

export async function registrar(req: Request, res: Response) {
  const usuarioId = req.usuario?.sub;
  if (!usuarioId) return res.status(401).json({ error: "No autenticado" });

  const movimiento = await service.registrarMovimiento(req.body, usuarioId);
  res.status(201).json(movimiento);
}

export async function listar(req: Request, res: Response) {
  const { productoId, tipo, referenciaTipo, desde, hasta } = req.query;
  const movimientos = await service.listarMovimientos({
    productoId: productoId as string,
    tipo: tipo as string,
    referenciaTipo: referenciaTipo as string,
    desde: desde ? new Date(desde as string) : undefined,
    hasta: hasta ? new Date(hasta as string) : undefined,
  });
  res.json(movimientos);
}

export async function obtenerKardex(req: Request, res: Response) {
  const { desde, hasta } = req.query;
  const kardex = await service.obtenerKardexProducto(
    req.params.id,
    desde ? new Date(desde as string) : undefined,
    hasta ? new Date(hasta as string) : undefined
  );
  res.json(kardex);
}

export async function obtenerStock(req: Request, res: Response) {
  const stock = await service.obtenerStockCalculado(req.params.id);
  res.json({ productoId: req.params.id, stock });
}

export async function obtenerStocksGlobal(req: Request, res: Response) {
  const stocks = await service.obtenerStockTodosLosProductos();
  res.json(stocks);
}
