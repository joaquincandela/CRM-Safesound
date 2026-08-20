import { prisma } from "@/lib/prisma";
import { NotFound } from "@/lib/errors";
import type { CrearProveedorInput, ActualizarProveedorInput } from "@/lib/validators/proveedores.validator";

export async function crearProveedor(data: CrearProveedorInput) {
  return prisma.proveedor.create({
    data,
    include: {
      _count: {
        select: { ordenes: true },
      },
    },
  });
}

export async function listarProveedores(filtros: {
  activo?: boolean;
  buscar?: string;
}) {
  const where: any = {};
  
  if (filtros.activo !== undefined) where.activo = filtros.activo;
  if (filtros.buscar) {
    where.OR = [
      { razonSocial: { contains: filtros.buscar, mode: "insensitive" } },
      { nombreComercial: { contains: filtros.buscar, mode: "insensitive" } },
      { numeroDocumento: { contains: filtros.buscar, mode: "insensitive" } },
      { email: { contains: filtros.buscar, mode: "insensitive" } },
    ];
  }

  return prisma.proveedor.findMany({
    where,
    include: {
      _count: {
        select: { ordenes: true },
      },
    },
    orderBy: { razonSocial: "asc" },
  });
}

export async function obtenerProveedor(id: string) {
  const proveedor = await prisma.proveedor.findUnique({
    where: { id },
    include: {
      ordenes: {
        orderBy: { fechaOrden: "desc" },
        take: 10,
      },
      gastos: {
        orderBy: { fecha: "desc" },
        take: 10,
      },
    },
  });
  if (!proveedor) throw NotFound("Proveedor");
  return proveedor;
}

export async function actualizarProveedor(id: string, data: ActualizarProveedorInput) {
  const proveedor = await prisma.proveedor.findUnique({ where: { id } });
  if (!proveedor) throw NotFound("Proveedor");

  return prisma.proveedor.update({
    where: { id },
    data,
  });
}

export async function eliminarProveedor(id: string) {
  const proveedor = await prisma.proveedor.findUnique({
    where: { id },
    include: { _count: { select: { ordenes: true } } },
  });
  if (!proveedor) throw NotFound("Proveedor");
  if (proveedor._count.ordenes > 0) {
    throw new Error("No se puede eliminar un proveedor con órdenes de compra asociadas");
  }

  return prisma.proveedor.delete({
    where: { id },
  });
}
