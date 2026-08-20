import { prisma } from "@/lib/prisma";
import { NotFound } from "@/lib/errors";
import { eliminarCosteoTx } from "./costeoImportacion.service";
import type { CrearOrdenCompraInput, ActualizarOrdenCompraInput } from "@/lib/validators/ordenesCompra.validator";

export async function crearOrdenCompra(data: CrearOrdenCompraInput) {
  return prisma.$transaction(async (tx) => {
    const moneda = data.moneda || "USD";
    const impuestos = data.impuestos ?? 0;
    const estado = data.estado || "BORRADOR";

    // Calcular subtotal
    const subtotal = data.lineas.reduce((sum, linea) => {
      return sum + (linea.cantidad * linea.costoUnitario);
    }, 0);

    const total = subtotal + impuestos;

    // Generar número de orden
    const ultimaOrden = await tx.ordenCompra.findFirst({
      orderBy: { numero: "desc" },
      select: { numero: true },
    });
    const numeroSiguiente = ultimaOrden 
      ? (parseInt(ultimaOrden.numero.replace("OC-", "")) + 1).toString().padStart(6, "0")
      : "000001";

    const orden = await tx.ordenCompra.create({
      data: {
        numero: `OC-${numeroSiguiente}`,
        proveedorId: data.proveedorId,
        estado,
        moneda,
        subtotal,
        impuestos,
        total,
        fechaEstimada: data.fechaEstimada ? new Date(data.fechaEstimada) : undefined,
        notas: data.notas,
        lineas: {
          create: data.lineas.map(linea => ({
            productoId: linea.productoId,
            cantidad: linea.cantidad,
            costoUnitario: linea.costoUnitario,
            subtotal: linea.cantidad * linea.costoUnitario,
          })),
        },
      },
      include: {
        proveedor: {
          select: { id: true, razonSocial: true, nombreComercial: true },
        },
        lineas: {
          include: {
            producto: {
              select: { id: true, sku: true, nombre: true },
            },
          },
        },
      },
    });

    return orden;
  });
}

export async function listarOrdenesCompra(filtros: {
  proveedorId?: string;
  estado?: string;
  desde?: Date;
  hasta?: Date;
}) {
  const where: any = {};
  
  if (filtros.proveedorId) where.proveedorId = filtros.proveedorId;
  if (filtros.estado) where.estado = filtros.estado;
  if (filtros.desde || filtros.hasta) {
    where.fechaOrden = {};
    if (filtros.desde) where.fechaOrden.gte = filtros.desde;
    if (filtros.hasta) where.fechaOrden.lte = filtros.hasta;
  }

  return prisma.ordenCompra.findMany({
    where,
    include: {
      proveedor: {
        select: { id: true, razonSocial: true, nombreComercial: true },
      },
      lineas: {
        include: {
          producto: {
            select: { id: true, sku: true, nombre: true },
          },
        },
      },
      recepciones: {
        select: { id: true, fecha: true },
      },
    },
    orderBy: { fechaOrden: "desc" },
  });
}

export async function obtenerOrdenCompra(id: string) {
  const orden = await prisma.ordenCompra.findUnique({
    where: { id },
    include: {
      proveedor: true,
      lineas: {
        include: {
          producto: true,
        },
      },
      recepciones: {
        include: {
          lineas: true,
        },
      },
    },
  });
  if (!orden) throw NotFound("Orden de Compra");
  return orden;
}

export async function actualizarOrdenCompra(id: string, data: ActualizarOrdenCompraInput) {
  const orden = await prisma.ordenCompra.findUnique({ where: { id } });
  if (!orden) throw NotFound("Orden de Compra");
  if (orden.estado !== "BORRADOR") {
    throw new Error("Solo se puede modificar una orden en estado BORRADOR");
  }

  return prisma.ordenCompra.update({
    where: { id },
    data: {
      ...data,
      fechaEstimada: data.fechaEstimada ? new Date(data.fechaEstimada) : undefined,
    },
    include: {
      proveedor: {
        select: { id: true, razonSocial: true, nombreComercial: true },
      },
      lineas: {
        include: {
          producto: {
            select: { id: true, sku: true, nombre: true },
          },
        },
      },
    },
  });
}

export async function eliminarOrdenCompra(id: string) {
  return prisma.$transaction(async (tx) => {
    const orden = await tx.ordenCompra.findUnique({ where: { id } });
    if (!orden) throw NotFound("Orden de Compra");

    // Elimina en cascada las recepciones asociadas: revierte el costo de los
    // productos (si hubo costeo), elimina los movimientos de inventario de
    // cada recepción y finalmente la recepción (evita el Restrict del FK).
    const recepciones = await tx.recepcionMercaderia.findMany({
      where: { ordenId: id },
      include: { costeo: true },
    });

    for (const recepcion of recepciones) {
      if (recepcion.costeo) {
        await eliminarCosteoTx(tx, recepcion.costeo.id);
      }
      await tx.movimientoInventario.deleteMany({
        where: {
          referenciaTipo: "RECEPCION",
          referenciaId: recepcion.id,
          tipo: "ENTRADA",
        },
      });
      await tx.recepcionMercaderia.delete({ where: { id: recepcion.id } });
    }

    return tx.ordenCompra.delete({ where: { id } });
  });
}
