"use client";
import { useState, useEffect } from "react";
import { apiClient, ApiError } from "@/infrastructure/api/ApiClient";

interface Proveedor {
  id: string;
  razonSocial: string;
}

interface Producto {
  id: string;
  sku: string;
  nombre: string;
  costoUnitario: number;
}

interface LineaOrdenCompra {
  productoId: string;
  cantidad: number;
  costoUnitario: number;
  subtotal: number;
}

interface OrdenCompra {
  id: string;
  numero: string;
  proveedorId: string;
  proveedor: Proveedor;
  estado: string;
  moneda: string;
  subtotal: number;
  impuestos: number;
  total: number;
  fechaOrden: string;
  fechaEstimada: string | null;
  notas: string | null;
  createdAt: string;
  lineas: Array<{
    producto: Producto;
    cantidad: number;
    costoUnitario: number;
    subtotal: number;
  }>;
}

export default function OrdenesCompraPage() {
  const [ordenes, setOrdenes] = useState<OrdenCompra[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "detail">("list");
  const [selectedOrden, setSelectedOrden] = useState<OrdenCompra | null>(null);
  const [toast, setToast] = useState<{ type: "ok" | "err"; msg: string } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    proveedorId: "",
    estado: "BORRADOR",
    moneda: "USD",
    impuestos: "0",
    fechaEstimada: "",
    lineas: [] as LineaOrdenCompra[],
    notas: "",
  });

  const [lineaForm, setLineaForm] = useState({
    productoId: "",
    cantidad: 1,
    costoUnitario: "",
  });

  const fetchOrdenes = async () => {
    try {
      const data = await apiClient.get<OrdenCompra[]>("/ordenes-compra");
      setOrdenes(data);
    } catch (error) {
      console.error("Error fetching ordenes:", error instanceof ApiError ? error.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  const fetchProveedores = async () => {
    try {
      const data = await apiClient.get<Proveedor[]>("/proveedores");
      setProveedores(data);
    } catch (error) {
      console.error("Error fetching proveedores:", error instanceof ApiError ? error.message : "Error desconocido");
    }
  };

  const fetchProductos = async () => {
    try {
      const data = await apiClient.get<Producto[]>("/productos");
      setProductos(data);
    } catch (error) {
      console.error("Error fetching productos:", error instanceof ApiError ? error.message : "Error desconocido");
    }
  };

  useEffect(() => {
    fetchOrdenes();
    fetchProveedores();
    fetchProductos();
  }, []);

  const addLinea = () => {
    if (!lineaForm.productoId) {
      setFormError("Selecciona un producto de la lista antes de agregar la línea");
      return;
    }
    const producto = productos.find(p => p.id === lineaForm.productoId);
    if (!producto) {
      setFormError("El producto seleccionado ya no existe");
      return;
    }
    if (!lineaForm.cantidad || lineaForm.cantidad < 1) {
      setFormError("La cantidad debe ser al menos 1");
      return;
    }
    const costo = Number(lineaForm.costoUnitario);
    if (isNaN(costo) || costo < 0) {
      setFormError("Ingresa un costo unitario válido");
      return;
    }

    const subtotal = costo * lineaForm.cantidad;
    const nuevaLinea: LineaOrdenCompra = {
      productoId: lineaForm.productoId,
      cantidad: lineaForm.cantidad,
      costoUnitario: costo,
      subtotal,
    };

    setFormData({
      ...formData,
      lineas: [...formData.lineas, nuevaLinea],
    });
    setFormError(null);
    setLineaForm({ productoId: "", cantidad: 1, costoUnitario: "" });
  };

  const removeLinea = (index: number) => {
    setFormData({
      ...formData,
      lineas: formData.lineas.filter((_, i) => i !== index),
    });
  };

  const showToast = (type: "ok" | "err", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.proveedorId) {
      setFormError("Selecciona un proveedor");
      return;
    }
    if (formData.lineas.length === 0) {
      setFormError("Agrega al menos una línea a la orden (elige un producto y presiona 'Agregar línea')");
      return;
    }
    setSubmitting(true);

    try {
      await apiClient.post("/ordenes-compra", {
        proveedorId: formData.proveedorId,
        estado: formData.estado,
        moneda: formData.moneda,
        impuestos: parseFloat(formData.impuestos) || 0,
        fechaEstimada: formData.fechaEstimada || undefined,
        notas: formData.notas,
        lineas: formData.lineas.map(l => ({
          productoId: l.productoId,
          cantidad: l.cantidad,
          costoUnitario: l.costoUnitario,
        })),
      });

      setShowModal(false);
      setFormData({ proveedorId: "", estado: "BORRADOR", moneda: "USD", impuestos: "0", fechaEstimada: "", lineas: [], notas: "" });
      setFormError(null);
      fetchOrdenes();
      showToast("ok", "Orden de compra creada correctamente");
    } catch (error) {
      console.error("Error creating orden:", error instanceof ApiError ? error.message : "Error desconocido");
      setFormError(error instanceof ApiError ? error.message : "Error de conexión al crear la orden");
      showToast("err", error instanceof ApiError ? error.message : "Error de conexion al crear orden");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEstadoChange = async (ordenId: string, nuevoEstado: string) => {
    try {
      await apiClient.patch(`/ordenes-compra/${ordenId}`, { estado: nuevoEstado });
      fetchOrdenes();
      showToast("ok", "Estado actualizado");
    } catch (error) {
      console.error("Error updating estado:", error instanceof ApiError ? error.message : "Error desconocido");
      showToast("err", error instanceof ApiError ? error.message : "Error de conexion al actualizar estado");
    }
  };

  const handleEliminar = async (orden: OrdenCompra) => {
    if (!confirm(`¿Eliminar la orden ${orden.numero}? Si tiene recepciones, también se eliminarán (se revierte su stock).`)) return;
    try {
      await apiClient.delete(`/ordenes-compra/${orden.id}`);
      fetchOrdenes();
      if (selectedOrden?.id === orden.id) {
        setViewMode("list");
        setSelectedOrden(null);
      }
      showToast("ok", "Orden de compra eliminada");
    } catch (error) {
      console.error("Error deleting orden:", error instanceof ApiError ? error.message : "Error desconocido");
      showToast("err", error instanceof ApiError ? error.message : "Error de conexión al eliminar");
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "BORRADOR": return "bg-gray/15 text-gray";
      case "CONFIRMADA": return "bg-blue/15 text-blue";
      case "EN_FABRICACION": return "bg-yellow/15 text-yellow";
      case "EN_TRANSITO": return "bg-purple/15 text-purple";
      case "RECIBIDA": return "bg-green/15 text-green";
      case "CANCELADA": return "bg-red/15 text-red";
      default: return "bg-gray/15 text-gray";
    }
  };

  const totalOrden = formData.lineas.reduce((sum, l) => sum + l.subtotal, 0) + (parseFloat(formData.impuestos) || 0);

  const monedaSymbol = (m: string) => m === "USD" ? "$" : m === "EUR" ? "€" : "S/";

  if (loading) {
    return <div className="p-6">Cargando...</div>;
  }

  if (viewMode === "detail" && selectedOrden) {
    return (
      <div className="mx-auto max-w-[1600px] space-y-5 p-4 sm:p-6">
        <header className="flex items-center gap-4">
          <button
            onClick={() => { setViewMode("list"); setSelectedOrden(null); }}
            className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-raised"
          >
            ← Volver
          </button>
          <div>
            <h1 className="font-display text-2xl font-bold">Orden {selectedOrden.numero}</h1>
            <p className="text-sm text-ink-muted">
              {new Date(selectedOrden.fechaOrden).toLocaleDateString()}
            </p>
          </div>
        </header>

        <div className="grid gap-5 lg:grid-cols-3">
          <div className="lg:col-span-2 card p-5">
            <h2 className="font-semibold mb-4">Líneas de la Orden</h2>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-4 py-3 text-2xs font-semibold uppercase tracking-normal text-ink-faint">Producto</th>
                  <th className="px-4 py-3 text-2xs font-semibold uppercase tracking-normal text-ink-faint">Cant.</th>
                  <th className="px-4 py-3 text-2xs font-semibold uppercase tracking-normal text-ink-faint">Costo Unit.</th>
                  <th className="px-4 py-3 text-2xs font-semibold uppercase tracking-normal text-ink-faint">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {selectedOrden.lineas.map((linea, i) => (
                  <tr key={i} className="border-b border-border">
                    <td className="px-4 py-3">
                      <div className="font-medium">{linea.producto.nombre}</div>
                      <div className="text-xs text-ink-muted font-mono">{linea.producto.sku}</div>
                    </td>
                    <td className="px-4 py-3 tabular-nums">{linea.cantidad}</td>
                    <td className="px-4 py-3 tabular-nums">S/ {Number(linea.costoUnitario).toFixed(2)}</td>
                    <td className="px-4 py-3 tabular-nums font-semibold">S/ {Number(linea.subtotal).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-4 flex justify-end">
              <div className="text-right space-y-1">
                <div className="text-sm text-ink-muted">Subtotal: {monedaSymbol(selectedOrden.moneda)} {Number(selectedOrden.subtotal ?? 0).toFixed(2)}</div>
                {(selectedOrden.impuestos ?? 0) > 0 && <div className="text-sm text-ink-muted">Impuestos: + {monedaSymbol(selectedOrden.moneda)} {Number(selectedOrden.impuestos).toFixed(2)}</div>}
                <div className="font-display text-2xl font-bold">Total: {monedaSymbol(selectedOrden.moneda)} {parseFloat(String(selectedOrden.total)).toFixed(2)}</div>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="card p-5">
              <h2 className="font-semibold mb-4">Proveedor</h2>
              <div className="font-medium">{selectedOrden.proveedor.razonSocial}</div>
            </div>

            <div className="card p-5">
              <h2 className="font-semibold mb-4">Estado</h2>
              <select
                className="inp"
                value={selectedOrden.estado}
                onChange={(e) => handleEstadoChange(selectedOrden.id, e.target.value)}
              >
                <option value="BORRADOR">Borrador</option>
                <option value="CONFIRMADA">Confirmada</option>
                <option value="EN_FABRICACION">En fabricacion</option>
                <option value="EN_TRANSITO">En transito</option>
                <option value="RECIBIDA">Recibida</option>
                <option value="CANCELADA">Cancelada</option>
              </select>
            </div>

            {selectedOrden.fechaEstimada && (
              <div className="card p-5">
                <h2 className="font-semibold mb-4">Fecha estimada</h2>
                <p className="text-sm text-ink-muted">{new Date(selectedOrden.fechaEstimada).toLocaleDateString()}</p>
              </div>
            )}

            {selectedOrden.notas && (
              <div className="card p-5">
                <h2 className="font-semibold mb-4">Notas</h2>
                <p className="text-sm text-ink-muted">{selectedOrden.notas}</p>
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
          <h1 className="font-display text-2xl font-bold">Órdenes de Compra</h1>
          <p className="text-sm text-ink-muted">Gestiona las órdenes de compra a proveedores</p>
        </div>
        <button
          onClick={() => { setFormData({ proveedorId: "", estado: "BORRADOR", moneda: "USD", impuestos: "0", fechaEstimada: "", lineas: [], notas: "" }); setFormError(null); setShowModal(true); }}
          className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-bg transition-transform hover:-translate-y-px"
        >
          Nueva Orden
        </button>
      </header>

      <div className="card overflow-x-auto p-5">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="px-4 py-3 text-2xs font-semibold uppercase tracking-normal text-ink-faint">Número</th>
              <th className="px-4 py-3 text-2xs font-semibold uppercase tracking-normal text-ink-faint">Proveedor</th>
              <th className="px-4 py-3 text-2xs font-semibold uppercase tracking-normal text-ink-faint">Fecha</th>
              <th className="px-4 py-3 text-2xs font-semibold uppercase tracking-normal text-ink-faint">Moneda</th>
              <th className="px-4 py-3 text-2xs font-semibold uppercase tracking-normal text-ink-faint">Total</th>
              <th className="px-4 py-3 text-2xs font-semibold uppercase tracking-normal text-ink-faint">Estado</th>
              <th className="px-4 py-3 text-2xs font-semibold uppercase tracking-normal text-ink-faint">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {ordenes.map((orden) => (
              <tr key={orden.id} className="border-b border-border hover:bg-raised cursor-pointer" onClick={() => { setSelectedOrden(orden); setViewMode("detail"); }}>
                <td className="px-4 py-3 font-display font-bold">{orden.numero}</td>
                <td className="px-4 py-3">{orden.proveedor.razonSocial}</td>
                <td className="px-4 py-3 text-xs text-ink-muted">{new Date(orden.fechaOrden).toLocaleDateString()}</td>
                <td className="px-4 py-3 tabular-nums text-xs text-ink-muted">{orden.moneda}</td>
                <td className="px-4 py-3 tabular-nums font-semibold">{monedaSymbol(orden.moneda)} {parseFloat(String(orden.total)).toFixed(2)}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1.5 rounded-pill px-2 py-0.5 text-2xs font-semibold ${getEstadoColor(orden.estado)}`}>
                    {orden.estado.replace(/_/g, " ")}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedOrden(orden); setViewMode("detail"); }}
                      className="rounded border border-border px-2 py-1 text-xs hover:bg-raised"
                    >
                      Ver detalle
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleEliminar(orden); }}
                      className="rounded border border-red px-2 py-1 text-xs text-red hover:bg-red/15"
                    >
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {ordenes.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-ink-muted">
                  No hay órdenes de compra registradas
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm sm:p-6" onClick={() => setShowModal(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-card border border-border-strong bg-surface shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h3 className="font-display text-lg font-bold">Nueva Orden de Compra</h3>
              <button onClick={() => setShowModal(false)} className="text-ink-muted hover:text-ink">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {proveedores.length === 0 && (
                <div className="rounded-lg border border-red/30 bg-red/10 px-3 py-2 text-xs text-red">
                  No hay proveedores registrados. Crea un proveedor primero para poder generar órdenes de compra.
                </div>
              )}
              {productos.length === 0 && (
                <div className="rounded-lg border border-red/30 bg-red/10 px-3 py-2 text-xs text-red">
                  No hay productos registrados. Crea productos primero para poder agregar líneas a la orden.
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-2xs font-semibold uppercase tracking-normal text-ink-faint">Proveedor</label>
                  <select
                    className="inp mt-1.5"
                    value={formData.proveedorId}
                    onChange={(e) => setFormData({ ...formData, proveedorId: e.target.value })}
                    required
                  >
                    <option value="">Seleccionar proveedor...</option>
                    {proveedores.map((p) => (
                      <option key={p.id} value={p.id}>{p.razonSocial}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-2xs font-semibold uppercase tracking-normal text-ink-faint">Moneda</label>
                  <select
                    className="inp mt-1.5"
                    value={formData.moneda}
                    onChange={(e) => setFormData({ ...formData, moneda: e.target.value })}
                  >
                    <option value="USD">USD</option>
                    <option value="PEN">PEN</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
              </div>

              <div className="border border-border rounded-lg p-4">
                <h4 className="font-semibold mb-1">Agregar Línea</h4>
                <p className="mb-3 text-xs text-ink-muted">Elige el producto y presiona el botón para añadirlo a la orden.</p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                  <div className="sm:col-span-2">
                    <label className="text-2xs font-semibold uppercase tracking-normal text-ink-faint">Producto</label>
                    <select
                      className="inp mt-1.5"
                      value={lineaForm.productoId}
                      onChange={(e) => {
                        const prod = productos.find(p => p.id === e.target.value);
                        setLineaForm({
                          ...lineaForm,
                          productoId: e.target.value,
                          costoUnitario: prod ? String(prod.costoUnitario) : "",
                        });
                      }}
                    >
                      <option value="">Seleccionar...</option>
                      {productos.map((p) => (
                        <option key={p.id} value={p.id}>{p.sku} - {p.nombre} (S/ {p.costoUnitario})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-2xs font-semibold uppercase tracking-normal text-ink-faint">Cantidad</label>
                    <input
                      type="number"
                      min="1"
                      className="inp mt-1.5"
                      value={lineaForm.cantidad}
                      onChange={(e) => setLineaForm({ ...lineaForm, cantidad: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                  <div>
                    <label className="text-2xs font-semibold uppercase tracking-normal text-ink-faint">Costo Unit. ({monedaSymbol(formData.moneda)})</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="inp mt-1.5"
                      value={lineaForm.costoUnitario}
                      onChange={(e) => setLineaForm({ ...lineaForm, costoUnitario: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={addLinea}
                  className="mt-3 rounded-lg bg-gold px-4 py-2 text-xs font-semibold text-bg transition-transform hover:-translate-y-px"
                >
                  + Agregar línea a la orden
                </button>
                <div className="mt-2 text-xs text-ink-muted">
                  Subtotal de la línea:{" "}
                  <span className="font-semibold text-ink">
                    {monedaSymbol(formData.moneda)}{" "}
                    {((Number(lineaForm.costoUnitario) || 0) * lineaForm.cantidad).toFixed(2)}
                  </span>
                </div>
              </div>

              {formError && (
                <div className="rounded-lg border border-red/30 bg-red/10 px-3 py-2 text-xs text-red">
                  {formError}
                </div>
              )}

              <div className="border border-border rounded-lg p-4">
                  <h4 className="font-semibold mb-3">Líneas de la Orden ({formData.lineas.length})</h4>
                  {formData.lineas.length === 0 ? (
                    <p className="text-xs text-ink-muted">Aún no hay líneas. Agrega al menos un producto para continuar.</p>
                  ) : (
                  <>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left">
                        <th className="pb-2 text-2xs font-semibold uppercase tracking-normal text-ink-faint">Producto</th>
                        <th className="pb-2 text-2xs font-semibold uppercase tracking-normal text-ink-faint">Cant.</th>
                        <th className="pb-2 text-2xs font-semibold uppercase tracking-normal text-ink-faint">Costo</th>
                        <th className="pb-2 text-2xs font-semibold uppercase tracking-normal text-ink-faint">Subtotal</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.lineas.map((linea, i) => {
                        const producto = productos.find(p => p.id === linea.productoId);
                        return (
                          <tr key={i} className="border-b border-border">
                            <td className="py-2">{producto?.nombre || "—"}</td>
                            <td className="py-2 tabular-nums">{linea.cantidad}</td>
                            <td className="py-2 tabular-nums">{monedaSymbol(formData.moneda)} {Number(linea.costoUnitario).toFixed(2)}</td>
                            <td className="py-2 tabular-nums font-semibold">{monedaSymbol(formData.moneda)} {Number(linea.subtotal).toFixed(2)}</td>
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
                  <div className="mt-3 flex justify-end font-display text-lg font-bold">
                    Total: {monedaSymbol(formData.moneda)} {totalOrden.toFixed(2)}
                  </div>
                  </>
                  )}
                </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-2xs font-semibold uppercase tracking-normal text-ink-faint">Estado</label>
                  <select
                    className="inp mt-1.5"
                    value={formData.estado}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                  >
                    <option value="BORRADOR">Borrador</option>
                    <option value="CONFIRMADA">Confirmada</option>
                    <option value="EN_FABRICACION">En fabricación</option>
                    <option value="EN_TRANSITO">En tránsito</option>
                    <option value="RECIBIDA">Recibida</option>
                    <option value="CANCELADA">Cancelada</option>
                  </select>
                </div>
                <div>
                  <label className="text-2xs font-semibold uppercase tracking-normal text-ink-faint">Impuestos</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="inp mt-1.5"
                    value={formData.impuestos}
                    onChange={(e) => setFormData({ ...formData, impuestos: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-2xs font-semibold uppercase tracking-normal text-ink-faint">Fecha estimada de llegada</label>
                <input
                  type="date"
                  className="inp mt-1.5"
                  value={formData.fechaEstimada}
                  onChange={(e) => setFormData({ ...formData, fechaEstimada: e.target.value })}
                />
              </div>

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
                  {submitting ? "Creando..." : "Crear Orden"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
