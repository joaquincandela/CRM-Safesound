import type { Request, Response } from "express";
import { buscarGlobal } from "../services/buscar.service.js";

export async function buscar(req: Request, res: Response) {
  const q = typeof req.query.q === "string" ? req.query.q : "";
  const resultados = await buscarGlobal(q);
  res.json(resultados);
}
