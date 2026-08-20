"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/infrastructure/api/ApiClient";

interface FinanzasResumen {
  periodo: { desde: string; hasta: string };
  ventas: { total: number; cantidad: number };
  gastos: { total: number; cantidad: number; porCategoria: Array<{ categoria: string; monto: number }> };
  utilidad: { bruta: number };
  pedidosPorEstado: Array<{ estado: string; total: number; cantidad: number }>;
}

function currentPeriod() {
  const today = new Date();
  const desde = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
  const hasta = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().slice(0, 10);
  return { desde, hasta };
}

function money(value: number) {
  return new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN", maximumFractionDigits: 0 }).format(value);
}

export default function FinanzasPage() {
  const [filters, setFilters] = useState(currentPeriod());
  const [data, setData] = useState<FinanzasResumen | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const result = await apiClient.get<FinanzasResumen>(`/finanzas/resumen?desde=${filters.desde}&hasta=${filters.hasta}`);
        setData(result);
      } finally {
        setLoading(false);
      }
    }

    load().catch((error) => {
      console.error("Error cargando finanzas:", error);
      setLoading(false);
    });
  }, [filters]);

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 p-4 sm:p-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Finanzas</h1>
          <p className="text-sm text-ink-muted">Resumen financiero del período seleccionado.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div>
            <label className="text-2xs font-semibold uppercase tracking-normal text-ink-faint">Desde</label>
            <input
              type="date"
              className="inp mt-1.5"
              value={filters.desde}
              onChange={(e) => setFilters((prev) => ({ ...prev, desde: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-2xs font-semibold uppercase tracking-normal text-ink-faint">Hasta</label>
            <input
              type="date"
              className="inp mt-1.5"
              value={filters.hasta}
              onChange={(e) => setFilters((prev) => ({ ...prev, hasta: e.target.value }))}
            />
          </div>
        </div>
      </header>

      {loading && <div className="card p-6 text-sm text-ink-muted">Cargando resumen financiero...</div>}

      {!loading && data && (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <FinanceCard label="Ventas" value={money(data.ventas.total)} detail={`${data.ventas.cantidad} pedidos`} />
            <FinanceCard label="Gastos" value={money(data.gastos.total)} detail={`${data.gastos.cantidad} registros`} />
            <FinanceCard label="Utilidad bruta" value={money(data.utilidad.bruta)} detail="ventas - gastos" />
            <FinanceCard label="Margen" value={`${data.ventas.total > 0 ? ((data.utilidad.bruta / data.ventas.total) * 100).toFixed(1) : "0.0"}%`} detail="sobre ventas" />
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <div className="card p-5">
              <div className="mb-4">
                <h2 className="text-lg font-semibold">Gastos por categoría</h2>
                <p className="text-sm text-ink-muted">Distribución principal del gasto operativo.</p>
              </div>
              <div className="space-y-3">
                {data.gastos.porCategoria.map((item) => (
                  <div key={item.categoria} className="flex items-center justify-between rounded-2xl border px-4 py-3" style={{ borderColor: "var(--border)" }}>
                    <span className="text-sm font-medium">{item.categoria}</span>
                    <span className="text-sm font-semibold">{money(item.monto)}</span>
                  </div>
                ))}
                {data.gastos.porCategoria.length === 0 && <EmptyState text="No hay gastos en el período seleccionado." />}
              </div>
            </div>

            <div className="card p-5">
              <div className="mb-4">
                <h2 className="text-lg font-semibold">Pedidos por estado</h2>
                <p className="text-sm text-ink-muted">Lectura rápida del ciclo comercial.</p>
              </div>
              <div className="space-y-3">
                {data.pedidosPorEstado.map((item) => (
                  <div key={item.estado} className="rounded-2xl border px-4 py-3" style={{ borderColor: "var(--border)" }}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{item.estado.replace(/_/g, " ")}</span>
                      <span className="text-sm text-ink-muted">{item.cantidad}</span>
                    </div>
                    <div className="mt-1 text-sm font-semibold">{money(item.total)}</div>
                  </div>
                ))}
                {data.pedidosPorEstado.length === 0 && <EmptyState text="No hay pedidos en el período seleccionado." />}
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function FinanceCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <article className="card p-5">
      <div className="text-xs uppercase tracking-[0.16em] text-ink-faint">{label}</div>
      <div className="mt-3 text-3xl font-bold">{value}</div>
      <div className="mt-2 text-sm text-ink-muted">{detail}</div>
    </article>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border px-4 py-6 text-sm text-ink-muted" style={{ borderColor: "var(--border)" }}>
      {text}
    </div>
  );
}
