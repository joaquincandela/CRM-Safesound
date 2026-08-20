import { prisma } from "@/lib/prisma";
import { NotFound, Forbidden } from "@/lib/errors";
import type { Prisma } from "@prisma/client";
import type { CrearCosteoInput, ActualizarCosteoInput } from "@/lib/validators/costeoImportacion.validator";

// ============================================================================
// COSTEO DE IMPORTACIÓN — cálculo centralizado del costo real por unidad.
// Cada gasto tiene su propia moneda (PEN/USD); el costeo total se calcula en
// la moneda final elegida usando el tipo de cambio (1 USD = X PEN).
// ============================================================================

export const GASTOS_IMPORTACION = [
  "comisionBancaria",
  "comisionPlataforma",
  "courierFlete",
  "seguro",
  "aduanas",
  "almacenaje",
  "transporteLocal",
  "otros",
] as const;

export type GastoImportacion = (typeof GASTOS_IMPORTACION)[number];
type GastoValor = { monto: number; moneda: string };
export type GastosData = Record<GastoImportacion, GastoValor>;

function round(v: number): number {
  return Math.round((v + Number.EPSILON) * 100) / 100;
}

// ----------------------------------------------------------------------------
// Conversión de moneda (tipo de cambio: 1 USD = X PEN).
// ----------------------------------------------------------------------------

/** Convierte un monto entre monedas según la moneda final del costeo. */
export function convertirMonto(
  monto: number,
  monedaOrigen: string,
  monedaDestino: string,
  tipoCambio: number | null,
): number {
  if (monedaOrigen === monedaDestino) return monto;
  const tc = tipoCambio ?? 1;
  return monedaDestino === "USD" ? monto / tc : monto * tc;
}

/** Factor para llevar un costo de la moneda de origen a la del costeo. */
export function factorConversion(
  monedaOrigen: string,
  monedaDestino: string,
  tipoCambio: number | null,
): number {
  if (monedaOrigen === monedaDestino) return 1;
  const tc = tipoCambio ?? 1;
  return monedaDestino === "USD" ? 1 / tc : tc;
}

// ----------------------------------------------------------------------------
// Lectura/normalización de gastos.
// ----------------------------------------------------------------------------

/** Normaliza los gastos: prioriza `data.gastos` (monto+moneda), fallback plano. */
function pickGastos(data: Record<string, unknown>): GastosData {
  const gastos = {} as GastosData;
  const nested = data.gastos as Record<string, { monto?: unknown; moneda?: unknown }> | undefined;

  for (const key of GASTOS_IMPORTACION) {
    let monto = 0;
    let moneda = "PEN";

    const src = nested?.[key];
    if (src && typeof src === "object") {
      monto = typeof src.monto === "number" && Number.isFinite(src.monto) ? src.monto : 0;
      moneda = typeof src.moneda === "string" ? src.moneda : "PEN";
    } else {
      const flat = Number(data[key]);
      monto = Number.isFinite(flat) ? flat : 0;
      const flatMoneda = data[`${key}Moneda`];
      moneda = typeof flatMoneda === "string" ? flatMoneda : "PEN";
    }

    gastos[key] = { monto, moneda: moneda === "USD" ? "USD" : "PEN" };
  }
  return gastos;
}

/** Aplica solo los gastos enviados en la edición sobre la base existente. */
function mergeGastos(base: GastosData, patch?: Record<string, { monto?: number; moneda?: string }>): GastosData {
  if (!patch) return base;
  const next: GastosData = { ...base };
  for (const key of GASTOS_IMPORTACION) {
    const p = patch[key];
    if (!p) continue;
    if (typeof p.monto === "number" && Number.isFinite(p.monto)) next[key].monto = p.monto;
    if (typeof p.moneda === "string" && (p.moneda === "PEN" || p.moneda === "USD")) next[key].moneda = p.moneda;
  }
  return next;
}

function toCreateGastos(gastos: GastosData) {
  const data: Record<string, unknown> = {};
  for (const key of GASTOS_IMPORTACION) {
    data[key] = gastos[key].monto;
    data[`${key}Moneda`] = gastos[key].moneda;
  }
  return data;
}

const includeCosteo = {
  recepcion: {
    include: {
      lineas: {
        include: { producto: { select: { id: true, sku: true, nombre: true } } },
      },
    },
  },
  orden: {
    select: { id: true, numero: true, moneda: true, total: true },
  },
  proveedor: {
    select: { id: true, razonSocial: true, nombreComercial: true },
  },
  usuario: { select: { id: true, nombre: true } },
  lotes: {
    include: { producto: { select: { id: true, sku: true, nombre: true } } },
  },
} satisfies Prisma.CosteoImportacionInclude;

// ----------------------------------------------------------------------------
// Cálculos puros (exportados para poder reutilizarlos/probarlos).
// ----------------------------------------------------------------------------

/** Convierte el costo de los productos y cada gasto a la moneda final. */
export function calcularCosteo(args: {
  costoProductosBase: number; // costo de productos recibidos en la moneda de la OC
  monedaCosteo: string;
  monedaOrden: string;
  tipoCambio: number | null;
  gastos: GastosData;
}) {
  const costoProductos = round(
    convertirMonto(args.costoProductosBase, args.monedaOrden, args.monedaCosteo, args.tipoCambio),
  );
  const gastosTotal = round(
    GASTOS_IMPORTACION.reduce(
      (sum, k) => sum + convertirMonto(args.gastos[k].monto, args.gastos[k].moneda, args.monedaCosteo, args.tipoCambio),
      0,
    ),
  );
  const costoTotal = round(costoProductos + gastosTotal);
  return { costoProductos, gastosTotal, costoTotal };
}

/** Prorratea los gastos de importación entre los productos recibidos. */
export function calcularLotes(args: {
  lineas: Array<{ productoId: string; cantidad: number; costoUnitarioOrden: number }>;
  tipoCambio: number; // factor desde moneda de la OC hacia moneda del costeo
  gastosTotal: number;
}) {
  const lineas = args.lineas.map((l) => ({
    ...l,
    costoBase: l.costoUnitarioOrden * l.cantidad * args.tipoCambio,
  }));
  const totalBase = lineas.reduce((sum, l) => sum + l.costoBase, 0);
  const safeBase = totalBase > 0 ? totalBase : 1;

  return lineas.map((l) => {
    const shareGastos = args.gastosTotal * (l.costoBase / safeBase);
    const costoTotal = l.costoBase + shareGastos;
    return {
      productoId: l.productoId,
      cantidad: l.cantidad,
      costoTotal: round(costoTotal),
      costoUnitario: round(costoTotal / Math.max(l.cantidad, 1)),
    };
  });
}

// ----------------------------------------------------------------------------
// Helpers de lectura de recepción/orden.
// ----------------------------------------------------------------------------

async function lineasBaseDeRecepcion(tx: any, recepcionId: string) {
  const recepcion = await tx.recepcionMercaderia.findUnique({
    where: { id: recepcionId },
    include: { lineas: true, orden: { include: { lineas: true } } },
  });
  if (!recepcion) throw NotFound("Recepción");

  const lineas = recepcion.lineas.map((rl: any) => {
    const ocLinea = recepcion.orden.lineas.find((l: any) => l.productoId === rl.productoId);
    return {
      productoId: rl.productoId,
      cantidad: rl.cantidadRecibida,
      costoUnitarioOrden: ocLinea ? Number(ocLinea.costoUnitario) : 0,
    };
  });

  return { recepcion, orden: recepcion.orden, lineas };
}

async function siguienteNumero(tx: any): Promise<string> {
  const ultimo = await tx.costeoImportacion.findFirst({
    orderBy: { numero: "desc" },
    select: { numero: true },
  });
  const n = ultimo ? parseInt(ultimo.numero.replace("CI-", ""), 10) + 1 : 1;
  return n.toString().padStart(6, "0");
}

/** Regenera lotes y sincroniza costo real del producto + kardex. */
async function aplicarLotes(tx: any, costeoId: string) {
  const costeo = await tx.costeoImportacion.findUnique({
    where: { id: costeoId },
    include: {
      recepcion: { include: { lineas: true, orden: { include: { lineas: true } } } },
    },
  });
  if (!costeo) throw NotFound("Costeo de Importación");

  const lineas = costeo.recepcion.lineas.map((rl: any) => {
    const ocLinea = costeo.recepcion.orden.lineas.find((l: any) => l.productoId === rl.productoId);
    return {
      productoId: rl.productoId,
      cantidad: rl.cantidadRecibida,
      costoUnitarioOrden: ocLinea ? Number(ocLinea.costoUnitario) : 0,
    };
  });

  const factor = factorConversion(
    costeo.recepcion.orden.moneda,
    costeo.moneda,
    costeo.tipoCambio !== null ? Number(costeo.tipoCambio) : null,
  );
  const lotes = calcularLotes({ lineas, tipoCambio: factor, gastosTotal: Number(costeo.gastosTotal) });

  await tx.loteImportacion.deleteMany({ where: { costeoId: costeo.id } });

  for (const lote of lotes) {
    await tx.loteImportacion.create({
      data: {
        costeoId: costeo.id,
        recepcionId: costeo.recepcionId,
        productoId: lote.productoId,
        cantidad: lote.cantidad,
        costoUnitario: lote.costoUnitario,
        costoTotal: lote.costoTotal,
      },
    });

    // Costo real del producto: SIEMPRE desde el costeo, nunca editable.
    await tx.producto.update({
      where: { id: lote.productoId },
      data: {
        costoUnitario: lote.costoUnitario,
        ultimaImportacionFecha: costeo.fecha,
        ultimoCosteoId: costeo.id,
      },
    });

    // Kardex: asocia el costo al movimiento ENTRADA de la recepción.
    await tx.movimientoInventario.updateMany({
      where: {
        productoId: lote.productoId,
        referenciaTipo: "RECEPCION",
        referenciaId: costeo.recepcionId,
        tipo: "ENTRADA",
      },
      data: { costoUnitario: lote.costoUnitario },
    });
  }

  return lotes;
}

// ----------------------------------------------------------------------------
// CRUD
// ----------------------------------------------------------------------------

export async function crearCosteo(data: CrearCosteoInput, usuarioId: string) {
  return prisma.$transaction(async (tx) => {
    const existente = await tx.costeoImportacion.findUnique({ where: { recepcionId: data.recepcionId } });
    if (existente) throw Forbidden("La recepción ya tiene un costeo de importación");

    const { recepcion, orden, lineas } = await lineasBaseDeRecepcion(tx, data.recepcionId);

    const moneda = data.moneda || orden.moneda || "PEN";
    const tipoCambio = data.tipoCambio ?? null;
    const gastos = pickGastos(data as unknown as Record<string, unknown>);

    if (moneda !== orden.moneda && (!tipoCambio || tipoCambio <= 0)) {
      throw new Error(`El costeo es en ${moneda} pero la orden está en ${orden.moneda}; se requiere un tipo de cambio válido`);
    }

    const costoProductosBase = lineas.reduce((sum: number, l: any) => sum + l.costoUnitarioOrden * l.cantidad, 0);
    const calc = calcularCosteo({
      costoProductosBase,
      monedaCosteo: moneda,
      monedaOrden: orden.moneda,
      tipoCambio,
      gastos,
    });
    const totalUnidades = lineas.reduce((sum: number, l: any) => sum + l.cantidad, 0);
    const costoUnitario = totalUnidades > 0 ? round(calc.costoTotal / totalUnidades) : 0;

    return tx.costeoImportacion.create({
      data: {
        numero: `CI-${await siguienteNumero(tx)}`,
        recepcionId: data.recepcionId,
        ordenId: orden.id,
        proveedorId: orden.proveedorId,
        fecha: data.fecha ? new Date(data.fecha) : recepcion.fecha,
        moneda,
        tipoCambio,
        costoProductos: calc.costoProductos,
        ...toCreateGastos(gastos),
        gastosTotal: calc.gastosTotal,
        costoTotal: calc.costoTotal,
        costoUnitario,
        observaciones: data.observaciones ?? null,
        estado: "BORRADOR",
        usuarioId,
      },
      include: includeCosteo,
    });
  });
}

export async function listarCosteos(filtros: { recepcionId?: string; desde?: Date; hasta?: Date }) {
  const where: any = {};
  if (filtros.recepcionId) where.recepcionId = filtros.recepcionId;
  if (filtros.desde || filtros.hasta) {
    where.fecha = {};
    if (filtros.desde) where.fecha.gte = filtros.desde;
    if (filtros.hasta) where.fecha.lte = filtros.hasta;
  }

  return prisma.costeoImportacion.findMany({
    where,
    include: includeCosteo,
    orderBy: { fecha: "desc" },
  });
}

export async function obtenerCosteo(id: string) {
  const costeo = await prisma.costeoImportacion.findUnique({ where: { id }, include: includeCosteo });
  if (!costeo) throw NotFound("Costeo de Importación");
  return costeo;
}

export async function actualizarCosteo(id: string, data: ActualizarCosteoInput) {
  return prisma.$transaction(async (tx) => {
    const costeo = await tx.costeoImportacion.findUnique({ where: { id } });
    if (!costeo) throw NotFound("Costeo de Importación");

    const { orden, lineas } = await lineasBaseDeRecepcion(tx, costeo.recepcionId);

    const moneda = data.moneda || costeo.moneda;
    const tipoCambio = data.tipoCambio ?? costeo.tipoCambio;
    const gastos = mergeGastos(pickGastos(costeo as unknown as Record<string, unknown>), data.gastos as any);

    if (moneda !== orden.moneda && (!tipoCambio || Number(tipoCambio) <= 0)) {
      throw new Error(`El costeo es en ${moneda} pero la orden está en ${orden.moneda}; se requiere un tipo de cambio válido`);
    }

    const costoProductosBase = lineas.reduce((sum: number, l: any) => sum + l.costoUnitarioOrden * l.cantidad, 0);
    const calc = calcularCosteo({
      costoProductosBase,
      monedaCosteo: moneda,
      monedaOrden: orden.moneda,
      tipoCambio: tipoCambio !== null ? Number(tipoCambio) : null,
      gastos,
    });
    const totalUnidades = lineas.reduce((sum: number, l: any) => sum + l.cantidad, 0);
    const costoUnitario = totalUnidades > 0 ? round(calc.costoTotal / totalUnidades) : 0;

    const actualizado = await tx.costeoImportacion.update({
      where: { id },
      data: {
        fecha: data.fecha ? new Date(data.fecha) : undefined,
        moneda,
        tipoCambio,
        costoProductos: calc.costoProductos,
        ...toCreateGastos(gastos),
        gastosTotal: calc.gastosTotal,
        costoTotal: calc.costoTotal,
        costoUnitario,
        observaciones: data.observaciones ?? undefined,
      },
    });

    // Si ya estaba confirmado, resincroniza lotes, costo real y kardex.
    if (costeo.estado === "CONFIRMADO") {
      await aplicarLotes(tx, actualizado.id);
    }

    return tx.costeoImportacion.findUnique({ where: { id }, include: includeCosteo });
  });
}

// ----------------------------------------------------------------------------
// Confirmación: lotes + costo real del producto + kardex.
// ----------------------------------------------------------------------------

export async function confirmarCosteo(id: string) {
  return prisma.$transaction(async (tx) => {
    const costeo = await tx.costeoImportacion.findUnique({ where: { id } });
    if (!costeo) throw NotFound("Costeo de Importación");

    // Idempotente: si ya está confirmado, se devuelve tal cual.
    if (costeo.estado === "CONFIRMADO") {
      return tx.costeoImportacion.findUnique({ where: { id }, include: includeCosteo });
    }

    await aplicarLotes(tx, id);

    return tx.costeoImportacion.update({
      where: { id },
      data: { estado: "CONFIRMADO" },
      include: includeCosteo,
    });
  });
}

// ----------------------------------------------------------------------------
// Eliminación: revierte el precio del producto al último costeo anterior.
// ----------------------------------------------------------------------------

export async function eliminarCosteo(id: string) {
  return prisma.$transaction(async (tx) => eliminarCosteoTx(tx, id));
}

export async function eliminarCosteoTx(
  tx: Prisma.TransactionClient,
  id: string,
) {
  const costeo = await tx.costeoImportacion.findUnique({
    where: { id },
    include: {
      lotes: { select: { productoId: true } },
      recepcion: { include: { orden: { include: { lineas: true } } } },
    },
  });
  if (!costeo) throw NotFound("Costeo de Importación");

  for (const lote of costeo.lotes) {
    const producto = await tx.producto.findUnique({ where: { id: lote.productoId } });
    const fueUltimo = producto?.ultimoCosteoId === costeo.id;

    await tx.loteImportacion.deleteMany({ where: { costeoId: costeo.id, productoId: lote.productoId } });

    if (fueUltimo && producto) {
      const previo = await tx.loteImportacion.findFirst({
        where: {
          productoId: lote.productoId,
          costeo: { id: { not: costeo.id }, estado: "CONFIRMADO" },
        },
        orderBy: { costeo: { fecha: "desc" } },
        include: { costeo: { select: { id: true, fecha: true } } },
      });

      if (previo) {
        await tx.producto.update({
          where: { id: lote.productoId },
          data: {
            costoUnitario: previo.costoUnitario,
            ultimaImportacionFecha: previo.costeo.fecha,
            ultimoCosteoId: previo.costeoId,
          },
        });
      } else {
        // Sin costeos previos: se revierte al costo base de la orden de compra.
        const ocLinea = costeo.recepcion.orden.lineas.find((l: any) => l.productoId === lote.productoId);
        const base = ocLinea ? Number(ocLinea.costoUnitario) : 0;
        await tx.producto.update({
          where: { id: lote.productoId },
          data: { costoUnitario: base, ultimaImportacionFecha: null, ultimoCosteoId: null },
        });
      }
    }

    await tx.movimientoInventario.updateMany({
      where: {
        productoId: lote.productoId,
        referenciaTipo: "RECEPCION",
        referenciaId: costeo.recepcionId,
        tipo: "ENTRADA",
      },
      data: { costoUnitario: null },
    });
  }

  await tx.costeoImportacion.delete({ where: { id } });
  return { id };
}
