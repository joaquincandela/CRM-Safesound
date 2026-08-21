import { prisma } from "@/lib/prisma";
import { NotFound } from "@/lib/errors";
import type { CrearPedidoInput, ActualizarPedidoInput } from "@/lib/validators/pedidos.validator";

// Estados que consumen stock del inventario (venta efectiva).
const ESTADOS_CONSUME_STOCK = ["PAGADO", "PREPARANDO", "ENVIADO", "ENTREGADO", "COMPLETO"];

function consumeStock(estado?: string | null): boolean {
  return !!estado && ESTADOS_CONSUME_STOCK.includes(estado);
}

async function calcularStockActual(tx: any, productoId: string) {
  const movimientosPrevios = await tx.movimientoInventario.findMany({
    where: { productoId },
    orderBy: { createdAt: "asc" },
  });

  let stock = 0;
  for (const mov of movimientosPrevios) {
    if (["ENTRADA", "AJUSTE_POSITIVO", "DEVOLUCION_CLIENTE"].includes(mov.tipo)) {
      stock += mov.cantidad;
    } else if (["SALIDA", "AJUSTE_NEGATIVO", "VENTA"].includes(mov.tipo)) {
      stock -= mov.cantidad;
    }
  }
  return stock;
}

async function registrarVentasEnInventario(tx: any, pedidoId: string, lineas: Array<{ productoId: string; cantidad: number }>, usuarioId: string) {
  for (const linea of lineas) {
    const stockActual = await calcularStockActual(tx, linea.productoId);
    const nuevoStock = stockActual - linea.cantidad;
    if (nuevoStock < 0) {
      throw new Error(`Stock insuficiente para el producto ${linea.productoId}. Disponible: ${stockActual}, requerido: ${linea.cantidad}`);
    }

    await tx.movimientoInventario.create({
      data: {
        productoId: linea.productoId,
        tipo: "VENTA",
        cantidad: linea.cantidad,
        stockAnterior: stockActual,
        stockPosterior: nuevoStock,
        referenciaTipo: "PEDIDO",
        referenciaId: pedidoId,
        motivo: "Venta registrada automáticamente al confirmar pedido",
        usuarioId,
      },
    });
  }
}

async function restaurarInventario(tx: any, pedidoId: string, lineas: Array<{ productoId: string; cantidad: number }>, usuarioId: string) {
  for (const linea of lineas) {
    const stockActual = await calcularStockActual(tx, linea.productoId);
    const nuevoStock = stockActual + linea.cantidad;

    await tx.movimientoInventario.create({
      data: {
        productoId: linea.productoId,
        tipo: "DEVOLUCION_CLIENTE",
        cantidad: linea.cantidad,
        stockAnterior: stockActual,
        stockPosterior: nuevoStock,
        referenciaTipo: "PEDIDO",
        referenciaId: pedidoId,
        motivo: "Stock restaurado por cancelación de pedido",
        usuarioId,
      },
    });
  }
}

export async function crearPedido(data: CrearPedidoInput, usuarioId: string) {
  if (!data.lineas || data.lineas.length === 0) {
    throw new Error("El pedido debe tener al menos una línea con un producto");
  }

  const productoIds = [...new Set(data.lineas.map((l) => l.productoId))];
  const productos = await prisma.producto.findMany({ where: { id: { in: productoIds } } });
  const precioPorProducto = new Map(productos.map((p) => [p.id, Number(p.precioVenta)]));

  for (const linea of data.lineas) {
    if (!precioPorProducto.has(linea.productoId)) {
      throw new Error(`Producto no encontrado: ${linea.productoId}`);
    }
  }

  return prisma.$transaction(async (tx) => {
    // Calcular subtotal con el precio de venta actual del producto (no el que manda el cliente)
    const subtotal = data.lineas.reduce((sum, linea) => {
      const precioUnitario = precioPorProducto.get(linea.productoId)!;
      return sum + (linea.cantidad * precioUnitario);
    }, 0);

    const descuento = data.descuento ?? 0;
    const igv = data.igv ?? 0;
    const total = subtotal - descuento + igv;

    // Generar número de pedido
    const ultimoPedido = await tx.pedido.findFirst({
      orderBy: { numero: "desc" },
      select: { numero: true },
    });
    const numeroSiguiente = ultimoPedido 
      ? (parseInt(ultimoPedido.numero.replace("PED-", "")) + 1).toString().padStart(6, "0")
      : "000001";

    const pedido = await tx.pedido.create({
      data: {
        numero: `PED-${numeroSiguiente}`,
        clienteId: data.clienteId,
        clienteNombre: data.clienteNombre?.trim() || null,
        clienteTelefono: data.clienteTelefono?.trim() || null,
        clienteEmail: data.clienteEmail?.trim() || null,
        clienteDocumento: data.clienteDocumento?.trim() || null,
        clienteDireccion: data.clienteDireccion?.trim() || null,
        estado: data.estado ?? "PENDIENTE",
        subtotal,
        descuento,
        igv,
        total,
        notas: data.notas,
        lineas: {
          create: data.lineas.map(linea => ({
            productoId: linea.productoId,
            cantidad: linea.cantidad,
            precioUnitario: precioPorProducto.get(linea.productoId)!,
            subtotal: linea.cantidad * precioPorProducto.get(linea.productoId)!,
          })),
        },
      },
      include: {
        cliente: {
          select: { id: true, nombre: true, apellido: true, razonSocial: true },
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

    // Si se crea directamente en un estado que consume stock, descontar inventario
    if (consumeStock(data.estado)) {
      await registrarVentasEnInventario(tx, pedido.id, data.lineas, usuarioId);
    }

    return pedido;
  });
}

export async function listarPedidos(filtros: {
  clienteId?: string;
  estado?: string;
  desde?: Date;
  hasta?: Date;
  buscar?: string;
}) {
  const where: any = {};
  
  if (filtros.clienteId) where.clienteId = filtros.clienteId;
  if (filtros.estado) where.estado = filtros.estado;
  if (filtros.desde || filtros.hasta) {
    where.createdAt = {};
    if (filtros.desde) where.createdAt.gte = filtros.desde;
    if (filtros.hasta) where.createdAt.lte = filtros.hasta;
  }
  if (filtros.buscar) {
    where.OR = [
      { numero: { contains: filtros.buscar, mode: "insensitive" } },
      { clienteNombre: { contains: filtros.buscar, mode: "insensitive" } },
      { clienteDocumento: { contains: filtros.buscar, mode: "insensitive" } },
      { clienteTelefono: { contains: filtros.buscar, mode: "insensitive" } },
    ];
  }

  return prisma.pedido.findMany({
    where,
    include: {
      cliente: {
        select: { id: true, nombre: true, apellido: true, razonSocial: true },
      },
      lineas: {
        include: {
          producto: {
            select: { id: true, sku: true, nombre: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function obtenerPedido(id: string) {
  const pedido = await prisma.pedido.findUnique({
    where: { id },
    include: {
      cliente: true,
      lineas: {
        include: {
          producto: true,
        },
      },
    },
  });
  if (!pedido) throw NotFound("Pedido");
  return pedido;
}

export async function actualizarPedido(id: string, data: ActualizarPedidoInput, usuarioId: string) {
  const pedido = await prisma.pedido.findUnique({
    where: { id },
    include: { lineas: true },
  });
  if (!pedido) throw NotFound("Pedido");

  // Si el estado pasa a uno que consume stock, descontar inventario.
  // Si se mueve a un estado que ya no consume stock (CANCELADO/PENDIENTE), restaurarlo.
  const nuevoEstado = data.estado;
  const debeDescontar = consumeStock(nuevoEstado) && !consumeStock(pedido.estado);
  const debeRestaurar = !consumeStock(nuevoEstado) && consumeStock(pedido.estado);

  return prisma.$transaction(async (tx) => {
    const updated = await tx.pedido.update({
      where: { id },
      data,
      include: {
        cliente: {
          select: { id: true, nombre: true, apellido: true, razonSocial: true },
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

    const lineasStock = pedido.lineas.map((l) => ({ productoId: l.productoId, cantidad: l.cantidad }));

    if (debeDescontar) {
      await registrarVentasEnInventario(tx, id, lineasStock, usuarioId);
    } else if (debeRestaurar) {
      await restaurarInventario(tx, id, lineasStock, usuarioId);
    }

    return updated;
  });
}

export async function eliminarPedido(id: string, usuarioId?: string) {
  return prisma.$transaction(async (tx) => {
    const pedido = await tx.pedido.findUnique({
      where: { id },
      include: { lineas: true },
    });
    if (!pedido) throw NotFound("Pedido");

    // Si el pedido consumió stock, se restaura antes de eliminar para que el
    // inventario quede correcto (queda un registro de DEVOLUCION en el kardex).
    if (consumeStock(pedido.estado) && usuarioId) {
      const lineasStock = pedido.lineas.map((l) => ({ productoId: l.productoId, cantidad: l.cantidad }));
      await restaurarInventario(tx, id, lineasStock, usuarioId);
    }

    return tx.pedido.delete({ where: { id } });
  });
}
