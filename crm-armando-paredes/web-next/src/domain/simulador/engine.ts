// Motor de cálculo del Simulador Financiero.
// Funciones puras, sin estado ni efectos: toda la matemática vive aquí para
// poder reutilizarse, probarse y mantenerse separada de la UI. Ninguna de estas
// funciones escribe en el sistema: solo reciben números y devuelven números.

export type MonedaCosto = "PEN" | "USD";

export interface ProductoSimulador {
  id: string;
  sku: string;
  nombre: string;
  costoUnitario: number;
  precioVenta: number;
  stock: number;
  monedaCosto: MonedaCosto;
}

export interface DatosBase {
  productos: ProductoSimulador[];
  stockTotal: number;
  costoPromedio: number;
  precioPromedio: number;
  valorInventarioCosto: number;
  valorInventarioVenta: number;
  ventasMes: number;
  costoVentasMes: number;
  gananciaBrutaMes: number;
  margenBrutoMes: number;
  gastosOperativosMes: number;
  utilidadMes: number;
}

export interface ParametrosSimulacion {
  cantidad: number;
  precioVenta: number;
  publicidad: number;
  otrosGastos: number;
  descuentoPct: number;
}

export interface ResultadoSimulacion {
  cantidad: number;
  precioUnitarioNeto: number;
  ingresos: number;
  costoDeVentas: number;
  gananciaBruta: number;
  margenBruto: number;
  gastosSimulados: number;
  utilidad: number;
  margenNeto: number;
  stockRestante: number;
  valorInventarioRestante: number;
  capitalInvertido: number;
  capitalRecuperado: number;
  capitalPendiente: number;
  roi: number;
  puntoEquilibrio: number;
}

export interface ParametrosImportacion {
  costoProveedor: number;
  flete: number;
  banco: number;
  aduanas: number;
  otros: number;
  tipoCambio: number;
  cantidad: number;
  margenObjetivoPct: number;
}

export interface ResultadoImportacion {
  costoTotalUsd: number;
  costoTotalPen: number;
  costoUnitarioUsd: number;
  costoUnitarioPen: number;
  precioMinimo: number;
  precioSugerido: number;
  margenPorUnidad: number;
  capitalNecesarioPen: number;
}

export function redondear(valor: number, decimales = 2): number {
  if (!Number.isFinite(valor)) return 0;
  const factor = 10 ** decimales;
  return Math.round(valor * factor) / factor;
}

// Convierte a soles (moneda base) los costos fijados en USD por el Costeo de
// Importación cuando el usuario provee un tipo de cambio. Sin tipo de cambio
// los números se usan tal cual (mismo comportamiento que el Dashboard).
export function convertirMoneda(valor: number, moneda: MonedaCosto, tipoCambio: number | null): number {
  if (moneda === "USD" && tipoCambio && tipoCambio > 0) return valor * tipoCambio;
  return valor;
}

function promedio(valores: number[]): number {
  return valores.length > 0 ? valores.reduce((suma, v) => suma + v, 0) / valores.length : 0;
}

export function construirDatosBase(
  productos: ProductoSimulador[],
  tipoCambio: number | null,
  extras: { ventasMes: number; costoVentasMes: number; gastosOperativosMes: number },
): DatosBase {
  const stockTotal = productos.reduce((suma, p) => suma + Math.max(p.stock, 0), 0);

  const costos = productos.map((p) => convertirMoneda(p.costoUnitario, p.monedaCosto, tipoCambio));

  let valorCosto = 0;
  let valorVenta = 0;
  productos.forEach((p, i) => {
    const stock = Math.max(p.stock, 0);
    valorCosto += stock * costos[i];
    valorVenta += stock * p.precioVenta;
  });

  const costoPromedio = stockTotal > 0 ? valorCosto / stockTotal : promedio(costos);
  const precioPromedio =
    stockTotal > 0 ? valorVenta / stockTotal : promedio(productos.map((p) => p.precioVenta));

  const gananciaBrutaMes = extras.ventasMes - extras.costoVentasMes;
  const margenBrutoMes = extras.ventasMes > 0 ? (gananciaBrutaMes / extras.ventasMes) * 100 : 0;
  const utilidadMes = gananciaBrutaMes - extras.gastosOperativosMes;

  return {
    productos,
    stockTotal: redondear(stockTotal, 0),
    costoPromedio: redondear(costoPromedio),
    precioPromedio: redondear(precioPromedio),
    valorInventarioCosto: redondear(valorCosto),
    valorInventarioVenta: redondear(valorVenta),
    ventasMes: redondear(extras.ventasMes),
    costoVentasMes: redondear(extras.costoVentasMes),
    gananciaBrutaMes: redondear(gananciaBrutaMes),
    margenBrutoMes: redondear(margenBrutoMes),
    gastosOperativosMes: redondear(extras.gastosOperativosMes),
    utilidadMes: redondear(utilidadMes),
  };
}

export function simularVentas(base: DatosBase, params: ParametrosSimulacion): ResultadoSimulacion {
  const cantidad = Math.max(params.cantidad, 0);
  const descuento = Math.min(Math.max(params.descuentoPct, 0), 100);
  const precioUnitarioNeto = params.precioVenta * (1 - descuento / 100);

  const ingresos = cantidad * precioUnitarioNeto;
  const costoDeVentas = cantidad * base.costoPromedio;
  const gananciaBruta = ingresos - costoDeVentas;
  const margenBruto = ingresos > 0 ? (gananciaBruta / ingresos) * 100 : 0;

  const gastosSimulados = Math.max(params.publicidad, 0) + Math.max(params.otrosGastos, 0);
  const utilidad = gananciaBruta - gastosSimulados;
  const margenNeto = ingresos > 0 ? (utilidad / ingresos) * 100 : 0;

  const stockRestante = base.stockTotal - cantidad;
  const valorInventarioRestante = Math.max(stockRestante, 0) * base.costoPromedio;

  const capitalInvertido = base.valorInventarioCosto;
  const capitalRecuperado = Math.min(Math.max(costoDeVentas, 0), capitalInvertido);
  const capitalPendiente = Math.max(capitalInvertido - capitalRecuperado, 0);

  const roi = capitalInvertido > 0 ? (utilidad / capitalInvertido) * 100 : 0;

  const margenUnitario = precioUnitarioNeto - base.costoPromedio;
  const puntoEquilibrio = margenUnitario > 0 ? Math.ceil(gastosSimulados / margenUnitario) : 0;

  return {
    cantidad,
    precioUnitarioNeto: redondear(precioUnitarioNeto),
    ingresos: redondear(ingresos),
    costoDeVentas: redondear(costoDeVentas),
    gananciaBruta: redondear(gananciaBruta),
    margenBruto: redondear(margenBruto),
    gastosSimulados: redondear(gastosSimulados),
    utilidad: redondear(utilidad),
    margenNeto: redondear(margenNeto),
    stockRestante: redondear(stockRestante, 0),
    valorInventarioRestante: redondear(valorInventarioRestante),
    capitalInvertido: redondear(capitalInvertido),
    capitalRecuperado: redondear(capitalRecuperado),
    capitalPendiente: redondear(capitalPendiente),
    roi: redondear(roi),
    puntoEquilibrio,
  };
}

export function simularImportacion(params: ParametrosImportacion): ResultadoImportacion {
  const costoProveedor = Math.max(params.costoProveedor, 0);
  const flete = Math.max(params.flete, 0);
  const banco = Math.max(params.banco, 0);
  const aduanas = Math.max(params.aduanas, 0);
  const otros = Math.max(params.otros, 0);
  const tipoCambio = params.tipoCambio > 0 ? params.tipoCambio : 0;
  const cantidad = Math.max(Math.round(params.cantidad), 0);
  const margenObjetivoPct = Math.max(params.margenObjetivoPct, 0);

  const costoTotalUsd = costoProveedor + flete + banco + aduanas + otros;
  const costoTotalPen = costoTotalUsd * tipoCambio;
  const costoUnitarioUsd = cantidad > 0 ? costoTotalUsd / cantidad : 0;
  const costoUnitarioPen = cantidad > 0 ? costoTotalPen / cantidad : 0;
  const precioMinimo = costoUnitarioPen;
  const precioSugerido = costoUnitarioPen * (1 + margenObjetivoPct / 100);
  const margenPorUnidad = precioSugerido - costoUnitarioPen;

  return {
    costoTotalUsd: redondear(costoTotalUsd),
    costoTotalPen: redondear(costoTotalPen),
    costoUnitarioUsd: redondear(costoUnitarioUsd),
    costoUnitarioPen: redondear(costoUnitarioPen),
    precioMinimo: redondear(precioMinimo),
    precioSugerido: redondear(precioSugerido),
    margenPorUnidad: redondear(margenPorUnidad),
    capitalNecesarioPen: redondear(costoTotalPen),
  };
}

export function formatoMoneda(valor: number, decimales = 0): string {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  }).format(Number.isFinite(valor) ? valor : 0);
}

export function formatoNumero(valor: number, decimales = 0): string {
  return new Intl.NumberFormat("es-PE", {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  }).format(Number.isFinite(valor) ? valor : 0);
}

export function formatoPorcentaje(valor: number, decimales = 1): string {
  return `${formatoNumero(valor, decimales)}%`;
}
