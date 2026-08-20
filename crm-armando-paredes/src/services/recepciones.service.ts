import { prisma } from "../lib/prisma.js";
import { NotFound } from "../lib/errors.js";
import { eliminarCosteoTx } from "./costeoImportacion.service.js";
import type { CrearRecepcionInput } from "../validators/recepciones.validator.js";

export async function crearRecepcion(data: CrearRecepcionInput, usuarioId: string) {
  return prisma.$transaction(async (tx) => {
    // Verificar que la orden existe y está en estado apropiado
    const orden = await tx.ordenCompra.findUnique({
      where: { id: data.ordenId },
      include: { lineas: true },
    });
    if (!orden) throw NotFound("Orden de Compra");
    if (orden.estado === "RECIBIDA" || orden.estado === "CANCELADA") {
      throw new Error("No se puede recibir una orden en estado RECIBIDA o CANCELADA");
    }

    // Crear recepción
    const recepcion = await tx.recepcionMercaderia.create({
      data: {
        ordenId: data.ordenId,
        usuarioId,
        notas: data.notas,
        lineas: {
          create: data.lineas.map(linea => ({
            productoId: linea.productoId,
            cantidadRecibida: linea.cantidadRecibida,
          })),
        },
      },
      include: {
        orden: {
          select: { id: true, numero: true },
        },
        usuario: {
          select: { id: true, nombre: true },
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

    // Registrar movimientos de inventario
    for (const linea of data.lineas) {
      // Obtener stock actual
      const movimientosPrevios = await tx.movimientoInventario.findMany({
        where: { productoId: linea.productoId },
        orderBy: { createdAt: "asc" },
      });

      let stockActual = 0;
      for (const mov of movimientosPrevios) {
        if (mov.tipo === "ENTRADA" || mov.tipo === "AJUSTE_POSITIVO" || mov.tipo === "DEVOLUCION_CLIENTE") {
          stockActual += mov.cantidad;
        } else if (mov.tipo === "SALIDA" || mov.tipo === "AJUSTE_NEGATIVO" || mov.tipo === "VENTA" || mov.tipo === "DEVOLUCION_PROVEEDOR") {
          stockActual -= mov.cantidad;
        }
      }

      const stockNuevo = stockActual + linea.cantidadRecibida;

      await tx.movimientoInventario.create({
        data: {
          productoId: linea.productoId,
          tipo: "ENTRADA",
          cantidad: linea.cantidadRecibida,
          stockAnterior: stockActual,
          stockPosterior: stockNuevo,
          referenciaTipo: "RECEPCION",
          referenciaId: recepcion.id,
          motivo: `Recepción de orden ${orden.numero}`,
          usuarioId,
        },
      });
    }

    // Actualizar estado de la orden si está completamente recibida
    const ordenConLineas = await tx.ordenCompra.findUnique({
      where: { id: data.ordenId },
      include: { lineas: true },
    });

    let totalRecibido = 0;
    for (const linea of ordenConLineas!.lineas) {
      const recibido = await tx.lineaRecepcion.aggregate({
        where: { productoId: linea.productoId },
        _sum: { cantidadRecibida: true },
      });
      totalRecibido += recibido._sum.cantidadRecibida || 0;
    }

    const totalOrdenado = ordenConLineas!.lineas.reduce((sum: number, l: any) => sum + l.cantidad, 0);
    if (totalRecibido >= totalOrdenado) {
      await tx.ordenCompra.update({
        where: { id: data.ordenId },
        data: { estado: "RECIBIDA" },
      });
    }

    return recepcion;
  });
}

export async function listarRecepciones(filtros: {
  ordenId?: string;
  desde?: Date;
  hasta?: Date;
}) {
  const where: any = {};
  
  if (filtros.ordenId) where.ordenId = filtros.ordenId;
  if (filtros.desde || filtros.hasta) {
    where.fecha = {};
    if (filtros.desde) where.fecha.gte = filtros.desde;
    if (filtros.hasta) where.fecha.lte = filtros.hasta;
  }

  return prisma.recepcionMercaderia.findMany({
    where,
    include: {
      orden: {
        select: {
          id: true,
          numero: true,
          proveedor: {
            select: { razonSocial: true },
          },
        },
      },
      usuario: {
        select: { id: true, nombre: true },
      },
      lineas: {
        include: {
          producto: {
            select: { id: true, sku: true, nombre: true },
          },
        },
      },
    },
    orderBy: { fecha: "desc" },
  });
}

export async function obtenerRecepcion(id: string) {
  const recepcion = await prisma.recepcionMercaderia.findUnique({
    where: { id },
    include: {
      orden: true,
      usuario: {
        select: { id: true, nombre: true },
      },
      lineas: {
        include: {
          producto: true,
        },
      },
    },
  });
  if (!recepcion) throw NotFound("Recepción");
  return recepcion;
}

export async function eliminarRecepcion(id: string) {
  return prisma.$transaction(async (tx) => {
    const recepcion = await tx.recepcionMercaderia.findUnique({
      where: { id },
      include: { costeo: true },
    });
    if (!recepcion) throw NotFound("Recepción");

    // Si la recepción fue costeada, revertir el costo real de los productos.
    if (recepcion.costeo) {
      await eliminarCosteoTx(tx, recepcion.costeo.id);
    }

    // Eliminar los movimientos de inventario que generó la recepción.
    await tx.movimientoInventario.deleteMany({
      where: {
        referenciaTipo: "RECEPCION",
        referenciaId: id,
        tipo: "ENTRADA",
      },
    });

    // Recalcular el estado de la orden: si dejaba de estar completamente
    // recibida, se regresa a EN_TRANSITO para poder recibir de nuevo.
    const orden = await tx.ordenCompra.findUnique({
      where: { id: recepcion.ordenId },
      include: { lineas: true },
    });
    if (orden && orden.estado === "RECIBIDA") {
      let totalRecibido = 0;
      for (const linea of orden.lineas) {
        const recibido = await tx.lineaRecepcion.aggregate({
          where: { productoId: linea.productoId },
          _sum: { cantidadRecibida: true },
        });
        totalRecibido += recibido._sum.cantidadRecibida || 0;
      }
      const totalOrdenado = orden.lineas.reduce((sum: number, l: any) => sum + l.cantidad, 0);
      if (totalRecibido < totalOrdenado) {
        await tx.ordenCompra.update({
          where: { id: orden.id },
          data: { estado: "EN_TRANSITO" },
        });
      }
    }

    return tx.recepcionMercaderia.delete({ where: { id } });
  });
}
