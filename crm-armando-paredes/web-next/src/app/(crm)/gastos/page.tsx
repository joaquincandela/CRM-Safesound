"use client";
import { useState, useEffect, useRef } from "react";
import { apiClient, ApiError } from "@/infrastructure/api/ApiClient";

interface Proveedor {
  id: string;
  razonSocial: string;
}

interface Gasto {
  id: string;
  categoria: string;
  descripcion: string;
  monto: number;
  moneda: string;
  fecha: string;
  proveedorId: string | null;
  proveedor: Proveedor | null;
  comprobanteTipo: string | null;
  comprobanteNumero: string | null;
  archivoUrl: string | null;
  createdAt: string;
}

export default function GastosPage() {
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: "ok" | "err"; msg: string } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Gasto | null>(null);
  const [formData, setFormData] = useState({
    categoria: "",
    descripcion: "",
    monto: "",
    moneda: "PEN",
    fecha: new Date().toISOString().split('T')[0],
    proveedorId: "",
    comprobanteTipo: "",
    comprobanteNumero: "",
    archivoUrl: "",
  });
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [filtroDesde, setFiltroDesde] = useState("");
  const [filtroHasta, setFiltroHasta] = useState("");
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (type: "ok" | "err", msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ type, msg });
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const fetchGastos = async () => {
    try {
      const params = new URLSearchParams();
      if (filtroCategoria) params.append("categoria", filtroCategoria);
      if (filtroDesde) params.append("desde", filtroDesde);
      if (filtroHasta) params.append("hasta", filtroHasta);
      const qs = params.toString();
      const data = await apiClient.get<Gasto[]>(`/gastos${qs ? `?${qs}` : ""}`);
      setGastos(data);
    } catch (error) {
      console.error("Error fetching gastos:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProveedores = async () => {
    try {
      const data = await apiClient.get<Proveedor[]>("/proveedores");
      setProveedores(data);
    } catch (error) {
      console.error("Error fetching proveedores:", error);
    }
  };

  useEffect(() => {
    fetchGastos();
    fetchProveedores();
  }, [filtroCategoria, filtroDesde, filtroHasta]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const body = {
        ...formData,
        monto: parseFloat(formData.monto),
        proveedorId: formData.proveedorId || null,
      };

      if (editing) {
        await apiClient.patch(`/gastos/${editing.id}`, body);
        showToast("ok", "Gasto actualizado correctamente");
      } else {
        await apiClient.post("/gastos", body);
        showToast("ok", "Gasto creado correctamente");
      }

      setShowModal(false);
      setEditing(null);
      setFormData({
        categoria: "",
        descripcion: "",
        monto: "",
        moneda: "PEN",
        fecha: new Date().toISOString().split('T')[0],
        proveedorId: "",
        comprobanteTipo: "",
        comprobanteNumero: "",
        archivoUrl: "",
      });
      fetchGastos();
    } catch (error) {
      const msg = error instanceof ApiError ? error.message : "Error de conexion al guardar el gasto";
      showToast("err", msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (gasto: Gasto) => {
    setEditing(gasto);
    setFormData({
      categoria: gasto.categoria,
      descripcion: gasto.descripcion,
      monto: String(gasto.monto),
      moneda: gasto.moneda,
      fecha: new Date(gasto.fecha).toISOString().split('T')[0],
      proveedorId: gasto.proveedorId || "",
      comprobanteTipo: gasto.comprobanteTipo || "",
      comprobanteNumero: gasto.comprobanteNumero || "",
      archivoUrl: gasto.archivoUrl || "",
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este gasto?")) return;
    try {
      await apiClient.delete(`/gastos/${id}`);
      showToast("ok", "Gasto eliminado correctamente");
      fetchGastos();
    } catch (error) {
      const msg = error instanceof ApiError ? error.message : "Error de conexion al eliminar el gasto";
      showToast("err", msg);
    }
  };

  const categoriasUnicas = [...new Set(gastos.map(g => g.categoria))].sort();

  if (loading) {
    return <div className="p-6 text-ink-muted">Cargando datos...</div>;
  }

  const totalGastos = gastos.reduce((sum, g) => sum + Number(g.monto), 0);

  return (
    <div className="mx-auto max-w-[1600px] space-y-5 p-4 sm:p-6">
      {toast && (
        <div
          className={`fixed top-5 right-5 z-[100] rounded-lg px-5 py-3 text-sm font-medium shadow-lg transition-opacity ${
            toast.type === "ok"
              ? "bg-green/15 text-green border border-green/30"
              : "bg-red/15 text-red border border-red/30"
          }`}
        >
          {toast.msg}
        </div>
      )}

      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Gastos</h1>
          <p className="text-sm text-ink-muted">Gestiona los gastos operativos</p>
        </div>
        <button
          onClick={() => { setEditing(null); setFormData({ categoria: "", descripcion: "", monto: "", moneda: "PEN", fecha: new Date().toISOString().split('T')[0], proveedorId: "", comprobanteTipo: "", comprobanteNumero: "", archivoUrl: "" }); setShowModal(true); }}
          className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-bg transition-transform hover:-translate-y-px"
        >
          Nuevo Gasto
        </button>
      </header>

      <div className="card p-5">
        <div className="flex flex-wrap gap-4 mb-4">
          <div>
            <label className="text-2xs font-semibold uppercase tracking-normal text-ink-faint">Categoría</label>
            <select
              className="inp mt-1.5"
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
            >
              <option value="">Todas</option>
              {categoriasUnicas.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-2xs font-semibold uppercase tracking-normal text-ink-faint">Desde</label>
            <input
              type="date"
              className="inp mt-1.5"
              value={filtroDesde}
              onChange={(e) => setFiltroDesde(e.target.value)}
            />
          </div>
          <div>
            <label className="text-2xs font-semibold uppercase tracking-normal text-ink-faint">Hasta</label>
            <input
              type="date"
              className="inp mt-1.5"
              value={filtroHasta}
              onChange={(e) => setFiltroHasta(e.target.value)}
            />
          </div>
        </div>

        <div className="mb-4 text-right">
          <span className="text-sm text-ink-muted">Total filtrado: </span>
          <span className="font-display text-xl font-bold">S/ {totalGastos.toFixed(2)}</span>
          <span className="text-2xs text-ink-muted ml-2">(incluye todas las monedas)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-4 py-3 text-2xs font-semibold uppercase tracking-normal text-ink-faint">Fecha</th>
                <th className="px-4 py-3 text-2xs font-semibold uppercase tracking-normal text-ink-faint">Categoría</th>
                <th className="px-4 py-3 text-2xs font-semibold uppercase tracking-normal text-ink-faint">Descripción</th>
                <th className="px-4 py-3 text-2xs font-semibold uppercase tracking-normal text-ink-faint">Monto</th>
                <th className="px-4 py-3 text-2xs font-semibold uppercase tracking-normal text-ink-faint">Proveedor</th>
                <th className="px-4 py-3 text-2xs font-semibold uppercase tracking-normal text-ink-faint">Comprobante</th>
                <th className="px-4 py-3 text-2xs font-semibold uppercase tracking-normal text-ink-faint">Archivo</th>
                <th className="px-4 py-3 text-2xs font-semibold uppercase tracking-normal text-ink-faint">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {gastos.map((gasto) => (
                <tr key={gasto.id} className="border-b border-border hover:bg-raised">
                  <td className="px-4 py-3 text-xs text-ink-muted">{new Date(gasto.fecha).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 rounded-pill px-2 py-0.5 text-2xs font-semibold bg-purple/15 text-purple">
                      {gasto.categoria}
                    </span>
                  </td>
                  <td className="px-4 py-3">{gasto.descripcion}</td>
                  <td className="px-4 py-3 tabular-nums font-semibold">{gasto.moneda === "USD" ? "$" : gasto.moneda === "EUR" ? "€" : "S/"} {Number(gasto.monto).toFixed(2)}</td>
                  <td className="px-4 py-3 text-ink-muted">{gasto.proveedor?.razonSocial || "—"}</td>
                  <td className="px-4 py-3 text-xs text-ink-muted">
                    {gasto.comprobanteTipo ? `${gasto.comprobanteTipo} - ${gasto.comprobanteNumero || "—"}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-muted">{gasto.archivoUrl ? <a href={gasto.archivoUrl} target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">Ver</a> : "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(gasto)}
                        className="rounded border border-border px-2 py-1 text-xs hover:bg-raised"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(gasto.id)}
                        className="rounded border border-red px-2 py-1 text-xs text-red hover:bg-red/15"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {gastos.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-ink-muted">
                    No hay gastos registrados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm sm:p-6" onClick={() => setShowModal(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-card border border-border-strong bg-surface shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h3 className="font-display text-lg font-bold">
                {editing ? "Editar" : "Nuevo"} Gasto
              </h3>
              <button onClick={() => setShowModal(false)} className="text-ink-muted hover:text-ink">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-2xs font-semibold uppercase tracking-normal text-ink-faint">Categoría</label>
                  <input
                    className="inp mt-1.5"
                    value={formData.categoria}
                    onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-2xs font-semibold uppercase tracking-normal text-ink-faint">Fecha</label>
                  <input
                    type="date"
                    className="inp mt-1.5"
                    value={formData.fecha}
                    onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="text-2xs font-semibold uppercase tracking-normal text-ink-faint">Descripción</label>
                <input
                  className="inp mt-1.5"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-2xs font-semibold uppercase tracking-normal text-ink-faint">Monto</label>
                  <input
                    type="number"
                    step="0.01"
                    className="inp mt-1.5"
                    value={formData.monto}
                    onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-2xs font-semibold uppercase tracking-normal text-ink-faint">Moneda</label>
                  <select
                    className="inp mt-1.5"
                    value={formData.moneda}
                    onChange={(e) => setFormData({ ...formData, moneda: e.target.value })}
                  >
                    <option value="PEN">PEN</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-2xs font-semibold uppercase tracking-normal text-ink-faint">Proveedor</label>
                <select
                  className="inp mt-1.5"
                  value={formData.proveedorId}
                  onChange={(e) => setFormData({ ...formData, proveedorId: e.target.value })}
                >
                  <option value="">Sin proveedor</option>
                  {proveedores.map((p) => (
                    <option key={p.id} value={p.id}>{p.razonSocial}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-2xs font-semibold uppercase tracking-normal text-ink-faint">Tipo Comprobante</label>
                  <select
                    className="inp mt-1.5"
                    value={formData.comprobanteTipo}
                    onChange={(e) => setFormData({ ...formData, comprobanteTipo: e.target.value })}
                  >
                    <option value="">Sin comprobante</option>
                    <option value="FACTURA">Factura</option>
                    <option value="BOLETA">Boleta</option>
                    <option value="RECIBO">Recibo</option>
                    <option value="TICKET">Ticket</option>
                    <option value="OTRO">Otro</option>
                  </select>
                </div>
                <div>
                  <label className="text-2xs font-semibold uppercase tracking-normal text-ink-faint">N° Comprobante</label>
                  <input
                    className="inp mt-1.5"
                    value={formData.comprobanteNumero}
                    onChange={(e) => setFormData({ ...formData, comprobanteNumero: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="text-2xs font-semibold uppercase tracking-normal text-ink-faint">URL Archivo</label>
                <input
                  className="inp mt-1.5"
                  value={formData.archivoUrl}
                  onChange={(e) => setFormData({ ...formData, archivoUrl: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-2.5 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-ink hover:bg-raised">
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-bg transition-transform hover:-translate-y-px disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                >
                  {submitting ? "Guardando..." : editing ? "Actualizar" : "Crear"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
