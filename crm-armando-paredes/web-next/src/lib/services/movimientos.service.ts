import { prisma } from "@/lib/prisma";
import { NotFound } from "@/lib/errors";
import type { CrearMovimientoInput } from "@/lib/validators/movimientos.validator";

export async function registrarMovimiento(data: CrearMovimientoInput, usuarioId: string) {
  return prisma.$transaction(async (tx) => {
    // Obtener stock actual
    const movimientosPrevios = await tx.movimientoInventario.findMany({
      where: { productoId: data.productoId },
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

    // Calcular nuevo stock
    let nuevoStock = stockActual;
    if (data.tipo === "ENTRADA" || data.tipo === "AJUSTE_POSITIVO" || data.tipo === "DEVOLUCION_CLIENTE") {
      nuevoStock += data.cantidad;
    } else if (data.tipo === "SALIDA" || data.tipo === "AJUSTE_NEGATIVO" || data.tipo === "VENTA" || data.tipo === "DEVOLUCION_PROVEEDOR") {
      nuevoStock -= data.cantidad;
      if (nuevoStock < 0) {
        throw new Error("Stock insuficiente para esta operación");
      }
    }

    // Crear movimiento
    const movimiento = await tx.movimientoInventario.create({
      data: {
        productoId: data.productoId,
        tipo: data.tipo,
        cantidad: data.cantidad,
        stockAnterior: stockActual,
        stockPosterior: nuevoStock,
        referenciaTipo: data.referenciaTipo,
        referenciaId: data.referenciaId,
        motivo: data.motivo,
        usuarioId,
      },
      include: {
        producto: {
          select: { id: true, sku: true, nombre: true },
        },
        usuario: {
          select: { id: true, nombre: true },
        },
      },
    });

    return movimiento;
  });
}

export async function listarMovimientos(filtros: {
  productoId?: string;
  tipo?: string;
  referenciaTipo?: string;
  desde?: Date;
  hasta?: Date;
}) {
  const where: any = {};
  
  if (filtros.productoId) where.productoId = filtros.productoId;
  if (filtros.tipo) where.tipo = filtros.tipo;
  if (filtros.referenciaTipo) where.referenciaTipo = filtros.referenciaTipo;
  if (filtros.desde || filtros.hasta) {
    where.createdAt = {};
    if (filtros.desde) where.createdAt.gte = filtros.desde;
    if (filtros.hasta) where.createdAt.lte = filtros.hasta;
  }

  return prisma.movimientoInventario.findMany({
    where,
    include: {
      producto: {
        select: { id: true, sku: true, nombre: true },
      },
      usuario: {
        select: { id: true, nombre: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function obtenerKardexProducto(productoId: string, desde?: Date, hasta?: Date) {
  const where: any = { productoId };
  if (desde || hasta) {
    where.createdAt = {};
    if (desde) where.createdAt.gte = desde;
    if (hasta) where.createdAt.lte = hasta;
  }

  const movimientos = await prisma.movimientoInventario.findMany({
    where,
    include: {
      usuario: {
        select: { id: true, nombre: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return movimientos;
}

export async function obtenerStockCalculado(productoId: string): Promise<number> {
  const ultimoMovimiento = await prisma.movimientoInventario.findFirst({
    where: { productoId },
    orderBy: { createdAt: "desc" },
  });

  return ultimoMovimiento?.stockPosterior ?? 0;
}

export async function obtenerStockTodosLosProductos(): Promise<Array<{ productoId: string; stock: number }>> {
  // Obtener todos los movimientos y quedarnos con el último stockPosterior por producto
  const todos = await prisma.movimientoInventario.findMany({
    orderBy: { createdAt: "desc" },
    select: { productoId: true, stockPosterior: true, createdAt: true },
  });

  const map = new Map<string, number>();
  for (const m of todos) {
    if (!map.has(m.productoId)) {
      map.set(m.productoId, m.stockPosterior);
    }
  }

  return Array.from(map.entries()).map(([productoId, stock]) => ({ productoId, stock }));
}
