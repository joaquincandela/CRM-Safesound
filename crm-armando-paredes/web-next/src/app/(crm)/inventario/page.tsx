"use client";

import { useEffect, useState } from "react";
import { apiClient, ApiError } from "@/infrastructure/api/ApiClient";

interface Producto {
  id: string;
  sku: string;
  nombre: string;
  stockMinimo: number;
  estado: string;
}

interface StockEntry {
  productoId: string;
  stock: number;
}

interface Movimiento {
  id: string;
  producto: { sku: string; nombre: string };
  tipo: string;
  cantidad: number;
  costoUnitario: number | null;
  stockAnterior: number;
  stockPosterior: number;
  referenciaTipo: string | null;
  referenciaId: string | null;
  motivo: string | null;
  usuario: { nombre: string };
  createdAt: string;
}

export default function InventarioPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [stocks, setStocks] = useState<Map<string, number>>(new Map());
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroProducto, setFiltroProducto] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("all");
  const [filtroDesde, setFiltroDesde] = useState("");
  const [filtroHasta, setFiltroHasta] = useState("");
  const [view, setView] = useState<"stock" | "kardex">("stock");
  const [showAjusteModal, setShowAjusteModal] = useState(false);
  const [submittingAjuste, setSubmittingAjuste] = useState(false);
  const [ajusteForm, setAjusteForm] = useState({ productoId: "", tipo: "AJUSTE_POSITIVO" as string, cantidad: "0", motivo: "" });
  const [toast, setToast] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  const showToast = (type: "ok" | "err", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchData = async () => {
    try {
      const [productosData, stocksData, movimientosData] = await Promise.all([
        apiClient.get<Producto[]>("/productos"),
        apiClient.get<StockEntry[]>("/movimientos/stock").catch(() => [] as StockEntry[]),
        apiClient.get<Movimiento[]>("/movimientos"),
      ]);
      setProductos(productosData);
      const stockMap = new Map<string, number>();
      for (const s of stocksData) stockMap.set(s.productoId, s.stock);
      setStocks(stockMap);
      setMovimientos(movimientosData);
    } catch (error) {
      console.error("Error fetching inventario:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case "ENTRADA":
      case "AJUSTE_POSITIVO":
        return "bg-green/15 text-green";
      case "SALIDA":
      case "AJUSTE_NEGATIVO":
        return "bg-red/15 text-red";
      case "VENTA":
        return "bg-blue/15 text-blue";
      default:
        return "bg-gray/15 text-gray";
    }
  };

  if (loading) return <div className="p-6 text-ink-muted">Cargando...</div>;

  const productosConStock = productos
    .filter((p) => p.estado === "ACTIVO")
    .map((p) => ({ ...p, stock: stocks.get(p.id) ?? 0 }))
    .sort((a, b) => a.stock - b.stock);

  const totalStock = productosConStock.reduce((sum, p) => sum + p.stock, 0);
  const productosConStockBajo = productosConStock.filter((p) => p.stock <= p.stockMinimo);
  const productosSinStock = productosConStock.filter((p) => p.stock === 0);

  return (
    <div className="mx-auto max-w-[1600px] space-y-5 p-4 sm:p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Inventario</h1>
          <p className="text-sm text-ink-muted">Stock actual y kardex de movimientos</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setView("stock")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${view === "stock" ? "bg-gold text-bg" : "border border-border text-ink hover:bg-raised"}`}
          >
            Stock actual
          </button>
          <button
            onClick={() => setView("kardex")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${view === "kardex" ? "bg-gold text-bg" : "border border-border text-ink hover:bg-raised"}`}
          >
            Kardex
          </button>
          <button
            onClick={() => { setAjusteForm({ productoId: "", tipo: "AJUSTE_POSITIVO", cantidad: "0", motivo: "" }); setShowAjusteModal(true); }}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-ink hover:bg-raised"
          >
            Ajustar stock
          </button>
        </div>
      </header>

      {view === "stock" && (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="card p-4 text-center">
              <p className="text-2xs font-semibold uppercase tracking-normal text-ink-faint">Total productos</p>
              <p className="font-display text-2xl font-bold mt-1">{productosConStock.length}</p>
            </div>
            <div className="card p-4 text-center">
              <p className="text-2xs font-semibold uppercase tracking-normal text-ink-faint">Unidades en stock</p>
              <p className="font-display text-2xl font-bold mt-1">{totalStock.toLocaleString()}</p>
            </div>
            <div className="card p-4 text-center" style={{ background: "rgba(224,120,86,0.12)", border: "1px solid rgba(224,120,86,0.28)" }}>
              <p className="text-2xs font-semibold uppercase tracking-normal text-ink-faint">Stock bajo</p>
              <p className="font-display text-2xl font-bold mt-1 text-red">{productosConStockBajo.length}</p>
            </div>
            <div className="card p-4 text-center" style={{ background: "rgba(155,138,201,0.12)", border: "1px solid rgba(155,138,201,0.28)" }}>
              <p className="text-2xs font-semibold uppercase tracking-normal text-ink-faint">Sin stock</p>
              <p className="font-display text-2xl font-bold mt-1 text-purple">{productosSinStock.length}</p>
            </div>
          </div>

          <div className="card overflow-x-auto p-5">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-4 py-3 text-2xs font-semibold uppercase tracking-normal text-ink-faint">Producto</th>
                  <th className="px-4 py-3 text-2xs font-semibold uppercase tracking-normal text-ink-faint">SKU</th>
                  <th className="px-4 py-3 text-2xs font-semibold uppercase tracking-normal text-ink-faint">Stock actual</th>
                  <th className="px-4 py-3 text-2xs font-semibold uppercase tracking-normal text-ink-faint">Stock mínimo</th>
                  <th className="px-4 py-3 text-2xs font-semibold uppercase tracking-normal text-ink-faint">Estado</th>
                </tr>
              </thead>
              <tbody>
                {productosConStock.map((p) => {
                  const isBajo = p.stock <= p.stockMinimo && p.stock > 0;
                  const isSinStock = p.stock === 0;
                  return (
                    <tr key={p.id} className="border-b border-border hover:bg-raised">
                      <td className="px-4 py-3 font-medium">{p.nombre}</td>
                      <td className="px-4 py-3 font-mono text-xs text-ink-muted">{p.sku}</td>
                      <td className={`px-4 py-3 tabular-nums font-semibold ${isSinStock ? "text-red" : isBajo ? "text-orange" : "text-green"}`}>
                        {p.stock}
                      </td>
                      <td className="px-4 py-3 text-ink-muted">{p.stockMinimo}</td>
                      <td className="px-4 py-3">
                        {isSinStock ? (
                          <span className="inline-flex rounded-pill px-2 py-0.5 text-2xs font-semibold bg-red/15 text-red">Sin stock</span>
                        ) : isBajo ? (
                          <span className="inline-flex rounded-pill px-2 py-0.5 text-2xs font-semibold bg-orange/15 text-orange">Stock bajo</span>
                        ) : (
                          <span className="inline-flex rounded-pill px-2 py-0.5 text-2xs font-semibold bg-green/15 text-green">Disponible</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {productosConStock.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-ink-muted">No hay productos activos</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {productosConStockBajo.length > 0 && (
            <div className="card p-5 border-red/30" style={{ background: "rgba(224,120,86,0.06)" }}>
              <h2 className="font-display text-lg font-bold mb-2 text-red">Alertas de stock bajo</h2>
              <p className="text-sm text-ink-muted mb-4">{productosConStockBajo.length} productos requieren reposición</p>
              <div className="space-y-2">
                {productosConStockBajo.map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-2xl border border-red/20 px-4 py-2.5" style={{ background: "rgb(var(--bg-rgb) / 0.5)" }}>
                    <div>
                      <span className="font-medium">{p.nombre}</span>
                      <span className="ml-2 text-xs text-ink-muted">{p.sku}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-red font-semibold">{p.stock}</span>
                      <span className="text-ink-muted ml-1">/ mín. {p.stockMinimo}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {toast && (
        <div className={`fixed top-5 right-5 z-[100] rounded-lg px-5 py-3 text-sm font-medium shadow-lg ${
          toast.type === "ok" ? "bg-green/15 text-green border border-green/30" : "bg-red/15 text-red border border-red/30"
        }`}>
          {toast.msg}
        </div>
      )}

      {showAjusteModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm sm:p-6" onClick={() => setShowAjusteModal(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-card border border-border-strong bg-surface shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h3 className="font-display text-lg font-bold">Ajustar stock</h3>
              <button onClick={() => setShowAjusteModal(false)} className="text-ink-muted hover:text-ink">✕</button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              setSubmittingAjuste(true);
              try {
                const cant = parseInt(ajusteForm.cantidad);
                if (cant <= 0) { showToast("err", "La cantidad debe ser mayor a 0"); setSubmittingAjuste(false); return; }
                await apiClient.post("/movimientos", {
                  productoId: ajusteForm.productoId,
                  tipo: ajusteForm.tipo,
                  cantidad: cant,
                  motivo: ajusteForm.motivo || undefined,
                  referenciaTipo: "AJUSTE",
                });
                showToast("ok", "Stock ajustado correctamente");
                setShowAjusteModal(false);
                fetchData();
              } catch (error) {
                const msg = error instanceof ApiError ? error.message : "Error al ajustar stock";
                showToast("err", msg);
              } finally {
                setSubmittingAjuste(false);
              }
            }} className="space-y-4 p-5">
              <div>
                <label className="text-2xs font-semibold uppercase tracking-normal text-ink-faint">Producto</label>
                <select className="inp mt-1.5" value={ajusteForm.productoId} onChange={(e) => setAjusteForm({ ...ajusteForm, productoId: e.target.value })} required>
                  <option value="">Seleccionar...</option>
                  {productos.filter(p => p.estado === "ACTIVO").map((p) => (
                    <option key={p.id} value={p.id}>{p.nombre} ({p.sku})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-2xs font-semibold uppercase tracking-normal text-ink-faint">Tipo</label>
                  <select className="inp mt-1.5" value={ajusteForm.tipo} onChange={(e) => setAjusteForm({ ...ajusteForm, tipo: e.target.value })}>
                    <option value="AJUSTE_POSITIVO">Entrada (ajuste +)</option>
                    <option value="AJUSTE_NEGATIVO">Salida (ajuste -)</option>
                  </select>
                </div>
                <div>
                  <label className="text-2xs font-semibold uppercase tracking-normal text-ink-faint">Cantidad</label>
                  <input type="number" className="inp mt-1.5" value={ajusteForm.cantidad} onChange={(e) => setAjusteForm({ ...ajusteForm, cantidad: e.target.value })} required min="1" />
                </div>
              </div>
              <div>
                <label className="text-2xs font-semibold uppercase tracking-normal text-ink-faint">Motivo</label>
                <input className="inp mt-1.5" value={ajusteForm.motivo} onChange={(e) => setAjusteForm({ ...ajusteForm, motivo: e.target.value })} placeholder="Ej: Ajuste por inventario físico" />
              </div>
              <div className="flex justify-end gap-2.5 pt-4">
                <button type="button" onClick={() => setShowAjusteModal(false)} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-ink hover:bg-raised">Cancelar</button>
                <button type="submit" disabled={submittingAjuste} className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-bg disabled:opacity-60">
                  {submittingAjuste ? "Guardando..." : "Guardar ajuste"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {view === "kardex" && (
        <div className="card p-5">
          <div className="mb-4 flex flex-wrap gap-4">
            <div className="min-w-[220px] flex-1">
              <label className="text-2xs font-semibold uppercase tracking-normal text-ink-faint">Producto</label>
              <input className="inp mt-1.5" placeholder="SKU o nombre" value={filtroProducto} onChange={(e) => setFiltroProducto(e.target.value)} />
            </div>
            <div>
              <label className="text-2xs font-semibold uppercase tracking-normal text-ink-faint">Tipo</label>
              <select className="inp mt-1.5" value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}>
                <option value="all">Todos</option>
                <option value="ENTRADA">Entrada</option>
                <option value="SALIDA">Salida</option>
                <option value="VENTA">Venta</option>
                <option value="AJUSTE_POSITIVO">Ajuste (+)</option>
                <option value="AJUSTE_NEGATIVO">Ajuste (-)</option>
              </select>
            </div>
            <div>
              <label className="text-2xs font-semibold uppercase tracking-normal text-ink-faint">Desde</label>
              <input type="date" className="inp mt-1.5" value={filtroDesde} onChange={(e) => setFiltroDesde(e.target.value)} />
            </div>
            <div>
              <label className="text-2xs font-semibold uppercase tracking-normal text-ink-faint">Hasta</label>
              <input type="date" className="inp mt-1.5" value={filtroHasta} onChange={(e) => setFiltroHasta(e.target.value)} />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-4 py-3 text-2xs font-semibold uppercase tracking-normal text-ink-faint">Fecha</th>
                  <th className="px-4 py-3 text-2xs font-semibold uppercase tracking-normal text-ink-faint">Producto</th>
                  <th className="px-4 py-3 text-2xs font-semibold uppercase tracking-normal text-ink-faint">Tipo</th>
                  <th className="px-4 py-3 text-2xs font-semibold uppercase tracking-normal text-ink-faint">Cantidad</th>
                  <th className="px-4 py-3 text-2xs font-semibold uppercase tracking-normal text-ink-faint">Costo unit.</th>
                  <th className="px-4 py-3 text-2xs font-semibold uppercase tracking-normal text-ink-faint">Antes</th>
                  <th className="px-4 py-3 text-2xs font-semibold uppercase tracking-normal text-ink-faint">Después</th>
                  <th className="px-4 py-3 text-2xs font-semibold uppercase tracking-normal text-ink-faint">Referencia</th>
                  <th className="px-4 py-3 text-2xs font-semibold uppercase tracking-normal text-ink-faint">Responsable</th>
                </tr>
              </thead>
              <tbody>
                {movimientos.map((mov) => (
                  <tr key={mov.id} className="border-b border-border hover:bg-raised">
                    <td className="px-4 py-3 text-xs text-ink-muted">{new Date(mov.createdAt).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{mov.producto.nombre}</div>
                      <div className="font-mono text-xs text-ink-muted">{mov.producto.sku}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-1 text-2xs font-semibold ${getTipoColor(mov.tipo)}`}>{mov.tipo.replace(/_/g, " ")}</span>
                    </td>
                    <td className="px-4 py-3 font-semibold tabular-nums">{mov.cantidad}</td>
                    <td className="px-4 py-3 tabular-nums text-ink-muted">{mov.costoUnitario != null ? `S/ ${Number(mov.costoUnitario).toFixed(2)}` : "—"}</td>
                    <td className="px-4 py-3 tabular-nums text-ink-muted">{mov.stockAnterior}</td>
                    <td className="px-4 py-3 tabular-nums">{mov.stockPosterior}</td>
                    <td className="px-4 py-3 text-xs text-ink-muted">
                      {mov.referenciaTipo ? `${mov.referenciaTipo} ${mov.referenciaId?.slice(0, 8) ?? ""}` : "Sin referencia"}
                    </td>
                    <td className="px-4 py-3 text-xs text-ink-muted">{mov.usuario.nombre}</td>
                  </tr>
                ))}
                {movimientos.length === 0 && (
                  <tr><td colSpan={9} className="px-4 py-8 text-center text-ink-muted">No hay movimientos registrados.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
