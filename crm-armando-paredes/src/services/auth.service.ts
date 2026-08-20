import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";
import { env } from "../config/env.js";
import { Unauthorized } from "../lib/errors.js";

// ============================================================================
// AUTH — login de usuarios y emisión de JWT
// ============================================================================

export type JwtPayload = { sub: string; email: string; nombre: string; rol: string };

export async function login(email: string, password: string) {
  const usuario = await prisma.usuario.findUnique({ where: { email } });
  if (!usuario || !usuario.activo || !usuario.passwordHash) throw Unauthorized("Credenciales inválidas");

  const ok = await bcrypt.compare(password, usuario.passwordHash);
  if (!ok) throw Unauthorized("Credenciales inválidas");

  const payload: JwtPayload = { sub: usuario.id, email: usuario.email, nombre: usuario.nombre, rol: usuario.rol };
  const token = jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"] });

  return { token, usuario: payload };
}

/** Helper para crear/actualizar la contraseña de un usuario (seed/admin). */
export async function setPassword(usuarioId: string, password: string) {
  const passwordHash = await bcrypt.hash(password, 10);
  return prisma.usuario.update({ where: { id: usuarioId }, data: { passwordHash } });
}

export function verificarToken(token: string): JwtPayload {
  try {
    return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
  } catch {
    throw Unauthorized("Token inválido o expirado");
  }
}
