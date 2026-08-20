"use client";

import { useEffect, useMemo, useState } from "react";
import { apiClient } from "@/infrastructure/api/ApiClient";
import {
  construirDatosBase,
  simularVentas,
  simularImportacion,
  formatoMoneda,
  formatoNumero,
  formatoPorcentaje,
  type ProductoSimulador,
} from "@/domain/simulador/engine";
import {
  GroupedBars,
  Donut,
  ProgressBar,
  ChartLegend,
  CHART_COLORS,
} from "@/presentation/components/simulador/Charts";

interface ProductoApi {
  id: string;
  sku: string | null;
  nombre: string;
  costoUnitario: number | string | null;
  precioVenta: number | string | null;
  estado: "ACTIVO" | "INACTIVO";
  ultimoCosteo: { moneda: "PEN" | "USD" } | null;
}

interface StockApi {
  productoId: string;
  stock: number | string;
}

interface KpisApi {
  ventas: { ventasTotales: number | string | null };
  rentabilidad: {
    costoDeVentas: number | string | null;
    gastosOperativos: number | string | null;
  };
}

interface FinanzasApi {
  gastos: { total: number | string | null };
}

function toNum(valor: number | string | null | undefined): number {
  const n = typeof valor === "string" ? parseFloat(valor) : (valor ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function monthRange() {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), 1);
  const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  return {
    desde: start.toISOString().slice(0, 10),
    hasta: end.toISOString().slice(0, 10),
  };
}

const ESCENARIOS = [
  { label: "Conservador", unidades: 30 },
  { label: "Esperado", unidades: 60 },
  { label: "Optimista", unidades: 100 },
];

export default function SimuladorFinancieroPage() {
  const [productos, setProductos] = useState<ProductoSimulador[]>([]);
  const [extras, setExtras] = useState({ ventasMes: 0, costoVentasMes: 0, gastosOperativosMes: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [tab, setTab] = useState<"ventas" | "importacion">("ventas");

  const [cantidad, setCantidad] = useState(0);
  const [precio, setPrecio] = useState<number | null>(null);
  const [descuento, setDescuento] = useState(0);
  const [publicidad, setPublicidad] = useState(0);
  const [otrosGastos, setOtrosGastos] = useState(0);
  const [tipoCambioNum, setTipoCambioNum] = useState(0);

  const [importCostoProveedor, setImportCostoProveedor] = useState(0);
  const [importFlete, setImportFlete] = useState(0);
  const [importBanco, setImportBanco] = useState(0);
  const [importAduanas, setImportAduanas] = useState(0);
  const [importOtros, setImportOtros] = useState(0);
  const [importTipoCambio, setImportTipoCambio] = useState(3.8);
  const [importCantidad, setImportCantidad] = useState(0);
  const [importMargenObjetivo, setImportMargenObjetivo] = useState(40);

  useEffect(() => {
    const { desde, hasta } = monthRange();

    async function load() {
      try {
        const [kpis, productosApi, stocks, finanzas] = await Promise.all([
          apiClient.get<KpisApi>("/dashboard/kpis").catch((e) => {
            console.error("Error en KPIs:", e);
            return null;
          }),
          apiClient.get<ProductoApi[]>("/productos?estado=ACTIVO").catch((e) => {
            console.error("Error en productos:", e);
            return null;
          }),
          apiClient.get<StockApi[]>("/movimientos/stock").catch((e) => {
            console.error("Error en stock:", e);
            return null;
          }),
          apiClient
            .get<FinanzasApi>(`/finanzas/resumen?desde=${desde}&hasta=${hasta}`)
            .catch((e) => {
              console.error("Error en finanzas:", e);
              return null;
            }),
        ]);

        const stockMap = new Map((stocks ?? []).map((s) => [s.productoId, toNum(s.stock)]));

        const sims: ProductoSimulador[] = (productosApi ?? [])
          .filter((p) => p.estado === "ACTIVO")
          .map((p) => ({
            id: p.id,
            sku: p.sku ?? "",
            nombre: p.nombre,
            costoUnitario: toNum(p.costoUnitario),
            precioVenta: toNum(p.precioVenta),
            stock: stockMap.get(p.id) ?? 0,
            monedaCosto: p.ultimoCosteo?.moneda === "USD" ? "USD" : "PEN",
          }));

        setProductos(sims);
        setExtras({
          ventasMes: toNum(kpis?.ventas?.ventasTotales),
          costoVentasMes: toNum(kpis?.rentabilidad?.costoDeVentas),
          gastosOperativosMes: toNum(finanzas?.gastos?.total ?? kpis?.rentabilidad?.gastosOperativos),
        });
      } catch (err) {
        console.error("Error cargando simulador:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const tipoCambio = useMemo(() => (tipoCambioNum > 0 ? tipoCambioNum : null), [tipoCambioNum]);

  const base = useMemo(() => construirDatosBase(productos, tipoCambio, extras), [productos, tipoCambio, extras]);

  const params = useMemo(
    () => ({
      cantidad,
      precioVenta: precio ?? base.precioPromedio,
      publicidad,
      otrosGastos,
      descuentoPct: descuento,
    }),
    [cantidad, precio, base.precioPromedio, publicidad, otrosGastos, descuento],
  );

  const resultado = useMemo(() => (base ? simularVentas(base, params) : null), [base, params]);

  const escenarios = useMemo(() => {
    if (!base) return [];
    return ESCENARIOS.map((s) => {
      const r = simularVentas(base, { ...params, cantidad: s.unidades });
      return { label: `${s.unidades} uds`, values: [r.ingresos, r.utilidad] };
    });
  }, [base, params]);

  const resultadoImportacion = useMemo(
    () =>
      simularImportacion({
        costoProveedor: importCostoProveedor,
        flete: importFlete,
        banco: importBanco,
        aduanas: importAduanas,
        otros: importOtros,
        tipoCambio: importTipoCambio,
        cantidad: importCantidad,
        margenObjetivoPct: importMargenObjetivo,
      }),
    [importCostoProveedor, importFlete, importBanco, importAduanas, importOtros, importTipoCambio, importCantidad, importMargenObjetivo],
  );

  function restablecer() {
    setCantidad(0);
    setPrecio(null);
    setDescuento(0);
    setPublicidad(0);
    setOtrosGastos(0);
    setTipoCambioNum(0);
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-[1600px] space-y-6 p-4 sm:p-6">
        <div className="skeleton h-40 rounded-[28px]" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="skeleton h-36 rounded-[24px]" />
          ))}
        </div>
      </div>
    );
  }

  if (error || base.productos.length === 0) {
    return (
      <div className="mx-auto max-w-[1600px] space-y-5 p-4 sm:p-6">
        <header>
          <h1 className="font-display text-2xl font-bold">Simulador Financiero</h1>
          <p className="mt-1 text-sm text-ink-muted">
            {error
              ? "No se pudieron cargar los datos base. Verifica que el servidor backend esté encendido."
              : "No hay productos activos con stock para simular. Registra inventario o productos antes de continuar."}
          </p>
        </header>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 p-4 sm:p-6">
      <header>
        <h1 className="font-display text-2xl font-bold">Simulador Financiero</h1>
        <p className="mt-1 text-sm text-ink-muted">
          ¿Qué pasaría si...? Proyecta ventas, márgenes y capital con datos reales del sistema. Nada de lo que
          simules aquí se guarda.
        </p>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2 rounded-2xl border p-1" style={{ borderColor: "var(--border)", background: "rgb(var(--surface-rgb))" }}>
          <TabButton active={tab === "ventas"} onClick={() => setTab("ventas")}>
            Simulador de Ventas
          </TabButton>
          <TabButton active={tab === "importacion"} onClick={() => setTab("importacion")}>
            Simulador de Importación
          </TabButton>
        </div>
        <span className="text-xs text-ink-faint">Fuentes: Productos · Inventario · Costeo · Ventas · Gastos</span>
      </div>

      {tab === "ventas" ? (
        <>
          <section
            className="rounded-[28px] border p-5 sm:p-6"
            style={{ borderColor: "var(--border)", background: "rgb(var(--surface-rgb))" }}
          >
            <SectionTitle
              title="Situación actual"
              subtitle="Indicadores reales calculados con el costo del Costeo de Importación"
            />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              <StatCard label="Stock disponible" value={`${formatoNumero(base.stockTotal)} uds`} tone="blue" />
              <StatCard label="Costo promedio unitario" value={formatoMoneda(base.costoPromedio, 2)} tone="gold" />
              <StatCard label="Precio promedio de venta" value={formatoMoneda(base.precioPromedio, 2)} tone="gold" />
              <StatCard label="Valor del inventario" value={formatoMoneda(base.valorInventarioCosto)} detail="a costo real" tone="violet" />
              <StatCard label="Valor de venta del inventario" value={formatoMoneda(base.valorInventarioVenta)} tone="violet" />
              <StatCard label="Ventas del mes" value={formatoMoneda(base.ventasMes)} tone="green" />
              <StatCard label="Costo de ventas" value={formatoMoneda(base.costoVentasMes)} tone="red" />
              <StatCard label="Ganancia bruta" value={formatoMoneda(base.gananciaBrutaMes)} tone="green" />
              <StatCard label="Margen bruto" value={formatoPorcentaje(base.margenBrutoMes)} tone="green" />
              <StatCard label="Gastos operativos" value={formatoMoneda(base.gastosOperativosMes)} tone="red" />
              <StatCard label="Utilidad estimada" value={formatoMoneda(base.utilidadMes)} tone="gold" />
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <div
              className="rounded-[28px] border p-5 sm:p-6"
              style={{ borderColor: "var(--border)", background: "rgb(var(--surface-rgb))" }}
            >
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">Parámetros de simulación</h2>
                  <p className="text-sm text-ink-muted">Los resultados se recalculan mientras escribes.</p>
                </div>
                <button
                  type="button"
                  onClick={restablecer}
                  className="rounded-xl border px-4 py-2 text-sm font-medium"
                  style={{ borderColor: "var(--border-strong)", color: "rgb(var(--ink-rgb))" }}
                >
                  Restablecer valores
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <NumField label="Cantidad a vender" value={cantidad} onChange={setCantidad} min={0} step={1} suffix="uds" />

                <div className="sm:col-span-2">
                  <span className="label mb-1.5 block">Escenarios rápidos</span>
                  <div className="flex gap-2">
                    {ESCENARIOS.map((s) => (
                      <button
                        key={s.unidades}
                        type="button"
                        onClick={() => setCantidad(s.unidades)}
                        className="flex-1 rounded-xl border px-3 py-2 text-center text-xs font-semibold transition-colors"
                        style={
                          cantidad === s.unidades
                            ? {
                                borderColor: "rgb(var(--gold-rgb) / 0.5)",
                                background: "rgb(var(--gold-rgb) / 0.14)",
                                color: "rgb(var(--gold-rgb))",
                              }
                            : { borderColor: "var(--border)", color: "rgb(var(--ink-muted-rgb))" }
                        }
                      >
                        {s.label} · {s.unidades}
                      </button>
                    ))}
                  </div>
                </div>

                <NumField
                  label="Precio de venta"
                  value={precio ?? base.precioPromedio}
                  onChange={setPrecio}
                  min={0}
                  step={0.01}
                  prefix="S/"
                />
                <NumField
                  label="Descuento aplicado"
                  value={descuento}
                  onChange={setDescuento}
                  min={0}
                  max={100}
                  step={1}
                  suffix="%"
                />
                <NumField
                  label="Costo de publicidad"
                  value={publicidad}
                  onChange={setPublicidad}
                  min={0}
                  step={10}
                  prefix="S/"
                />
                <NumField
                  label="Otros gastos"
                  value={otrosGastos}
                  onChange={setOtrosGastos}
                  min={0}
                  step={10}
                  prefix="S/"
                />
                <NumField
                  label="Tipo de cambio"
                  value={tipoCambioNum}
                  onChange={setTipoCambioNum}
                  min={0}
                  step={0.01}
                  hint="Opcional. Convierte costos fijados en USD a soles."
                />
              </div>
            </div>

            <div
              className="rounded-[28px] border p-5 sm:p-6"
              style={{ borderColor: "var(--border)", background: "rgb(var(--surface-rgb))" }}
            >
              <SectionTitle title="Resultados proyectados" subtitle={`Escenario de ${formatoNumero(resultado?.cantidad ?? 0)} unidades vendidas`} />
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <StatCard label="Ingresos" value={formatoMoneda(resultado?.ingresos ?? 0)} tone="green" />
                <StatCard label="Costo de ventas" value={formatoMoneda(resultado?.costoDeVentas ?? 0)} tone="red" />
                <StatCard label="Ganancia bruta" value={formatoMoneda(resultado?.gananciaBruta ?? 0)} tone="green" />
                <StatCard label="Publicidad + gastos" value={formatoMoneda(resultado?.gastosSimulados ?? 0)} tone="red" />
                <StatCard label="Utilidad neta" value={formatoMoneda(resultado?.utilidad ?? 0)} tone="gold" />
                <StatCard label="Margen bruto" value={formatoPorcentaje(resultado?.margenBruto ?? 0)} tone="green" />
                <StatCard label="Margen neto" value={formatoPorcentaje(resultado?.margenNeto ?? 0)} tone="green" />
                <StatCard label="Stock restante" value={`${formatoNumero(resultado?.stockRestante ?? 0)} uds`} tone="blue" />
                <StatCard label="Valor inventario restante" value={formatoMoneda(resultado?.valorInventarioRestante ?? 0)} tone="violet" />
                <StatCard label="Capital invertido" value={formatoMoneda(resultado?.capitalInvertido ?? 0)} tone="violet" />
                <StatCard label="Capital recuperado" value={formatoMoneda(resultado?.capitalRecuperado ?? 0)} tone="green" />
                <StatCard label="Capital pendiente" value={formatoMoneda(resultado?.capitalPendiente ?? 0)} tone="red" />
                <StatCard label="ROI" value={formatoPorcentaje(resultado?.roi ?? 0)} tone="gold" />
                <StatCard
                  label="Punto de equilibrio"
                  value={resultado && resultado.puntoEquilibrio > 0 ? `${formatoNumero(resultado.puntoEquilibrio)} uds` : "—"}
                  tone="blue"
                />
                <StatCard
                  label="Precio neto por unidad"
                  value={formatoMoneda(resultado?.precioUnitarioNeto ?? 0, 2)}
                  detail={descuento > 0 ? `con ${formatoPorcentaje(descuento)} de descuento` : "sin descuento"}
                  tone="gold"
                />
              </div>
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
            <div
              className="rounded-[28px] border p-5 sm:p-6"
              style={{ borderColor: "var(--border)", background: "rgb(var(--surface-rgb))" }}
            >
              <SectionTitle
                title="Ingresos vs utilidad por escenario"
                subtitle="Con tu precio y gastos actuales"
              />
              <div className="mt-2">
                <GroupedBars
                  groups={escenarios}
                  series={[
                    { name: "Ingresos", color: CHART_COLORS.gold },
                    { name: "Utilidad", color: CHART_COLORS.violet },
                  ]}
                />
              </div>
              <div className="mt-3">
                <ChartLegend
                  series={[
                    { name: "Ingresos", color: CHART_COLORS.gold },
                    { name: "Utilidad", color: CHART_COLORS.violet },
                  ]}
                />
              </div>
            </div>

            <div
              className="rounded-[28px] border p-5 sm:p-6"
              style={{ borderColor: "var(--border)", background: "rgb(var(--surface-rgb))" }}
            >
              <SectionTitle title="Capital" subtitle="Recuperado al vender este escenario" />
              <div className="mt-4">
                <Donut
                  parts={[
                    { label: "Recuperado", value: Math.round(resultado?.capitalRecuperado ?? 0), color: CHART_COLORS.green },
                    { label: "Pendiente", value: Math.round(resultado?.capitalPendiente ?? 0), color: CHART_COLORS.red },
                  ]}
                />
              </div>
              <div className="mt-6 space-y-5">
                <ProgressBar
                  label="Stock restante"
                  value={resultado?.stockRestante ?? 0}
                  max={base.stockTotal}
                  color={CHART_COLORS.blue}
                  suffix={`${formatoNumero(resultado?.stockRestante ?? 0)} uds`}
                />
                <ProgressBar
                  label="Margen neto"
                  value={Math.max(resultado?.margenNeto ?? 0, 0)}
                  max={100}
                  color={CHART_COLORS.green}
                  suffix={formatoPorcentaje(resultado?.margenNeto ?? 0)}
                />
                <ProgressBar
                  label="Margen bruto"
                  value={Math.max(resultado?.margenBruto ?? 0, 0)}
                  max={100}
                  color={CHART_COLORS.violet}
                  suffix={formatoPorcentaje(resultado?.margenBruto ?? 0)}
                />
              </div>
            </div>
          </section>
        </>
      ) : (
        <>
          <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <div
              className="rounded-[28px] border p-5 sm:p-6"
              style={{ borderColor: "var(--border)", background: "rgb(var(--surface-rgb))" }}
            >
              <SectionTitle
                title="Costos de importación"
                subtitle="Ingresa los valores en USD; el tipo de cambio los convierte a soles."
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <NumField label="Costo del proveedor" value={importCostoProveedor} onChange={setImportCostoProveedor} min={0} step={0.01} prefix="US$" />
                <NumField label="Flete / courier" value={importFlete} onChange={setImportFlete} min={0} step={0.01} prefix="US$" />
                <NumField label="Comisión bancaria" value={importBanco} onChange={setImportBanco} min={0} step={0.01} prefix="US$" />
                <NumField label="Aduanas e impuestos" value={importAduanas} onChange={setImportAduanas} min={0} step={0.01} prefix="US$" />
                <NumField label="Otros gastos" value={importOtros} onChange={setImportOtros} min={0} step={0.01} prefix="US$" />
                <NumField label="Tipo de cambio" value={importTipoCambio} onChange={setImportTipoCambio} min={0} step={0.01} hint="Soles por dólar" />
                <NumField label="Unidades a importar" value={importCantidad} onChange={setImportCantidad} min={0} step={1} suffix="uds" />
                <NumField
                  label="Margen objetivo"
                  value={importMargenObjetivo}
                  onChange={setImportMargenObjetivo}
                  min={0}
                  step={1}
                  suffix="%"
                />
              </div>
            </div>

            <div
              className="rounded-[28px] border p-5 sm:p-6"
              style={{ borderColor: "var(--border)", background: "rgb(var(--surface-rgb))" }}
            >
              <SectionTitle title="Resultado del importe" subtitle="Cálculo en tiempo real, solo en pantalla" />
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <StatCard label="Costo total (USD)" value={`US$ ${formatoNumero(resultadoImportacion.costoTotalUsd, 2)}`} tone="violet" />
                <StatCard label="Costo total (S/)" value={formatoMoneda(resultadoImportacion.costoTotalPen, 2)} tone="violet" />
                <StatCard label="Costo unitario (USD)" value={`US$ ${formatoNumero(resultadoImportacion.costoUnitarioUsd, 2)}`} tone="red" />
                <StatCard label="Costo unitario (S/)" value={formatoMoneda(resultadoImportacion.costoUnitarioPen, 2)} tone="red" />
                <StatCard label="Precio mínimo" value={formatoMoneda(resultadoImportacion.precioMinimo, 2)} detail="cubre el costo" tone="blue" />
                <StatCard
                  label="Precio sugerido"
                  value={formatoMoneda(resultadoImportacion.precioSugerido, 2)}
                  detail={`con ${formatoPorcentaje(importMargenObjetivo)} de margen`}
                  tone="gold"
                />
                <StatCard label="Margen por unidad" value={formatoMoneda(resultadoImportacion.margenPorUnidad, 2)} tone="green" />
                <StatCard label="Capital necesario" value={formatoMoneda(resultadoImportacion.capitalNecesarioPen, 2)} tone="gold" />
              </div>
            </div>
          </section>

          <div
            className="rounded-2xl border px-5 py-4 text-xs text-ink-muted"
            style={{ borderColor: "var(--border)" }}
          >
            Sugerencia: compara el <span className="font-semibold text-ink">costo unitario en soles</span> de tu
            importación con el <span className="font-semibold text-ink">precio promedio de venta</span> actual (
            {formatoMoneda(base.precioPromedio, 2)}) para validar que el margen sea sostenible.
          </div>
        </>
      )}
    </div>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-5">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="text-sm text-ink-muted">{subtitle}</p>
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-xl px-4 py-2 text-sm font-semibold transition-colors"
      style={
        active
          ? { background: "rgb(var(--gold-rgb))", color: "rgb(var(--bg-rgb))" }
          : { color: "rgb(var(--ink-muted-rgb))" }
      }
    >
      {children}
    </button>
  );
}

type StatTone = "gold" | "blue" | "green" | "red" | "violet";

const STAT_TONES: Record<StatTone, { bg: string; border: string }> = {
  gold: { bg: "rgba(212,165,116,0.12)", border: "rgba(212,165,116,0.32)" },
  blue: { bg: "rgba(124,156,198,0.12)", border: "rgba(124,156,198,0.28)" },
  green: { bg: "rgba(111,184,168,0.12)", border: "rgba(111,184,168,0.28)" },
  red: { bg: "rgba(224,120,86,0.12)", border: "rgba(224,120,86,0.28)" },
  violet: { bg: "rgba(155,138,201,0.12)", border: "rgba(155,138,201,0.28)" },
};

function StatCard({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: string;
  detail?: string;
  tone: StatTone;
}) {
  return (
    <article className="rounded-2xl border p-4" style={{ borderColor: STAT_TONES[tone].border, background: STAT_TONES[tone].bg }}>
      <div className="label">{label}</div>
      <div className="mt-2 text-xl font-bold tracking-tight" style={{ color: "rgb(var(--ink-rgb))" }}>
        {value}
      </div>
      {detail && <div className="mt-1 text-xs" style={{ color: "rgb(var(--ink-muted-rgb))" }}>{detail}</div>}
    </article>
  );
}

function NumField({
  label,
  value,
  onChange,
  prefix,
  suffix,
  step,
  min,
  max,
  hint,
}: {
  label: string;
  value: number | string;
  onChange: (value: number) => void;
  prefix?: string;
  suffix?: string;
  step?: number;
  min?: number;
  max?: number;
  hint?: string;
}) {
  const numeric = typeof value === "number" ? value : parseFloat(value);

  return (
    <label className="block">
      <span className="label mb-1.5 block">{label}</span>
      <div className="relative">
        {prefix && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-ink-faint">{prefix}</span>
        )}
        <input
          type="number"
          inputMode="decimal"
          step={step}
          min={min}
          max={max}
          value={typeof value === "string" ? value : Number.isFinite(numeric) ? numeric : 0}
          onChange={(e) => {
            const raw = e.target.value;
            const n = raw === "" ? 0 : Number(raw);
            onChange(Number.isFinite(n) ? n : 0);
          }}
          className="inp"
          style={{
            paddingLeft: prefix ? "2.3rem" : undefined,
            paddingRight: suffix ? "3rem" : undefined,
          }}
        />
        {suffix && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink-faint">{suffix}</span>
        )}
      </div>
      {hint && <span className="mt-1 block text-xs text-ink-faint">{hint}</span>}
    </label>
  );
}
