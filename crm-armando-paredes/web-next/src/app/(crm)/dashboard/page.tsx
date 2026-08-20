"use client";

import { type ReactNode, useEffect, useMemo, useState } from "react";
import { apiClient } from "@/infrastructure/api/ApiClient";

interface DashboardKpis {
  inventario: {
    totalProductos: number;
    productosActivos: number;
    productosConStockBajo: number;
    alertasStock: Array<{
      id: string;
      sku: string;
      nombre: string;
      stockActual: number;
      stockMinimo: number;
    }>;
  };
  ventas: {
    pedidosMes: number;
    pedidosPagadosMes: number;
    ventasTotales: number;
  };
  compras: {
    ordenesPendientes: number;
    ordenesEnProceso: number;
  };
  proveedores: {
    totalProveedores: number;
    proveedoresActivos: number;
  };
  finanzas: {
    gastosMes: number;
  };
  rentabilidad: {
    valorInventario: number;
    costoPromedio: number;
    costoDeVentas: number;
    gananciaBruta: number;
    margenBruto: number;
    gastosOperativos: number;
    utilidadEstimada: number;
  };
}

interface TopInfluencer {
  id: string;
  nombre: string;
  metaPublicaciones: number;
  instagram: string | null;
  tiktok: string | null;
  youtube: string | null;
  ultimaMetrica: { seguidores: number; engagement: number; alcance: number; publicaciones: number } | null;
}

interface FinanzasResumen {
  ventas: { total: number; cantidad: number };
  gastos: { total: number; cantidad: number; porCategoria: Array<{ categoria: string; monto: number }> };
  utilidad: { bruta: number };
  pedidosPorEstado: Array<{ estado: string; total: number; cantidad: number }>;
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

function money(value: number) {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    maximumFractionDigits: 0,
  }).format(value);
}

type MetricTone = "gold" | "blue" | "green" | "red" | "violet";

export default function DashboardPage() {
  const [kpis, setKpis] = useState<DashboardKpis | null>(null);
  const [finanzas, setFinanzas] = useState<FinanzasResumen | null>(null);
  const [topInfluencers, setTopInfluencers] = useState<TopInfluencer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { desde, hasta } = monthRange();

    async function load() {
      try {
        const [kpisData, finanzasData, topData] = await Promise.all([
          apiClient.get<DashboardKpis>("/dashboard/kpis").catch((e) => {
            console.error("Error en KPIs:", e);
            return null;
          }),
          apiClient.get<FinanzasResumen>(`/finanzas/resumen?desde=${desde}&hasta=${hasta}`).catch(() => null),
          apiClient.get<TopInfluencer[]>("/influencers/top").catch(() => []),
        ]);

        if (kpisData) setKpis(kpisData);
        setFinanzas(finanzasData);
        setTopInfluencers(topData);
      } finally {
        setLoading(false);
      }
    }

    load().catch((error) => {
      console.error("Error cargando dashboard:", error);
      setLoading(false);
    });
  }, []);

  const cards = useMemo<Array<{ label: string; value: string; detail: string; tone: MetricTone }>>(() => {
    if (!kpis) return [];

    return [
      { label: "Ventas del mes", value: money(kpis.ventas.ventasTotales), detail: `${kpis.ventas.pedidosMes} pedidos`, tone: "gold" },
      { label: "Productos", value: String(kpis.inventario.totalProductos), detail: `${kpis.inventario.productosActivos} activos`, tone: "blue" },
      { label: "Inventario", value: String(kpis.inventario.productosActivos), detail: "productos operativos", tone: "green" },
      { label: "Stock bajo", value: String(kpis.inventario.productosConStockBajo), detail: "requieren reposición", tone: "red" },
      { label: "Pedidos", value: String(kpis.ventas.pedidosMes), detail: `${kpis.ventas.pedidosPagadosMes} pagados`, tone: "green" },
      { label: "Compras", value: String(kpis.compras.ordenesPendientes + kpis.compras.ordenesEnProceso), detail: "órdenes abiertas", tone: "violet" },
      { label: "Gastos", value: money(finanzas?.gastos.total ?? kpis.finanzas.gastosMes), detail: "mes actual", tone: "red" },
      { label: "Valor inventario", value: money(kpis.rentabilidad.valorInventario), detail: "a costo real", tone: "blue" },
      { label: "Margen bruto", value: `${kpis.rentabilidad.margenBruto.toFixed(1)}%`, detail: `${money(kpis.rentabilidad.gananciaBruta)} de ganancia`, tone: "green" },
      { label: "Costo de ventas", value: money(kpis.rentabilidad.costoDeVentas), detail: "mes actual", tone: "violet" },
      { label: "Utilidad estimada", value: money(kpis.rentabilidad.utilidadEstimada), detail: "ganancia − gastos", tone: "gold" },
    ];
  }, [finanzas, kpis]);

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

  if (!kpis) {
    return (
      <div className="mx-auto max-w-[1600px] space-y-5 p-4 sm:p-6">
        <header>
          <h1 className="font-display text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-ink-muted">No se pudieron cargar los indicadores. Verifica que el servidor backend esté encendido.</p>
        </header>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 p-4 sm:p-6">
      <section
        className="overflow-hidden rounded-[32px] border p-7"
        style={{
          borderColor: "var(--border)",
          background:
            "radial-gradient(circle at top left, rgba(212,165,116,0.18), transparent 34%), linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0)), rgb(var(--surface-rgb))",
        }}
      >
        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <div>
            <div className="mb-3 text-[11px] uppercase tracking-[0.28em]" style={{ color: "rgb(var(--ink-faint-rgb))" }}>
              SafeSound ERP
            </div>
            <h1 className="max-w-2xl text-3xl font-bold tracking-tight" style={{ color: "rgb(var(--ink-rgb))" }}>
              Resumen ejecutivo de ventas, compras e inventario en una sola vista.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6" style={{ color: "rgb(var(--ink-muted-rgb))" }}>
              El tablero consolida actividad comercial, salud de stock y utilidad bruta del período actual para iniciar la operación diaria.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <SummaryPanel label="Resultado operativo" value={money(finanzas?.utilidad.bruta ?? kpis.ventas.ventasTotales - kpis.finanzas.gastosMes)} />
            <SummaryPanel label="Proveedores activos" value={String(kpis.proveedores.proveedoresActivos)} />
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <MetricCard key={card.label} {...card} />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="grid gap-6">
          <Panel title="Ventas y rentabilidad" subtitle="Datos del mes actual">
            <div className="grid gap-4 md:grid-cols-3">
              <MiniStat label="Ventas cobradas" value={money(finanzas?.ventas.total ?? kpis.ventas.ventasTotales)} />
              <MiniStat label="Pedidos cobrados" value={String(kpis.ventas.pedidosPagadosMes)} />
              <MiniStat label="Ticket promedio" value={money((finanzas?.ventas.total ?? kpis.ventas.ventasTotales) / Math.max(kpis.ventas.pedidosPagadosMes, 1))} />
            </div>
          </Panel>

          <Panel title="Rentabilidad a costo real" subtitle="Costos fijados por el Costeo de Importación">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <MiniStat label="Costo de ventas" value={money(kpis.rentabilidad.costoDeVentas)} />
              <MiniStat label="Ganancia bruta" value={money(kpis.rentabilidad.gananciaBruta)} />
              <MiniStat label="Margen bruto" value={`${kpis.rentabilidad.margenBruto.toFixed(1)}%`} />
              <MiniStat label="Utilidad estimada" value={money(kpis.rentabilidad.utilidadEstimada)} />
            </div>
            <div className="mt-4 rounded-2xl border px-4 py-3 text-xs text-ink-muted" style={{ borderColor: "var(--border)" }}>
              Costo promedio unitario en stock: <span className="font-semibold text-ink">{money(kpis.rentabilidad.costoPromedio)}</span>
              · Gastos operativos del mes: <span className="font-semibold text-ink">{money(kpis.rentabilidad.gastosOperativos)}</span>
            </div>
          </Panel>

          <Panel title="Compras e inventario" subtitle="Operación pendiente">
            <div className="grid gap-4 md:grid-cols-2">
              <MiniStat label="Órdenes pendientes" value={String(kpis.compras.ordenesPendientes)} />
              <MiniStat label="Órdenes en proceso" value={String(kpis.compras.ordenesEnProceso)} />
            </div>
          </Panel>

          <Panel title="Stock bajo" subtitle="Productos que requieren acción">
            <div className="space-y-3">
              {kpis.inventario.alertasStock.length === 0 && (
                <div className="rounded-2xl border px-4 py-6 text-sm text-ink-muted" style={{ borderColor: "var(--border)" }}>
                  No hay productos críticos por debajo del mínimo.
                </div>
              )}
              {kpis.inventario.alertasStock.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-2xl border px-4 py-3"
                  style={{ borderColor: "var(--border)", background: "rgb(var(--bg-rgb) / 0.5)" }}
                >
                  <div>
                    <div className="text-sm font-semibold">{item.nombre}</div>
                    <div className="font-mono text-xs text-ink-muted">{item.sku}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold">Stock: {item.stockActual}</div>
                    <div className="text-xs text-ink-muted">Mínimo: {item.stockMinimo}</div>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <div className="grid gap-6">
          <Panel title="Pedidos por estado" subtitle="Lectura rápida del flujo comercial">
            <div className="space-y-3">
              {(finanzas?.pedidosPorEstado ?? []).map((item) => (
                <div key={item.estado} className="rounded-2xl border px-4 py-3" style={{ borderColor: "var(--border)" }}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">{item.estado.replace(/_/g, " ")}</span>
                    <span className="text-sm text-ink-muted">{item.cantidad}</span>
                  </div>
                  <div className="mt-1 text-xs text-ink-faint">{money(item.total)}</div>
                </div>
              ))}
              {(!finanzas || finanzas.pedidosPorEstado.length === 0) && (
                <div className="rounded-2xl border px-4 py-6 text-sm text-ink-muted" style={{ borderColor: "var(--border)" }}>
                  El resumen financiero aún no devolvió distribución de estados.
                </div>
              )}
            </div>
          </Panel>

          <Panel title="Gastos por categoría" subtitle="Top del período actual">
            <div className="space-y-3">
              {(finanzas?.gastos.porCategoria ?? []).slice(0, 5).map((item) => (
                <div key={item.categoria} className="flex items-center justify-between rounded-2xl border px-4 py-3" style={{ borderColor: "var(--border)" }}>
                  <span className="text-sm font-medium">{item.categoria}</span>
                  <span className="text-sm font-semibold">{money(item.monto)}</span>
                </div>
              ))}
              {(!finanzas || finanzas.gastos.porCategoria.length === 0) && (
                <div className="rounded-2xl border px-4 py-6 text-sm text-ink-muted" style={{ borderColor: "var(--border)" }}>
                  No hay categorías de gasto disponibles para este período.
                </div>
              )}
            </div>
          </Panel>

          {topInfluencers.length > 0 && (
            <Panel title="Top Influencers" subtitle="Por engagement rate">
              <div className="space-y-3">
                {topInfluencers.map((inf) => (
                  <div key={inf.id} className="flex items-center justify-between rounded-2xl border px-4 py-3" style={{ borderColor: "var(--border)", background: "rgb(var(--bg-rgb) / 0.5)" }}>
                    <div>
                      <div className="text-sm font-semibold">{inf.nombre}</div>
                      <div className="text-xs text-ink-muted">
                        {[inf.instagram && `IG: @${inf.instagram}`, inf.tiktok && `TT: @${inf.tiktok}`, inf.youtube && `YT: ${inf.youtube}`]
                          .filter(Boolean)
                          .join(" · ") || "Meta: " + inf.metaPublicaciones + " pubs/mes"}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold">{inf.ultimaMetrica?.engagement.toFixed(1) ?? "—"}%</div>
                      <div className="text-xs text-ink-muted">
                        {inf.ultimaMetrica
                          ? `${inf.ultimaMetrica.publicaciones}/${inf.metaPublicaciones} pubs`
                          : `${inf.metaPublicaciones} pubs/mes`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          )}
        </div>
      </section>
    </div>
  );
}

function MetricCard({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  tone: MetricTone;
}) {
  const tones: Record<typeof tone, { bg: string; border: string }> = {
    gold: { bg: "rgba(212,165,116,0.12)", border: "rgba(212,165,116,0.32)" },
    blue: { bg: "rgba(124,156,198,0.12)", border: "rgba(124,156,198,0.28)" },
    green: { bg: "rgba(111,184,168,0.12)", border: "rgba(111,184,168,0.28)" },
    red: { bg: "rgba(224,120,86,0.12)", border: "rgba(224,120,86,0.28)" },
    violet: { bg: "rgba(155,138,201,0.12)", border: "rgba(155,138,201,0.28)" },
  };

  return (
    <article className="rounded-[24px] border p-5" style={{ borderColor: tones[tone].border, background: tones[tone].bg }}>
      <div className="text-[11px] uppercase tracking-[0.18em]" style={{ color: "rgb(var(--ink-faint-rgb))" }}>
        {label}
      </div>
      <div className="mt-4 text-3xl font-bold tracking-tight" style={{ color: "rgb(var(--ink-rgb))" }}>
        {value}
      </div>
      <div className="mt-2 text-sm" style={{ color: "rgb(var(--ink-muted-rgb))" }}>
        {detail}
      </div>
    </article>
  );
}

function Panel({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <section className="rounded-[28px] border p-5" style={{ borderColor: "var(--border)", background: "rgb(var(--surface-rgb))" }}>
      <div className="mb-5">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-sm text-ink-muted">{subtitle}</p>
      </div>
      {children}
    </section>
  );
}

function SummaryPanel({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] border p-4" style={{ borderColor: "var(--border)", background: "rgb(var(--bg-rgb) / 0.46)" }}>
      <div className="text-xs uppercase tracking-[0.18em] text-ink-faint">{label}</div>
      <div className="mt-2 text-2xl font-bold">{value}</div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border p-4" style={{ borderColor: "var(--border)", background: "rgb(var(--bg-rgb) / 0.4)" }}>
      <div className="text-xs text-ink-faint">{label}</div>
      <div className="mt-2 text-xl font-semibold">{value}</div>
    </div>
  );
}
