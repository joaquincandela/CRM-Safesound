import { prisma } from "../lib/prisma.js";

// Estados que representan una venta efectiva (dinero que entra a la empresa).
const ESTADOS_VENTA = ["PAGADO", "PREPARANDO", "ENVIADO", "ENTREGADO", "COMPLETO"] as const;

export async function obtenerKPIsDashboard() {
  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);

  const actual = new Date();
  const hasta = new Date(actual.getFullYear(), actual.getMonth() + 1, 0, 23, 59, 59);

  try {
    const [totalProductos, productosActivos, totalProveedores, proveedoresActivos, pedidosMes, pedidosPagadosMes, ventasMes, ordenesPendientes, ordenesEnProceso, gastosMes] = await Promise.all([
      prisma.producto.count(),
      prisma.producto.count({ where: { estado: "ACTIVO" } }),
      prisma.proveedor.count(),
      prisma.proveedor.count({ where: { activo: true } }),
      prisma.pedido.count({ where: { createdAt: { gte: inicioMes } } }),
      prisma.pedido.count({ where: { createdAt: { gte: inicioMes }, estado: { in: [...ESTADOS_VENTA] } } }),
      prisma.pedido.aggregate({ where: { createdAt: { gte: inicioMes }, estado: { in: [...ESTADOS_VENTA] } }, _sum: { total: true } }),
      prisma.ordenCompra.count({ where: { estado: "BORRADOR" } }),
      prisma.ordenCompra.count({ where: { estado: { in: ["CONFIRMADA", "EN_FABRICACION", "EN_TRANSITO"] } } }),
      prisma.gasto.aggregate({ where: { fecha: { gte: inicioMes, lte: hasta } }, _sum: { monto: true } }),
    ]);

    let stockBajo: Array<{ id: string; sku: string; nombre: string; stockActual: number; stockMinimo: number }> = [];

    try {
      const productos = await prisma.producto.findMany({
        where: { estado: "ACTIVO", stockMinimo: { gt: 0 } },
        select: { id: true, sku: true, nombre: true, stockMinimo: true },
        take: 50,
      });

      const movimientos = await prisma.movimientoInventario.groupBy({
        by: ["productoId", "tipo"],
        _sum: { cantidad: true },
        where: { productoId: { in: productos.map((p) => p.id) } },
      });

      const stockMap = new Map<string, number>();
      for (const mov of movimientos) {
        const current = stockMap.get(mov.productoId) ?? 0;
        if (mov.tipo === "ENTRADA" || mov.tipo === "AJUSTE_POSITIVO" || mov.tipo === "DEVOLUCION_CLIENTE") {
          stockMap.set(mov.productoId, current + (mov._sum.cantidad ?? 0));
        } else if (mov.tipo === "SALIDA" || mov.tipo === "AJUSTE_NEGATIVO" || mov.tipo === "VENTA" || mov.tipo === "DEVOLUCION_PROVEEDOR") {
          stockMap.set(mov.productoId, current - (mov._sum.cantidad ?? 0));
        }
      }

      stockBajo = productos
        .filter((p) => (stockMap.get(p.id) ?? 0) <= p.stockMinimo)
        .map((p) => ({
          id: p.id,
          sku: p.sku,
          nombre: p.nombre,
          stockActual: stockMap.get(p.id) ?? 0,
          stockMinimo: p.stockMinimo,
        }));
    } catch (e) {
      console.error("Error calculando stock bajo:", e);
    }

    const ventasTotal = Number(ventasMes._sum?.total || 0);

    // ------------------------------------------------------------------------
    // Rentabilidad con costo real (siempre proviene del Costeo de Importación).
    // ------------------------------------------------------------------------
    const productosCosto = await prisma.producto.findMany({
      where: { estado: "ACTIVO" },
      select: { id: true, costoUnitario: true },
    });
    const costoPorProducto = new Map(productosCosto.map((p) => [p.id, Number(p.costoUnitario)]));

    const movimientosStock = await prisma.movimientoInventario.groupBy({
      by: ["productoId", "tipo"],
      _sum: { cantidad: true },
    });
    const stockPorProducto = new Map<string, number>();
    for (const m of movimientosStock) {
      const cur = stockPorProducto.get(m.productoId) ?? 0;
      if (m.tipo === "ENTRADA" || m.tipo === "AJUSTE_POSITIVO" || m.tipo === "DEVOLUCION_CLIENTE") {
        stockPorProducto.set(m.productoId, cur + (m._sum.cantidad ?? 0));
      } else if (m.tipo === "SALIDA" || m.tipo === "AJUSTE_NEGATIVO" || m.tipo === "VENTA" || m.tipo === "DEVOLUCION_PROVEEDOR") {
        stockPorProducto.set(m.productoId, cur - (m._sum.cantidad ?? 0));
      }
    }

    let valorInventario = 0;
    let totalUnidadesStock = 0;
    for (const p of productosCosto) {
      const stock = stockPorProducto.get(p.id) ?? 0;
      totalUnidadesStock += stock;
      valorInventario += stock * (costoPorProducto.get(p.id) ?? 0);
    }

    const ventasMovimientos = await prisma.movimientoInventario.findMany({
      where: { tipo: "VENTA", createdAt: { gte: inicioMes, lte: hasta } },
      select: { productoId: true, cantidad: true },
    });
    const costoDeVentas = ventasMovimientos.reduce(
      (sum, m) => sum + m.cantidad * (costoPorProducto.get(m.productoId) ?? 0),
      0,
    );

    const gananciaBruta = ventasTotal - costoDeVentas;
    const margenBruto = ventasTotal > 0 ? (gananciaBruta / ventasTotal) * 100 : 0;
    const gastosOperativos = Number(gastosMes._sum.monto || 0);
    const utilidadEstimada = gananciaBruta - gastosOperativos;
    const costoPromedio = totalUnidadesStock > 0 ? valorInventario / totalUnidadesStock : 0;

    return {
      inventario: {
        totalProductos,
        productosActivos,
        productosConStockBajo: stockBajo.length,
        alertasStock: stockBajo,
      },
      ventas: {
        pedidosMes,
        pedidosPagadosMes,
        ventasTotales: ventasTotal,
      },
      compras: {
        ordenesPendientes,
        ordenesEnProceso,
      },
      proveedores: {
        totalProveedores,
        proveedoresActivos,
      },
      finanzas: {
        gastosMes: gastosOperativos,
      },
      rentabilidad: {
        valorInventario,
        costoPromedio,
        costoDeVentas,
        gananciaBruta,
        margenBruto,
        gastosOperativos,
        utilidadEstimada,
      },
    };
  } catch (error) {
    console.error("Error en obtenerKPIsDashboard:", error);
    return {
      inventario: { totalProductos: 0, productosActivos: 0, productosConStockBajo: 0, alertasStock: [] },
      ventas: { pedidosMes: 0, pedidosPagadosMes: 0, ventasTotales: 0 },
      compras: { ordenesPendientes: 0, ordenesEnProceso: 0 },
      proveedores: { totalProveedores: 0, proveedoresActivos: 0 },
      finanzas: { gastosMes: 0 },
      rentabilidad: {
        valorInventario: 0,
        costoPromedio: 0,
        costoDeVentas: 0,
        gananciaBruta: 0,
        margenBruto: 0,
        gastosOperativos: 0,
        utilidadEstimada: 0,
      },
    };
  }
}
