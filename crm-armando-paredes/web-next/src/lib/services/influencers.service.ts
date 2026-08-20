import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { NotFound } from "@/lib/errors";
import type {
  CrearInfluencerInput,
  ActualizarInfluencerInput,
  CrearMetricaInput,
  CrearTareaInput,
  ActualizarTareaInput,
  CrearObjetivoInput,
  ActualizarObjetivoInput,
} from "@/lib/validators/influencers.validator";

function rangoMes(fecha = new Date()) {
  const inicio = new Date(Date.UTC(fecha.getFullYear(), fecha.getMonth(), 1));
  const fin = new Date(Date.UTC(fecha.getFullYear(), fecha.getMonth() + 1, 1));
  return { inicio, fin };
}

export async function crearInfluencer(data: CrearInfluencerInput) {
  const { email, password, ...influencerData } = data;
  const passwordHash = await bcrypt.hash(password, 10);

  return prisma.$transaction(async (tx) => {
    const usuario = await tx.usuario.create({
      data: {
        nombre: influencerData.nombre,
        email,
        passwordHash,
        rol: "INFLUENCER",
        activo: influencerData.activo ?? true,
      },
      select: { id: true },
    });
    return tx.influencer.create({
      data: {
        ...influencerData,
        usuarioId: usuario.id,
      },
      include: { usuario: true },
    });
  });
}

export async function listarInfluencers(activo?: boolean) {
  const where: any = {};
  if (activo !== undefined) where.activo = activo;
  const { inicio, fin } = rangoMes();
  return prisma.influencer.findMany({
    where,
    orderBy: { nombre: "asc" },
    include: {
      usuario: { select: { id: true, email: true, activo: true } },
      metricas: { orderBy: { fechaInicio: "desc" }, take: 1 },
      tareas: { where: { activo: true, mes: { gte: inicio, lt: fin } }, orderBy: { createdAt: "asc" } },
      objetivos: { where: { mes: { gte: inicio, lt: fin } }, orderBy: { mes: "desc" } },
    },
  });
}

export async function obtenerInfluencer(id: string) {
  const influencer = await prisma.influencer.findUnique({
    where: { id },
    include: {
      usuario: { select: { id: true, email: true, activo: true } },
      metricas: { orderBy: { fechaInicio: "desc" }, take: 12 },
      tareas: { orderBy: [{ mes: "desc" }, { createdAt: "asc" }], take: 60 },
      objetivos: { orderBy: { mes: "desc" }, take: 24 },
    },
  });
  if (!influencer) throw NotFound("Influencer");
  return influencer;
}

export async function obtenerInfluencerPorUsuario(usuarioId: string) {
  const influencer = await prisma.influencer.findUnique({
    where: { usuarioId },
    include: {
      usuario: { select: { id: true, email: true, activo: true } },
      metricas: { orderBy: { fechaInicio: "desc" }, take: 12 },
      tareas: { where: { activo: true }, orderBy: [{ mes: "desc" }, { createdAt: "asc" }], take: 60 },
      objetivos: { orderBy: { mes: "desc" }, take: 24 },
    },
  });
  if (!influencer) throw NotFound("Influencer");
  return influencer;
}

export async function actualizarInfluencer(id: string, data: ActualizarInfluencerInput) {
  const existing = await prisma.influencer.findUnique({ where: { id } });
  if (!existing) throw NotFound("Influencer");

  const { email, password, ...influencerData } = data;

  return prisma.$transaction(async (tx) => {
    if (email || password) {
      await tx.usuario.update({
        where: { id: existing.usuarioId },
        data: {
          ...(email ? { email } : {}),
          ...(password ? { passwordHash: await bcrypt.hash(password, 10) } : {}),
          ...(influencerData.activo !== undefined ? { activo: influencerData.activo } : {}),
        },
      });
    }
    return tx.influencer.update({
      where: { id },
      data: influencerData,
      include: { usuario: { select: { id: true, email: true, activo: true } } },
    });
  });
}

export async function eliminarInfluencer(id: string) {
  const existing = await prisma.influencer.findUnique({ where: { id } });
  if (!existing) throw NotFound("Influencer");

  return prisma.$transaction(async (tx) => {
    await tx.influencer.delete({ where: { id } });
    await tx.usuario.delete({ where: { id: existing.usuarioId } });
  });
}

export async function crearMetrica(influencerId: string, data: CrearMetricaInput) {
  const existing = await prisma.influencer.findUnique({ where: { id: influencerId } });
  if (!existing) throw NotFound("Influencer");
  return prisma.influencerMetrica.create({
    data: { influencerId, ...data, fechaInicio: new Date(data.fechaInicio) },
  });
}

export async function actualizarMetrica(influencerId: string, metricaId: string, data: Partial<CrearMetricaInput>) {
  const metrica = await prisma.influencerMetrica.findFirst({
    where: { id: metricaId, influencerId },
  });
  if (!metrica) throw NotFound("Métrica");
  return prisma.influencerMetrica.update({
    where: { id: metricaId },
    data: { ...data, fechaInicio: data.fechaInicio ? new Date(data.fechaInicio) : undefined },
  });
}

export async function listarMetricas(influencerId: string) {
  const existing = await prisma.influencer.findUnique({ where: { id: influencerId } });
  if (!existing) throw NotFound("Influencer");
  return prisma.influencerMetrica.findMany({
    where: { influencerId },
    orderBy: { fechaInicio: "desc" },
    take: 52,
  });
}

export async function obtenerTopInfluencers(limite = 5) {
  const influencers = await prisma.influencer.findMany({
    where: { activo: true },
    include: {
      metricas: { orderBy: { fechaInicio: "desc" }, take: 1 },
    },
  });
  return influencers
    .map((inf) => ({
      id: inf.id,
      nombre: inf.nombre,
      metaPublicaciones: inf.metaPublicaciones,
      instagram: inf.instagram,
      tiktok: inf.tiktok,
      youtube: inf.youtube,
      ultimaMetrica: inf.metricas[0] ?? null,
    }))
    .sort((a, b) => (b.ultimaMetrica?.engagement ?? 0) - (a.ultimaMetrica?.engagement ?? 0))
    .slice(0, limite);
}

// ============================================================================
// TAREAS MENSUALES
// ============================================================================

async function validarTareaDeInfluencer(influencerId: string, tareaId: string) {
  const tarea = await prisma.influencerTarea.findFirst({
    where: { id: tareaId, influencerId },
  });
  if (!tarea) throw NotFound("Tarea");
  return tarea;
}

export async function crearTarea(influencerId: string, data: CrearTareaInput) {
  const existing = await prisma.influencer.findUnique({ where: { id: influencerId } });
  if (!existing) throw NotFound("Influencer");
  return prisma.influencerTarea.create({
    data: {
      influencerId,
      mes: new Date(data.mes),
      descripcion: data.descripcion,
      cantidadMeta: data.cantidadMeta,
    },
  });
}

export async function actualizarTarea(influencerId: string, tareaId: string, data: ActualizarTareaInput) {
  const tarea = await validarTareaDeInfluencer(influencerId, tareaId);
  const meta = data.cantidadMeta ?? tarea.cantidadMeta;
  const completada =
    data.cantidadCompletada !== undefined
      ? Math.max(0, Math.min(data.cantidadCompletada, meta))
      : tarea.cantidadCompletada;
  return prisma.influencerTarea.update({
    where: { id: tareaId },
    data: {
      descripcion: data.descripcion,
      cantidadMeta: data.cantidadMeta,
      cantidadCompletada: completada,
      activo: data.activo,
    },
  });
}

export async function eliminarTarea(influencerId: string, tareaId: string) {
  await validarTareaDeInfluencer(influencerId, tareaId);
  return prisma.influencerTarea.delete({ where: { id: tareaId } });
}

export async function actualizarMiTarea(usuarioId: string, tareaId: string, cantidadCompletada: number) {
  const influencer = await prisma.influencer.findUnique({ where: { usuarioId } });
  if (!influencer) throw NotFound("Influencer");
  const tarea = await validarTareaDeInfluencer(influencer.id, tareaId);
  const clamped = Math.max(0, Math.min(cantidadCompletada, tarea.cantidadMeta));
  return prisma.influencerTarea.update({
    where: { id: tareaId },
    data: { cantidadCompletada: clamped },
  });
}

// ============================================================================
// OBJETIVO MENSUAL
// ============================================================================

async function validarObjetivoDeInfluencer(influencerId: string, objetivoId: string) {
  const objetivo = await prisma.influencerObjetivo.findFirst({
    where: { id: objetivoId, influencerId },
  });
  if (!objetivo) throw NotFound("Objetivo");
  return objetivo;
}

/** Crea o actualiza el objetivo de un mes (uno por influencer y mes). */
export async function crearObjetivo(influencerId: string, data: CrearObjetivoInput) {
  const existing = await prisma.influencer.findUnique({ where: { id: influencerId } });
  if (!existing) throw NotFound("Influencer");
  const mes = new Date(data.mes);
  const previo = await prisma.influencerObjetivo.findUnique({
    where: { influencerId_mes: { influencerId, mes } },
  });
  if (previo) {
    const objetivo = await prisma.influencerObjetivo.update({
      where: { id: previo.id },
      data: { descripcion: data.descripcion, cantidadMeta: data.cantidadMeta },
    });
    return { objetivo, creado: false };
  }
  const objetivo = await prisma.influencerObjetivo.create({
    data: { influencerId, mes, descripcion: data.descripcion, cantidadMeta: data.cantidadMeta },
  });
  return { objetivo, creado: true };
}

export async function actualizarObjetivo(influencerId: string, objetivoId: string, data: ActualizarObjetivoInput) {
  const objetivo = await validarObjetivoDeInfluencer(influencerId, objetivoId);
  const meta = data.cantidadMeta ?? objetivo.cantidadMeta;
  const completada =
    data.cantidadCompletada !== undefined
      ? Math.max(0, Math.min(data.cantidadCompletada, meta))
      : objetivo.cantidadCompletada;
  return prisma.influencerObjetivo.update({
    where: { id: objetivoId },
    data: { descripcion: data.descripcion, cantidadMeta: data.cantidadMeta, cantidadCompletada: completada },
  });
}

export async function eliminarObjetivo(influencerId: string, objetivoId: string) {
  await validarObjetivoDeInfluencer(influencerId, objetivoId);
  return prisma.influencerObjetivo.delete({ where: { id: objetivoId } });
}

export async function marcarMiObjetivo(usuarioId: string, objetivoId: string, cantidadCompletada: number) {
  const influencer = await prisma.influencer.findUnique({ where: { usuarioId } });
  if (!influencer) throw NotFound("Influencer");
  const objetivo = await validarObjetivoDeInfluencer(influencer.id, objetivoId);
  const clamped = Math.max(0, Math.min(cantidadCompletada, objetivo.cantidadMeta));
  return prisma.influencerObjetivo.update({
    where: { id: objetivoId },
    data: { cantidadCompletada: clamped },
  });
}
