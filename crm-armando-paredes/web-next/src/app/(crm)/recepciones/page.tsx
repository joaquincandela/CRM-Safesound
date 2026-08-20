"use client";
import { useState, useEffect } from "react";
import { apiClient, ApiError } from "@/infrastructure/api/ApiClient";

interface OrdenCompra {
  id: string;
  numero: string;
  estado: string;
  proveedor: { razonSocial: string };
}

interface Producto {
  id: string;
  sku: string;
  nombre: string;
}

interface LineaRecepcion {
  productoId: string;
  cantidadRecibida: number;
}

interface Recepcion {
  id: string;
  ordenId: string;
  orden: OrdenCompra;
  fecha: string;
  usuario: { nombre: string };
  notas: string | null;
  createdAt: string;
  lineas: Array<{
    producto: Producto;
    cantidadRecibida: number;
  }>;
}

export default function RecepcionesPage() {
  const [recepciones, setRecepciones] = useState<Recepcion[]>([]);
  const [ordenesPendientes, setOrdenesPendientes] = useState<OrdenCompra[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "detail">("list");
  const [selectedRecepcion, setSelectedRecepcion] = useState<Recepcion | null>(null);
  const [toast, setToast] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  const [formData, setFormData] = useState({
    ordenId: "",
    lineas: [] as LineaRecepcion[],
    notas: "",
  });

  const [lineaForm, setLineaForm] = useState({
    productoId: "",
    cantidadRecibida: 1,
  });

  const [productosPorOrden, setProductosPorOrden] = useState<Producto[]>([]);

  const showToast = (type: "ok" | "err", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchRecepciones = async () => {
    try {
      const data = await apiClient.get<Recepcion[]>("/recepciones");
      setRecepciones(data);
    } catch (error) {
      console.error("Error fetching recepciones:", error instanceof ApiError ? error.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  const fetchOrdenesPendientes = async () => {
    try {
      const data = await apiClient.get<OrdenCompra[]>("/ordenes-compra");
      const ordenesRecibibles = data.filter((o) =>
        ["CONFIRMADA", "EN_FABRICACION", "EN_TRANSITO"].includes(o.estado)
      );
      setOrdenesPendientes(ordenesRecibibles);
    } catch (error) {
      console.error("Error fetching ordenes:", error instanceof ApiError ? error.message : "Error desconocido");
    }
  };

  const fetchProductosPorOrden = async (ordenId: string) => {
    try {
      const data = await apiClient.get<{ lineas: Array<{ producto: Producto }> }>(`/ordenes-compra/${ordenId}`);
      setProductosPorOrden(data.lineas.map((l) => l.producto));
    } catch (error) {
      console.error("Error fetching productos:", error instanceof ApiError ? error.message : "Error desconocido");
    }
  };

  useEffect(() => {
    fetchRecepciones();
    fetchOrdenesPendientes();
  }, []);

  const handleOrdenChange = (ordenId: string) => {
    setFormData({ ...formData, ordenId, lineas: [], notas: "" });
    setLineaForm({ productoId: "", cantidadRecibida: 1 });
    if (ordenId) {
      fetchProductosPorOrden(ordenId);
    } else {
      setProductosPorOrden([]);
    }
  };

  const addLinea = () => {
    if (!lineaForm.productoId || lineaForm.cantidadRecibida < 1) return;
    const producto = productosPorOrden.find(p => p.id === lineaForm.productoId);
    if (!producto) return;

    const nuevaLinea: LineaRecepcion = {
      productoId: lineaForm.productoId,
      cantidadRecibida: lineaForm.cantidadRecibida,
    };

    setFormData({
      ...formData,
      lineas: [...formData.lineas, nuevaLinea],
    });
    setLineaForm({ productoId: "", cantidadRecibida: 1 });
  };

  const removeLinea = (index: number) => {
    setFormData({
      ...formData,
      lineas: formData.lineas.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.lineas.length === 0) return alert("Agrega al menos una linea de recepcion");
    setSubmitting(true);

    try {
      await apiClient.post("/recepciones", formData);
      setShowModal(false);
      setFormData({ ordenId: "", lineas: [], notas: "" });
      setProductosPorOrden([]);
      fetchRecepciones();
      fetchOrdenesPendientes();
      showToast("ok", "Recepcion registrada correctamente");
    } catch (error) {
      const msg = error instanceof ApiError ? error.message : "Error de conexion al registrar recepcion";
      showToast("err", msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEliminar = async (recepcion: Recepcion) => {
    if (!confirm(`¿Eliminar la recepción de la orden ${recepcion.orden.numero}? Se revierte el stock registrado.`)) return;
    try {
      await apiClient.delete(`/recepciones/${recepcion.id}`);
      fetchRecepciones();
      fetchOrdenesPendientes();
      if (selectedRecepcion?.id === recepcion.id) {
        setViewMode("list");
        setSelectedRecepcion(null);
      }
      showToast("ok", "Recepción eliminada");
    } catch (error) {
      const msg = error instanceof ApiError ? error.message : "Error de conexión al eliminar";
      showToast("err", msg);
    }
  };

  if (loading) {
    return <div className="p-6 text-ink-muted">Cargando...</div>;
  }

  if (viewMode === "detail" && selectedRecepcion) {
    return (
      <div className="mx-auto max-w-[1600px] space-y-5 p-4 sm:p-6">
        <header className="flex items-center gap-4">
          <button
            onClick={() => { setViewMode("list"); setSelectedRecepcion(null); }}
            className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-raised"
          >
            ← Volver
          </button>
          <div>
            <h1 className="font-display text-2xl font-bold">Recepcion #{selectedRecepcion.id.slice(0, 8)}</h1>
            <p className="text-sm text-ink-muted">
              {new Date(selectedRecepcion.fecha).toLocaleString()} · Por {selectedRecepcion.usuario.nombre}
            </p>
          </div>
        </header>

        <div className="grid gap-5 lg:grid-cols-3">
          <div className="lg:col-span-2 card p-5">
            <h2 className="font-semibold mb-4">Productos Recibidos</h2>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-4 py-3 text-2xs font-semibold uppercase tracking-normal text-ink-faint">Producto</th>
                  <th className="px-4 py-3 text-2xs font-semibold uppercase tracking-normal text-ink-faint">Cantidad Recibida</th>
                </tr>
              </thead>
              <tbody>
                {selectedRecepcion.lineas.map((linea, i) => (
                  <tr key={i} className="border-b border-border">
                    <td className="px-4 py-3">
                      <div className="font-medium">{linea.producto.nombre}</div>
                      <div className="text-xs text-ink-muted font-mono">{linea.producto.sku}</div>
                    </td>
                    <td className="px-4 py-3 tabular-nums font-semibold">{linea.cantidadRecibida}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-5">
            <div className="card p-5">
              <h2 className="font-semibold mb-4">Orden de Compra</h2>
              <div className="font-medium">{selectedRecepcion.orden.numero}</div>
            </div>

            {selectedRecepcion.notas && (
              <div className="card p-5">
                <h2 className="font-semibold mb-4">Notas</h2>
                <p className="text-sm text-ink-muted">{selectedRecepcion.notas}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-5 p-4 sm:p-6">
      {toast && (
        <div
          className={`fixed top-4 right-4 z-[100] rounded-xl px-4 py-3 text-sm font-medium shadow-lg transition-all ${
            toast.type === "ok"
              ? "bg-green/20 text-green border border-green/30"
              : "bg-red/20 text-red border border-red/30"
          }`}
        >
          {toast.msg}
        </div>
      )}

      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Recepciones</h1>
          <p className="text-sm text-ink-muted">Registro de recepcion de mercaderia</p>
        </div>
        <button
          onClick={() => { setFormData({ ordenId: "", lineas: [], notas: "" }); setShowModal(true); }}
          className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-bg transition-transform hover:-translate-y-px"
        >
          Nueva Recepcion
        </button>
      </header>

      <div className="card overflow-x-auto p-5">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="px-4 py-3 text-2xs font-semibold uppercase tracking-normal text-ink-faint">ID</th>
              <th className="px-4 py-3 text-2xs font-semibold uppercase tracking-normal text-ink-faint">Orden</th>
              <th className="px-4 py-3 text-2xs font-semibold uppercase tracking-normal text-ink-faint">Fecha</th>
              <th className="px-4 py-3 text-2xs font-semibold uppercase tracking-normal text-ink-faint">Usuario</th>
              <th className="px-4 py-3 text-2xs font-semibold uppercase tracking-normal text-ink-faint">Notas</th>
              <th className="px-4 py-3 text-2xs font-semibold uppercase tracking-normal text-ink-faint">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {recepciones.map((recepcion) => (
              <tr key={recepcion.id} className="border-b border-border hover:bg-raised cursor-pointer" onClick={() => { setSelectedRecepcion(recepcion); setViewMode("detail"); }}>
                <td className="px-4 py-3 font-mono text-xs">{recepcion.id.slice(0, 8)}...</td>
                <td className="px-4 py-3 font-display font-bold">{recepcion.orden.numero}</td>
                <td className="px-4 py-3 text-xs text-ink-muted">{new Date(recepcion.fecha).toLocaleString()}</td>
                <td className="px-4 py-3 text-xs text-ink-muted">{recepcion.usuario.nombre}</td>
                <td className="px-4 py-3 text-xs text-ink-muted max-w-[150px] truncate">{recepcion.notas || "—"}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedRecepcion(recepcion); setViewMode("detail"); }}
                      className="rounded border border-border px-2 py-1 text-xs hover:bg-raised"
                    >
                      Ver detalle
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleEliminar(recepcion); }}
                      className="rounded border border-red px-2 py-1 text-xs text-red hover:bg-red/15"
                    >
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {recepciones.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-ink-muted">
                  No hay recepciones registradas
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm sm:p-6" onClick={() => setShowModal(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-card border border-border-strong bg-surface shadow-2xl max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h3 className="font-display text-lg font-bold">Nueva Recepcion</h3>
              <button onClick={() => setShowModal(false)} className="text-ink-muted hover:text-ink">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="text-2xs font-semibold uppercase tracking-normal text-ink-faint">Orden de Compra</label>
                <select
                  className="inp mt-1.5"
                  value={formData.ordenId}
                  onChange={(e) => handleOrdenChange(e.target.value)}
                  required
                >
                  <option value="">Seleccionar orden...</option>
                  {ordenesPendientes.map((o) => (
                    <option key={o.id} value={o.id}>{o.numero} - {o.proveedor.razonSocial}</option>
                  ))}
                </select>
              </div>

              {formData.ordenId && (
                <div className="border border-border rounded-lg p-4">
                  <h4 className="font-semibold mb-3">Agregar Linea</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2">
                      <label className="text-2xs font-semibold uppercase tracking-normal text-ink-faint">Producto</label>
                      <select
                        className="inp mt-1.5"
                        value={lineaForm.productoId}
                        onChange={(e) => setLineaForm({ ...lineaForm, productoId: e.target.value })}
                      >
                        <option value="">Seleccionar...</option>
                        {productosPorOrden.map((p) => (
                          <option key={p.id} value={p.id}>{p.sku} - {p.nombre}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-2xs font-semibold uppercase tracking-normal text-ink-faint">Cant. Recibida</label>
                      <input
                        type="number"
                        min="1"
                        className="inp mt-1.5"
                        value={lineaForm.cantidadRecibida}
                        onChange={(e) => setLineaForm({ ...lineaForm, cantidadRecibida: parseInt(e.target.value) || 1 })}
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={addLinea}
                    className="mt-3 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold hover:bg-raised"
                  >
                    + Agregar
                  </button>
                </div>
              )}

              {formData.lineas.length > 0 && (
                <div className="border border-border rounded-lg p-4">
                  <h4 className="font-semibold mb-3">Productos a Recibir</h4>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left">
                        <th className="pb-2 text-2xs font-semibold uppercase tracking-normal text-ink-faint">Producto</th>
                        <th className="pb-2 text-2xs font-semibold uppercase tracking-normal text-ink-faint">Cant. Recibida</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.lineas.map((linea, i) => {
                        const producto = productosPorOrden.find(p => p.id === linea.productoId);
                        return (
                          <tr key={i} className="border-b border-border">
                            <td className="py-2">{producto?.nombre || "—"}</td>
                            <td className="py-2 tabular-nums font-semibold">{linea.cantidadRecibida}</td>
                            <td className="py-2">
                              <button
                                type="button"
                                onClick={() => removeLinea(i)}
                                className="text-red hover:text-red/70"
                              >
                                ✕
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              <div>
                <label className="text-2xs font-semibold uppercase tracking-normal text-ink-faint">Notas</label>
                <textarea
                  className="inp mt-1.5"
                  value={formData.notas}
                  onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-ink hover:bg-raised">
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-bg transition-transform hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "Registrando..." : "Registrar Recepcion"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
