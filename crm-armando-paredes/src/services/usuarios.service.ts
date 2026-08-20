import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";
import { NotFound } from "../lib/errors.js";
import type { CrearUsuarioInput, ActualizarUsuarioInput } from "../validators/usuarios.validator.js";

const selectPublico = {
  id: true,
  nombre: true,
  email: true,
  telefono: true,
  rol: true,
  activo: true,
  createdAt: true,
  updatedAt: true,
} as const;

export async function crearUsuario(data: CrearUsuarioInput) {
  const passwordHash = await bcrypt.hash(data.password, 10);
  const usuario = await prisma.usuario.create({
    data: {
      nombre: data.nombre,
      email: data.email,
      telefono: data.telefono,
      passwordHash,
      rol: data.rol,
      activo: data.activo,
    },
    select: selectPublico,
  });
  return usuario;
}

export async function listarUsuarios(filtros: { activo?: boolean; rol?: string }) {
  const where: any = {};
  if (filtros.activo !== undefined) where.activo = filtros.activo;
  if (filtros.rol) where.rol = filtros.rol;

  return prisma.usuario.findMany({
    where,
    select: selectPublico,
    orderBy: { createdAt: "asc" },
  });
}

export async function obtenerUsuario(id: string) {
  const usuario = await prisma.usuario.findUnique({ where: { id }, select: selectPublico });
  if (!usuario) throw NotFound("Usuario");
  return usuario;
}

export async function actualizarUsuario(id: string, data: ActualizarUsuarioInput) {
  const existe = await prisma.usuario.findUnique({ where: { id } });
  if (!existe) throw NotFound("Usuario");

  const usuario = await prisma.usuario.update({
    where: { id },
    data: {
      nombre: data.nombre,
      email: data.email,
      telefono: data.telefono,
      rol: data.rol,
      activo: data.activo,
      ...(data.password ? { passwordHash: await bcrypt.hash(data.password, 10) } : {}),
    },
    select: selectPublico,
  });
  return usuario;
}

export async function eliminarUsuario(id: string) {
  const existe = await prisma.usuario.findUnique({ where: { id } });
  if (!existe) throw NotFound("Usuario");

  // Baja lógica: conserva relaciones (movimientos, gastos, recepciones).
  return prisma.usuario.update({
    where: { id },
    data: { activo: false },
    select: selectPublico,
  });
}
