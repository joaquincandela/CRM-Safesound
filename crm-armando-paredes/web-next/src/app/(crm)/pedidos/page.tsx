"use client";
import { useState, useEffect } from "react";
import { apiClient, ApiError } from "@/infrastructure/api/ApiClient";

interface Producto {
  id: string;
  sku: string;
  nombre: string;
  precioVenta: number;
}

interface LineaPedido {
  productoId: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

interface Pedido {
  id: string;
  numero: string;
  estado: string;
  subtotal: number;
  descuento: number;
  igv: number;
  total: number;
  notas: string | null;
  createdAt: string;
  cliente: { nombre: string } | null;
  clienteNombre: string | null;
  clienteTelefono: string | null;
  clienteEmail: string | null;
  clienteDocumento: string | null;
  clienteDireccion: string | null;
  lineas: Array<{
    producto: Producto;
    cantidad: number;
    precioUnitario: number;
    subtotal: number;
  }>;
}

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "detail">("list");
  const [selectedPedido, setSelectedPedido] = useState<Pedido | null>(null);
  const [toast, setToast] = useState<{ type: "ok" | "err"; msg: string } | null>(null);
  
  const [formData, setFormData] = useState({
    clienteNombre: "",
    clienteTelefono: "",
    clienteEmail: "",
    clienteDocumento: "",
    clienteDireccion: "",
    estado: "PENDIENTE",
    descuento: "0",
    igv: "0",
    lineas: [] as LineaPedido[],
    notas: "",
  });

  const [lineaForm, setLineaForm] = useState({
    productoId: "",
    cantidad: 1,
  });

  const fetchPedidos = async (filtro?: string | null) => {
    try {
      const path = filtro ? `/pedidos?buscar=${encodeURIComponent(filtro)}` : "/pedidos";
      const data = await apiClient.get<Pedido[]>(path);
      setPedidos(data);
    } catch (error) {
      console.error("Error fetching pedidos:", error instanceof ApiError ? error.message : "Error desconocido");
    } finally {
      setLoading(false);
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
    const params = new URLSearchParams(window.location.search);
    const qParam = params.get("q");
    const qVal = qParam && qParam.trim() ? qParam.trim() : null;
    setQ(qVal);
    fetchPedidos(qVal);
    fetchProductos();
  }, []);

  const addLinea = () => {
    if (!lineaForm.productoId || lineaForm.cantidad < 1) return;
    const producto = productos.find(p => p.id === lineaForm.productoId);
    if (!producto) return;

    const precio = Number(producto.precioVenta) || 0;
    const subtotal = precio * lineaForm.cantidad;
    const nuevaLinea: LineaPedido = {
      productoId: lineaForm.productoId,
      cantidad: lineaForm.cantidad,
      precioUnitario: precio,
      subtotal,
    };

    setFormData({
      ...formData,
      lineas: [...formData.lineas, nuevaLinea],
    });
    setLineaForm({ productoId: "", cantidad: 1 });
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
    setSubmitting(true);

    if (formData.lineas.length === 0) {
      setSubmitting(false);
      showToast("err", "Agrega al menos un producto con su cantidad antes de crear el pedido");
      return;
    }

    try {
      await apiClient.post("/pedidos", {
        clienteNombre: formData.clienteNombre,
        clienteTelefono: formData.clienteTelefono,
        clienteEmail: formData.clienteEmail,
        clienteDocumento: formData.clienteDocumento,
        clienteDireccion: formData.clienteDireccion,
        estado: formData.estado,
        descuento: parseFloat(formData.descuento) || 0,
        igv: parseFloat(formData.igv) || 0,
        notas: formData.notas,
        lineas: formData.lineas.map(l => ({
          productoId: l.productoId,
          cantidad: l.cantidad,
        })),
      });

      setShowModal(false);
      setFormData({ clienteNombre: "", clienteTelefono: "", clienteEmail: "", clienteDocumento: "", clienteDireccion: "", estado: "PENDIENTE", descuento: "0", igv: "0", lineas: [], notas: "" });
      fetchPedidos(q);
      showToast("ok", "Pedido creado correctamente");
    } catch (error) {
      console.error("Error creating pedido:", error);
      showToast("err", error instanceof ApiError ? error.message : "Error de conexion al crear pedido");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEstadoChange = async (pedidoId: string, nuevoEstado: string) => {
    try {
      const actualizado = await apiClient.patch<Pedido>(`/pedidos/${pedidoId}`, { estado: nuevoEstado });
      setPedidos((prev) => prev.map((p) => (p.id === pedidoId ? actualizado : p)));
      if (selectedPedido?.id === pedidoId) setSelectedPedido(actualizado);
      showToast(
        "ok",
        nuevoEstado === "COMPLETO"
          ? "Pedido completado: stock descontado e ingreso registrado"
          : nuevoEstado === "PAGADO"
            ? "Pago registrado: stock descontado e ingreso registrado"
            : "Estado actualizado",
      );
    } catch (error) {
      console.error("Error updating estado:", error);
      showToast("err", error instanceof ApiError ? error.message : "Error de conexion al actualizar estado");
      fetchPedidos(q);
    }
  };

  const handleEliminar = async (pedido: Pedido) => {
    if (!confirm(`¿Eliminar el pedido ${pedido.numero}? Se restaurará el stock si consumió inventario.`)) return;
    try {
      await apiClient.delete(`/pedidos/${pedido.id}`);
      fetchPedidos(q);
      if (selectedPedido?.id === pedido.id) {
        setViewMode("list");
        setSelectedPedido(null);
      }
      showToast("ok", "Pedido eliminado");
    } catch (error) {
      console.error("Error deleting pedido:", error);
      showToast("err", error instanceof ApiError ? error.message : "Error de conexión al eliminar");
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "PENDIENTE": return "bg-yellow/15 text-yellow";
      case "PAGADO": return "bg-green/15 text-green";
      case "PREPARANDO": return "bg-blue/15 text-blue";
      case "ENVIADO": return "bg-purple/15 text-purple";
      case "ENTREGADO": return "bg-green/15 text-green";
      case "COMPLETO": return "bg-green/15 text-green";
      case "CANCELADO": return "bg-red/15 text-red";
      default: return "bg-gray/15 text-gray";
    }
  };

  const subtotalPedido = formData.lineas.reduce((sum, l) => sum + l.subtotal, 0);
  const totalPedido = subtotalPedido - (parseFloat(formData.descuento) || 0) + (parseFloat(formData.igv) || 0);

  if (loading) {
    return <div className="p-6">Cargando...</div>;
  }

  if (viewMode === "detail" && selectedPedido) {
    return (
      <div className="mx-auto max-w-[1600px] space-y-5 p-4 sm:p-6">
        <header className="flex items-center gap-4">
          <button
            onClick={() => { setViewMode("list"); setSelectedPedido(null); }}
            className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-raised"
          >
            ← Volver
          </button>
          <div>
            <h1 className="font-display text-2xl font-bold">Pedido {selectedPedido.numero}</h1>
            <p className="text-sm text-ink-muted">
              {new Date(selectedPedido.createdAt).toLocaleString()}
            </p>
          </div>
        </header>

        <div className="grid gap-5 lg:grid-cols-3">
          <div className="lg:col-span-2 card p-5">
            <h2 className="font-semibold mb-4">Líneas del Pedido</h2>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-4 py-3 text-2xs font-semibold uppercase tracking-normal text-ink-faint">Producto</th>
                  <th className="px-4 py-3 text-2xs font-semibold uppercase tracking-normal text-ink-faint">Cant.</th>
                  <th className="px-4 py-3 text-2xs font-semibold uppercase tracking-normal text-ink-faint">Precio Unit.</th>
                  <th className="px-4 py-3 text-2xs font-semibold uppercase tracking-normal text-ink-faint">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {selectedPedido.lineas.map((linea, i) => (
                  <tr key={i} className="border-b border-border">
                    <td className="px-4 py-3">
                      <div className="font-medium">{linea.producto.nombre}</div>
                      <div className="text-xs text-ink-muted font-mono">{linea.producto.sku}</div>
                    </td>
                    <td className="px-4 py-3 tabular-nums">{linea.cantidad}</td>
                    <td className="px-4 py-3 tabular-nums">S/ {Number(linea.precioUnitario).toFixed(2)}</td>
                    <td className="px-4 py-3 tabular-nums font-semibold">S/ {Number(linea.subtotal).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-4 flex justify-end">
              <div className="text-right space-y-1">
                <div className="text-sm text-ink-muted">Subtotal: S/ {Number(selectedPedido.subtotal ?? 0).toFixed(2)}</div>
                {(selectedPedido.descuento ?? 0) > 0 && <div className="text-sm text-red">Descuento: - S/ {Number(selectedPedido.descuento).toFixed(2)}</div>}
                {(selectedPedido.igv ?? 0) > 0 && <div className="text-sm text-ink-muted">IGV: + S/ {Number(selectedPedido.igv).toFixed(2)}</div>}
                <div className="font-display text-2xl font-bold">Total: S/ {Number(selectedPedido.total).toFixed(2)}</div>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="card p-5">
              <h2 className="font-semibold mb-4">Cliente</h2>
              <div className="font-medium">{selectedPedido.clienteNombre || selectedPedido.cliente?.nombre || "—"}</div>
              {selectedPedido.clienteTelefono && <div className="text-sm text-ink-muted mt-1">Tel: {selectedPedido.clienteTelefono}</div>}
              {selectedPedido.clienteEmail && <div className="text-sm text-ink-muted">Email: {selectedPedido.clienteEmail}</div>}
              {selectedPedido.clienteDocumento && <div className="text-sm text-ink-muted">Doc: {selectedPedido.clienteDocumento}</div>}
              {selectedPedido.clienteDireccion && <div className="text-sm text-ink-muted">Dir: {selectedPedido.clienteDireccion}</div>}
            </div>

            <div className="card p-5">
              <h2 className="font-semibold mb-4">Estado</h2>
              <select
                className="inp"
                value={selectedPedido.estado}
                onChange={(e) => handleEstadoChange(selectedPedido.id, e.target.value)}
              >
                <option value="PENDIENTE">Pendiente</option>
                <option value="PAGADO">Pagado</option>
                <option value="PREPARANDO">En preparacion</option>
                <option value="ENVIADO">Enviado</option>
                <option value="ENTREGADO">Entregado</option>
                <option value="COMPLETO">Completado</option>
              </select>
            </div>

            {selectedPedido.notas && (
              <div className="card p-5">
                <h2 className="font-semibold mb-4">Notas</h2>
                <p className="text-sm text-ink-muted">{selectedPedido.notas}</p>
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
          <h1 className="font-display text-2xl font-bold">Pedidos</h1>
          <p className="text-sm text-ink-muted">Gestiona los pedidos de venta</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {q && (
            <span
              className="flex items-center gap-2 rounded-pill px-3 py-1.5 text-xs font-semibold"
              style={{ background: "rgb(var(--gold-rgb) / 0.15)", color: "rgb(var(--gold-rgb))" }}
            >
              Filtro: «{q}»
              <button
                onClick={() => {
                  setQ(null);
                  history.replaceState({}, "", "/pedidos");
                  fetchPedidos(null);
                }}
                className="hover:text-ink"
                aria-label="Quitar filtro"
              >
                ✕
              </button>
            </span>
          )}
          <button
            onClick={() => { setFormData({ clienteNombre: "", clienteTelefono: "", clienteEmail: "", clienteDocumento: "", clienteDireccion: "", estado: "PENDIENTE", descuento: "0", igv: "0", lineas: [], notas: "" }); setShowModal(true); }}
            className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-bg transition-transform hover:-translate-y-px"
          >
            Nuevo Pedido
          </button>
        </div>
      </header>

      <div className="card overflow-x-auto p-5">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="px-4 py-3 text-2xs font-semibold uppercase tracking-normal text-ink-faint">Número</th>
              <th className="px-4 py-3 text-2xs font-semibold uppercase tracking-normal text-ink-faint">Cliente</th>
              <th className="px-4 py-3 text-2xs font-semibold uppercase tracking-normal text-ink-faint">Fecha</th>
              <th className="px-4 py-3 text-2xs font-semibold uppercase tracking-normal text-ink-faint">Total</th>
              <th className="px-4 py-3 text-2xs font-semibold uppercase tracking-normal text-ink-faint">Estado</th>
              <th className="px-4 py-3 text-2xs font-semibold uppercase tracking-normal text-ink-faint">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {pedidos.map((pedido) => (
              <tr key={pedido.id} className="border-b border-border hover:bg-raised cursor-pointer" onClick={() => { setSelectedPedido(pedido); setViewMode("detail"); }}>
                <td className="px-4 py-3 font-display font-bold">{pedido.numero}</td>
                <td className="px-4 py-3">{pedido.clienteNombre || pedido.cliente?.nombre || "—"}</td>
                <td className="px-4 py-3 text-xs text-ink-muted">{new Date(pedido.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3 tabular-nums font-semibold">S/ {Number(pedido.total).toFixed(2)}</td>
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <select
                    className={`cursor-pointer rounded-pill border-none px-2 py-1 text-2xs font-semibold focus:outline-none ${getEstadoColor(pedido.estado)}`}
                    value={pedido.estado}
                    onChange={(e) => handleEstadoChange(pedido.id, e.target.value)}
                    aria-label={`Estado del pedido ${pedido.numero}`}
                  >
                    <option value="PENDIENTE">Pendiente</option>
                    <option value="PAGADO">Pagado</option>
                    <option value="PREPARANDO">En preparacion</option>
                    <option value="ENVIADO">Enviado</option>
                    <option value="ENTREGADO">Entregado</option>
                    <option value="COMPLETO">Completado</option>
                    {pedido.estado === "CANCELADO" && <option value="CANCELADO">Cancelado</option>}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedPedido(pedido); setViewMode("detail"); }}
                      className="rounded border border-border px-2 py-1 text-xs hover:bg-raised"
                    >
                      Ver detalle
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleEliminar(pedido); }}
                      className="rounded border border-red px-2 py-1 text-xs text-red hover:bg-red/15"
                    >
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {pedidos.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-ink-muted">
                  No hay pedidos registrados
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
              <h3 className="font-display text-lg font-bold">Nuevo Pedido</h3>
              <button onClick={() => setShowModal(false)} className="text-ink-muted hover:text-ink">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="text-2xs font-semibold uppercase tracking-normal text-ink-faint">Nombre del cliente</label>
                <input
                  type="text"
                  className="inp mt-1.5"
                  value={formData.clienteNombre}
                  onChange={(e) => setFormData({ ...formData, clienteNombre: e.target.value })}
                  placeholder="Ej: Jorge Mackensi"
                  required
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-2xs font-semibold uppercase tracking-normal text-ink-faint">Teléfono <span className="normal-case opacity-70">(opcional)</span></label>
                  <input
                    type="tel"
                    className="inp mt-1.5"
                    value={formData.clienteTelefono}
                    onChange={(e) => setFormData({ ...formData, clienteTelefono: e.target.value })}
                    placeholder="999 888 777"
                  />
                </div>
                <div>
                  <label className="text-2xs font-semibold uppercase tracking-normal text-ink-faint">Email <span className="normal-case opacity-70">(opcional)</span></label>
                  <input
                    type="email"
                    className="inp mt-1.5"
                    value={formData.clienteEmail}
                    onChange={(e) => setFormData({ ...formData, clienteEmail: e.target.value })}
                    placeholder="cliente@correo.com"
                  />
                </div>
                <div>
                  <label className="text-2xs font-semibold uppercase tracking-normal text-ink-faint">Documento <span className="normal-case opacity-70">(opcional)</span></label>
                  <input
                    type="text"
                    className="inp mt-1.5"
                    value={formData.clienteDocumento}
                    onChange={(e) => setFormData({ ...formData, clienteDocumento: e.target.value })}
                    placeholder="DNI / RUC"
                  />
                </div>
                <div>
                  <label className="text-2xs font-semibold uppercase tracking-normal text-ink-faint">Dirección <span className="normal-case opacity-70">(opcional)</span></label>
                  <input
                    type="text"
                    className="inp mt-1.5"
                    value={formData.clienteDireccion}
                    onChange={(e) => setFormData({ ...formData, clienteDireccion: e.target.value })}
                    placeholder="Dirección de entrega"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="text-2xs font-semibold uppercase tracking-normal text-ink-faint">Estado</label>
                  <select
                    className="inp mt-1.5"
                    value={formData.estado}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                  >
                    <option value="PENDIENTE">Pendiente</option>
                    <option value="PAGADO">Pagado</option>
                    <option value="PREPARANDO">En preparación</option>
                    <option value="ENVIADO">Enviado</option>
                    <option value="ENTREGADO">Entregado</option>
                    <option value="COMPLETO">Completado</option>
                  </select>
                </div>
                <div>
                  <label className="text-2xs font-semibold uppercase tracking-normal text-ink-faint">Descuento</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="inp mt-1.5"
                    value={formData.descuento}
                    onChange={(e) => setFormData({ ...formData, descuento: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="text-2xs font-semibold uppercase tracking-normal text-ink-faint">IGV</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="inp mt-1.5"
                    value={formData.igv}
                    onChange={(e) => setFormData({ ...formData, igv: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="border border-border rounded-lg p-4">
                <h4 className="font-semibold mb-3">Agregar Línea</h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="sm:col-span-2">
                    <label className="text-2xs font-semibold uppercase tracking-normal text-ink-faint">Producto</label>
                    <select
                      className="inp mt-1.5"
                      value={lineaForm.productoId}
                      onChange={(e) => setLineaForm({ ...lineaForm, productoId: e.target.value })}
                    >
                      <option value="">Seleccionar...</option>
                      {productos.map((p) => (
                        <option key={p.id} value={p.id}>{p.sku} - {p.nombre} (S/ {Number(p.precioVenta).toFixed(2)})</option>
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
                </div>
                <button
                  type="button"
                  onClick={addLinea}
                  className="mt-3 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold hover:bg-raised"
                >
                  + Agregar
                </button>
              </div>

              {formData.lineas.length > 0 && (
                <div className="border border-border rounded-lg p-4">
                  <h4 className="font-semibold mb-3">Líneas del Pedido</h4>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left">
                        <th className="pb-2 text-2xs font-semibold uppercase tracking-normal text-ink-faint">Producto</th>
                        <th className="pb-2 text-2xs font-semibold uppercase tracking-normal text-ink-faint">Cant.</th>
                        <th className="pb-2 text-2xs font-semibold uppercase tracking-normal text-ink-faint">Precio</th>
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
                            <td className="py-2 tabular-nums">S/ {Number(linea.precioUnitario).toFixed(2)}</td>
                            <td className="py-2 tabular-nums font-semibold">S/ {Number(linea.subtotal).toFixed(2)}</td>
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
                  <div className="mt-3 space-y-1 text-right">
                    <div className="text-sm text-ink-muted">Subtotal: S/ {subtotalPedido.toFixed(2)}</div>
                    {(parseFloat(formData.descuento) || 0) > 0 && <div className="text-sm text-red">Descuento: - S/ {(parseFloat(formData.descuento) || 0).toFixed(2)}</div>}
                    {(parseFloat(formData.igv) || 0) > 0 && <div className="text-sm text-ink-muted">IGV: + S/ {(parseFloat(formData.igv) || 0).toFixed(2)}</div>}
                    <div className="font-display text-lg font-bold">Total: S/ {totalPedido.toFixed(2)}</div>
                  </div>
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
                  {submitting ? "Creando..." : "Crear Pedido"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
