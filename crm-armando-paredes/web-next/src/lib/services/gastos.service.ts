import { prisma } from "@/lib/prisma";
import { NotFound } from "@/lib/errors";
import type { CrearGastoInput, ActualizarGastoInput } from "@/lib/validators/gastos.validator";

export async function crearGasto(data: CrearGastoInput, usuarioId: string) {
  return prisma.gasto.create({
    data: {
      ...data,
      comprobanteTipo: data.comprobanteTipo || null,
      comprobanteNumero: data.comprobanteNumero || null,
      proveedorId: data.proveedorId || null,
      archivoUrl: data.archivoUrl || null,
      fecha: new Date(data.fecha),
      usuarioId,
    },
    include: {
      proveedor: {
        select: { id: true, razonSocial: true, nombreComercial: true },
      },
    },
  });
}

export async function listarGastos(filtros: {
  proveedorId?: string;
  categoria?: string;
  desde?: Date;
  hasta?: Date;
}) {
  const where: any = {};
  
  if (filtros.proveedorId) where.proveedorId = filtros.proveedorId;
  if (filtros.categoria) where.categoria = filtros.categoria;
  if (filtros.desde || filtros.hasta) {
    where.fecha = {};
    if (filtros.desde) where.fecha.gte = filtros.desde;
    if (filtros.hasta) where.fecha.lte = filtros.hasta;
  }

  return prisma.gasto.findMany({
    where,
    include: {
      proveedor: {
        select: { id: true, razonSocial: true, nombreComercial: true },
      },
    },
    orderBy: { fecha: "desc" },
  });
}

export async function obtenerGasto(id: string) {
  const gasto = await prisma.gasto.findUnique({
    where: { id },
    include: {
      proveedor: true,
    },
  });
  if (!gasto) throw NotFound("Gasto");
  return gasto;
}

export async function actualizarGasto(id: string, data: ActualizarGastoInput) {
  const gasto = await prisma.gasto.findUnique({ where: { id } });
  if (!gasto) throw NotFound("Gasto");

  return prisma.gasto.update({
    where: { id },
    data: {
      ...data,
      comprobanteTipo: data.comprobanteTipo || null,
      comprobanteNumero: data.comprobanteNumero || null,
      proveedorId: data.proveedorId || null,
      archivoUrl: data.archivoUrl || null,
      fecha: data.fecha ? new Date(data.fecha) : undefined,
    },
    include: {
      proveedor: {
        select: { id: true, razonSocial: true, nombreComercial: true },
      },
    },
  });
}

export async function eliminarGasto(id: string) {
  const gasto = await prisma.gasto.findUnique({ where: { id } });
  if (!gasto) throw NotFound("Gasto");

  return prisma.gasto.delete({
    where: { id },
  });
}
