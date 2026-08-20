import type { Request, Response } from "express";
import * as service from "../services/auth.service.js";

/** POST /auth/login — emite un JWT para el usuario. */
export async function login(req: Request, res: Response) {
  const result = await service.login(req.body.email, req.body.password);
  res.json(result);
}
