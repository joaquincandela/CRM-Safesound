import { prisma } from "@/lib/prisma";
import { NotFound } from "@/lib/errors";
import type { CrearProductoInput, ActualizarProductoInput } from "@/lib/validators/productos.validator";

export async function crearProducto(data: CrearProductoInput & { stockInicial?: number }, usuarioId?: string) {
  const { stockInicial, ...productoData } = data;

  return prisma.$transaction(async (tx) => {
    const producto = await tx.producto.create({
      data: productoData,
      include: {
        categoria: {
          select: { id: true, nombre: true },
        },
      },
    });

    if (stockInicial && stockInicial > 0 && usuarioId) {
      await tx.movimientoInventario.create({
        data: {
          productoId: producto.id,
          tipo: "AJUSTE_POSITIVO",
          cantidad: stockInicial,
          stockAnterior: 0,
          stockPosterior: stockInicial,
          referenciaTipo: "AJUSTE",
          motivo: "Stock inicial al crear producto",
          usuarioId,
        },
      });
    }

    return producto;
  });
}

export async function listarProductos(filtros: {
  categoriaId?: string;
  estado?: "ACTIVO" | "INACTIVO";
  buscar?: string;
}) {
  const where: any = {};
  
  if (filtros.categoriaId) where.categoriaId = filtros.categoriaId;
  if (filtros.estado) where.estado = filtros.estado;
  if (filtros.buscar) {
    where.OR = [
      { nombre: { contains: filtros.buscar, mode: "insensitive" } },
      { sku: { contains: filtros.buscar, mode: "insensitive" } },
    ];
  }

  return prisma.producto.findMany({
    where,
    include: {
      categoria: {
        select: { id: true, nombre: true },
      },
      ultimoCosteo: {
        select: { id: true, numero: true, fecha: true, moneda: true },
      },
    },
    orderBy: { nombre: "asc" },
  });
}

export async function obtenerProducto(id: string) {
  const producto = await prisma.producto.findUnique({
    where: { id },
    include: {
      categoria: true,
      ultimoCosteo: {
        select: { id: true, numero: true, fecha: true, moneda: true },
      },
      movimientos: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });
  if (!producto) throw NotFound("Producto");
  return producto;
}

export async function actualizarProducto(id: string, data: ActualizarProductoInput) {
  const producto = await prisma.producto.findUnique({ where: { id } });
  if (!producto) throw NotFound("Producto");

  // El costo real SIEMPRE proviene del Costeo de Importación: el schema de
  // actualización ni siquiera lo expone, así que aquí solo se edita lo demás.
  return prisma.producto.update({
    where: { id },
    data,
    include: {
      categoria: {
        select: { id: true, nombre: true },
      },
    },
  });
}

export async function eliminarProducto(id: string) {
  return prisma.$transaction(async (tx) => {
    const producto = await tx.producto.findUnique({ where: { id } });
    if (!producto) throw NotFound("Producto");

    // Elimina en cascada todo lo que referencia al producto para que el
    // borrado siempre tenga éxito: lotes, líneas de recepción/orden/pedido y
    // movimientos de inventario.
    await tx.loteImportacion.deleteMany({ where: { productoId: id } });
    await tx.lineaRecepcion.deleteMany({ where: { productoId: id } });
    await tx.lineaOrdenCompra.deleteMany({ where: { productoId: id } });
    await tx.lineaPedido.deleteMany({ where: { productoId: id } });
    await tx.movimientoInventario.deleteMany({ where: { productoId: id } });

    return tx.producto.delete({ where: { id } });
  });
}

export async function obtenerStockActual(productoId: string): Promise<number> {
  const ultimoMovimiento = await prisma.movimientoInventario.findFirst({
    where: { productoId },
    orderBy: { createdAt: "desc" },
  });

  return ultimoMovimiento?.stockPosterior ?? 0;
}
