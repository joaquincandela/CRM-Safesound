import { prisma } from "@/lib/prisma";

export async function obtenerResumenFinanciero(desde: Date, hasta: Date) {
  // Total de ventas (pedidos pagados)
  const ventas = await prisma.pedido.aggregate({
    where: {
      estado: "PAGADO",
      createdAt: { gte: desde, lte: hasta },
    },
    _sum: { total: true },
    _count: true,
  });

  // Total de gastos
  const gastos = await prisma.gasto.aggregate({
    where: {
      fecha: { gte: desde, lte: hasta },
    },
    _sum: { monto: true },
    _count: true,
  });

  // Gastos por categoría
  const gastosPorCategoria = await prisma.gasto.groupBy({
    by: ["categoria"],
    where: {
      fecha: { gte: desde, lte: hasta },
    },
    _sum: { monto: true },
    orderBy: { _sum: { monto: "desc" } },
  });

  // Pedidos por estado
  const pedidosPorEstado = await prisma.pedido.groupBy({
    by: ["estado"],
    where: {
      createdAt: { gte: desde, lte: hasta },
    },
    _sum: { total: true },
    _count: true,
  });

  const ventasTotal = Number(ventas._sum.total || 0);
  const gastosTotal = Number(gastos._sum.monto || 0);

  return {
    periodo: { desde, hasta },
    ventas: {
      total: ventasTotal,
      cantidad: ventas._count,
    },
    gastos: {
      total: gastosTotal,
      cantidad: gastos._count,
      porCategoria: gastosPorCategoria.map(g => ({
        categoria: g.categoria,
        monto: Number(g._sum.monto || 0),
      })),
    },
    utilidad: {
      bruta: ventasTotal - gastosTotal,
    },
    pedidosPorEstado: pedidosPorEstado.map(p => ({
      estado: p.estado,
      total: Number(p._sum.total || 0),
      cantidad: p._count,
    })),
  };
}
