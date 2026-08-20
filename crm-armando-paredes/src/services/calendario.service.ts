import { prisma } from "../lib/prisma.js";
import { NotFound } from "../lib/errors.js";
import type { CrearTareaCalendarioInput, ActualizarTareaCalendarioInput } from "../validators/calendario.validator.js";

function rangoMes(fecha = new Date()) {
  const inicio = new Date(Date.UTC(fecha.getFullYear(), fecha.getMonth(), 1));
  const fin = new Date(Date.UTC(fecha.getFullYear(), fecha.getMonth() + 1, 1));
  return { inicio, fin };
}

/** Si el usuario es influencer, suma/resta el delta a la cantidadCompletada de su objetivo del mes. */
async function ajustarObjetivoInfluencer(usuarioId: string, delta: number) {
  if (delta === 0) return;
  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    select: { rol: true },
  });
  if (!usuario || usuario.rol !== "INFLUENCER") return;

  const influencer = await prisma.influencer.findUnique({
    where: { usuarioId },
    select: { id: true },
  });
  if (!influencer) return;

  const { inicio, fin } = rangoMes();
  const objetivo = await prisma.influencerObjetivo.findFirst({
    where: { influencerId: influencer.id, mes: { gte: inicio, lt: fin } },
  });
  if (!objetivo) return;

  const nuevo = Math.max(0, Math.min(objetivo.cantidadCompletada + delta, objetivo.cantidadMeta));
  if (nuevo !== objetivo.cantidadCompletada) {
    await prisma.influencerObjetivo.update({
      where: { id: objetivo.id },
      data: { cantidadCompletada: nuevo },
    });
  }
}

export async function listarTareasCalendario(usuarioId: string, desde?: Date, hasta?: Date) {
  const where: any = { usuarioId };
  if (desde || hasta) {
    where.fecha = {};
    if (desde) where.fecha.gte = desde;
    if (hasta) where.fecha.lte = hasta;
  }
  return prisma.tareaCalendario.findMany({
    where,
    orderBy: [{ fecha: "asc" }, { hora: "asc" }],
  });
}

async function validarTareaPropia(usuarioId: string, tareaId: string) {
  const tarea = await prisma.tareaCalendario.findFirst({
    where: { id: tareaId, usuarioId },
  });
  if (!tarea) throw NotFound("Tarea del calendario");
  return tarea;
}

export async function crearTareaCalendario(usuarioId: string, data: CrearTareaCalendarioInput) {
  const completada = data.completada ?? false;
  const tarea = await prisma.tareaCalendario.create({
    data: {
      usuarioId,
      titulo: data.titulo.trim(),
      descripcion: data.descripcion?.trim() || null,
      fecha: new Date(data.fecha),
      hora: data.hora?.trim() || null,
      completada,
    },
  });
  if (completada) await ajustarObjetivoInfluencer(usuarioId, 1);
  return tarea;
}

export async function actualizarTareaCalendario(usuarioId: string, tareaId: string, data: ActualizarTareaCalendarioInput) {
  const tarea = await validarTareaPropia(usuarioId, tareaId);
  if (data.completada !== undefined && data.completada !== tarea.completada) {
    await ajustarObjetivoInfluencer(usuarioId, data.completada ? 1 : -1);
  }
  return prisma.tareaCalendario.update({
    where: { id: tareaId },
    data: {
      titulo: data.titulo !== undefined ? data.titulo.trim() : undefined,
      descripcion: data.descripcion !== undefined ? data.descripcion.trim() || null : undefined,
      fecha: data.fecha !== undefined ? new Date(data.fecha) : undefined,
      hora: data.hora !== undefined ? data.hora.trim() || null : undefined,
      completada: data.completada,
    },
  });
}

export async function eliminarTareaCalendario(usuarioId: string, tareaId: string) {
  await validarTareaPropia(usuarioId, tareaId);
  return prisma.tareaCalendario.delete({ where: { id: tareaId } });
}
