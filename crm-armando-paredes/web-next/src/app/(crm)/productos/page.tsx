"use client";
import { useState, useEffect, useCallback } from "react";
import { apiClient, ApiError } from "@/infrastructure/api/ApiClient";

interface Categoria {
  id: string;
  nombre: string;
}

interface Producto {
  id: string;
  sku: string;
  nombre: string;
  descripcion: string | null;
  categoriaId: string;
  categoria: Categoria;
  costoUnitario: number;
  precioVenta: number;
  stockMinimo: number;
  estado: string;
  imagenUrl: string | null;
  ultimaImportacionFecha: string | null;
  ultimoCosteo: { id: string; numero: string; fecha: string; moneda: string } | null;
  createdAt: string;
  updatedAt: string;
}

type Toast = { type: "ok" | "err"; msg: string } | null;

const COLORES = ["Dorado con Negro", "Dorado con Amarillo", "Plateado con Blanco", "Plateado con Negro", "Morado con Blanco", "Rosado con Blanco", "Transparente con Blanco", "Transparente con Negro"];

export default function ProductosPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [stocks, setStocks] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Producto | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<Toast>(null);
  const [formData, setFormData] = useState({
    sku: "",
    nombre: "",
    descripcion: "",
    categoriaId: "",
    color: "",
    precioVenta: "",
    stockMinimo: "0",
    stockInicial: "0",
    estado: "ACTIVO",
    imagenUrl: "",
  });

  const showToast = useCallback((t: Toast) => {
    setToast(t);
    if (t) {
      setTimeout(() => setToast(null), 3500);
    }
  }, []);

  const costoMoneda = (prod: Producto) => (prod.ultimoCosteo?.moneda === "USD" ? "$" : "S/");

  const onChangeForm = (changes: Partial<typeof formData>) => {
    const next = { ...formData, ...changes };
    const cat = categorias.find((c) => c.id === next.categoriaId);
    if (cat && next.color) {
      const generado = `${cat.nombre} ${next.color}`;
      setFormData({ ...next, sku: generado, nombre: generado });
    } else {
      setFormData(next);
    }
  };

  const fetchProductos = async (filtro?: string | null) => {
    try {
      const path = filtro ? `/productos?buscar=${encodeURIComponent(filtro)}` : "/productos";
      const data = await apiClient.get<Producto[]>(path);
      setProductos(data);
    } catch (error) {
      console.error("Error fetching productos:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategorias = async () => {
    try {
      const data = await apiClient.get<Categoria[]>("/categorias");
      setCategorias(data);
    } catch (error) {
      console.error("Error fetching categorias:", error);
    }
  };

  const fetchStocks = async () => {
    try {
      const data = await apiClient.get<Array<{ productoId: string; stock: number }>>("/movimientos/stock");
      const map = new Map<string, number>();
      for (const s of data) map.set(s.productoId, s.stock);
      setStocks(map);
    } catch {
      // si falla, stock se muestra como 0
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const qParam = params.get("q");
    const qVal = qParam && qParam.trim() ? qParam.trim() : null;
    setQ(qVal);
    fetchProductos(qVal);
    fetchCategorias();
    fetchStocks();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        ...formData,
        precioVenta: parseFloat(formData.precioVenta),
        stockMinimo: parseInt(formData.stockMinimo),
        stockInicial: parseInt(formData.stockInicial),
      };

      if (editing) {
        delete body.stockInicial;
        await apiClient.patch(`/productos/${editing.id}`, body);
        showToast({ type: "ok", msg: "Producto actualizado" });
      } else {
        await apiClient.post("/productos", body);
        showToast({ type: "ok", msg: "Producto creado" });
      }

      setShowModal(false);
      setEditing(null);
      setFormData({ sku: "", nombre: "", descripcion: "", categoriaId: "", color: "", precioVenta: "", stockMinimo: "0", stockInicial: "0", estado: "ACTIVO", imagenUrl: "" });
      fetchProductos(q);
      fetchStocks();
    } catch (error) {
      const msg = error instanceof ApiError ? error.message : "Error de conexión al guardar";
      showToast({ type: "err", msg });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (prod: Producto) => {
    setEditing(prod);
    setFormData({
      sku: prod.sku,
      nombre: prod.nombre,
      descripcion: prod.descripcion || "",
      categoriaId: prod.categoriaId,
      color: "",
      precioVenta: prod.precioVenta.toString(),
      stockMinimo: prod.stockMinimo.toString(),
      stockInicial: (stocks.get(prod.id) ?? 0).toString(),
      estado: prod.estado,
      imagenUrl: prod.imagenUrl || "",
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este producto?")) return;
    try {
      await apiClient.delete(`/productos/${id}`);
      fetchProductos(q);
      showToast({ type: "ok", msg: "Producto eliminado" });
    } catch (error) {
      const msg = error instanceof ApiError ? error.message : "Error de conexión al eliminar";
      showToast({ type: "err", msg });
    }
  };

  if (loading) {
    return <div className="p-6 text-ink-muted">Cargando productos...</div>;
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-5 p-4 sm:p-6">
      {toast && (
        <div
          className={`fixed right-5 top-5 z-[100] rounded-lg px-4 py-3 text-sm font-medium shadow-lg ${
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
          <h1 className="font-display text-2xl font-bold">Productos</h1>
          <p className="text-sm text-ink-muted">Gestiona el catálogo de productos</p>
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
                  history.replaceState({}, "", "/productos");
                  fetchProductos(null);
                }}
                className="hover:text-ink"
                aria-label="Quitar filtro"
              >
                ✕
              </button>
            </span>
          )}
          <button
            onClick={() => { setEditing(null); setFormData({ sku: "", nombre: "", descripcion: "", categoriaId: "", color: "", precioVenta: "", stockMinimo: "0", stockInicial: "0", estado: "ACTIVO", imagenUrl: "" }); setShowModal(true); }}
            className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-bg transition-transform hover:-translate-y-px"
          >
            Nuevo Producto
          </button>
        </div>
      </header>

      <div className="card overflow-x-auto p-5">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="px-4 py-3 text-2xs font-semibold uppercase tracking-normal text-ink-faint">SKU</th>
              <th className="px-4 py-3 text-2xs font-semibold uppercase tracking-normal text-ink-faint">Nombre</th>
              <th className="px-4 py-3 text-2xs font-semibold uppercase tracking-normal text-ink-faint">Descripción</th>
              <th className="px-4 py-3 text-2xs font-semibold uppercase tracking-normal text-ink-faint">Categoría</th>
              <th className="px-4 py-3 text-2xs font-semibold uppercase tracking-normal text-ink-faint">Costo</th>
              <th className="px-4 py-3 text-2xs font-semibold uppercase tracking-normal text-ink-faint">Venta</th>
              <th className="px-4 py-3 text-2xs font-semibold uppercase tracking-normal text-ink-faint">Últ. importación</th>
              <th className="px-4 py-3 text-2xs font-semibold uppercase tracking-normal text-ink-faint">Stock actual</th>
              <th className="px-4 py-3 text-2xs font-semibold uppercase tracking-normal text-ink-faint">Stock mín</th>
              <th className="px-4 py-3 text-2xs font-semibold uppercase tracking-normal text-ink-faint">Estado</th>
              <th className="px-4 py-3 text-2xs font-semibold uppercase tracking-normal text-ink-faint">Imagen</th>
              <th className="px-4 py-3 text-2xs font-semibold uppercase tracking-normal text-ink-faint">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {productos.map((prod) => (
              <tr key={prod.id} className="border-b border-border hover:bg-raised">
                <td className="px-4 py-3 font-mono text-xs">{prod.sku}</td>
                <td className="px-4 py-3 font-medium">{prod.nombre}</td>
                <td className="px-4 py-3 text-ink-muted max-w-[200px] truncate" title={prod.descripcion || ""}>{prod.descripcion || "—"}</td>
                <td className="px-4 py-3 text-ink-muted">{prod.categoria?.nombre || "—"}</td>
                <td className="px-4 py-3 tabular-nums">{costoMoneda(prod)} {Number(prod.costoUnitario).toFixed(2)}</td>
                <td className="px-4 py-3 tabular-nums font-semibold">S/ {Number(prod.precioVenta).toFixed(2)}</td>
                <td className="px-4 py-3 text-xs text-ink-muted">
                  {prod.ultimoCosteo ? (
                    <span>
                      {prod.ultimoCosteo.numero}
                      <span className="ml-1">· {prod.ultimaImportacionFecha ? new Date(prod.ultimaImportacionFecha).toLocaleDateString() : "—"}</span>
                    </span>
                  ) : "—"}
                </td>
                <td className={`px-4 py-3 tabular-nums font-semibold ${
                  (stocks.get(prod.id) ?? 0) <= prod.stockMinimo ? "text-red" : "text-green"
                }`}>
                  {stocks.get(prod.id) ?? 0}
                </td>
                <td className="px-4 py-3 tabular-nums">{prod.stockMinimo}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1.5 rounded-pill px-2 py-0.5 text-2xs font-semibold ${
                    prod.estado === "ACTIVO" ? "bg-green/15 text-green" : "bg-red/15 text-red"
                  }`}>
                    {prod.estado}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-ink-muted">{prod.imagenUrl ? <a href={prod.imagenUrl} target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">Ver</a> : "—"}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(prod)}
                      className="rounded border border-border px-2 py-1 text-xs hover:bg-raised"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(prod.id)}
                      className="rounded border border-red px-2 py-1 text-xs text-red hover:bg-red/15"
                    >
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm sm:p-6" onClick={() => setShowModal(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-card border border-border-strong bg-surface shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h3 className="font-display text-lg font-bold">
                {editing ? "Editar" : "Nuevo"} Producto
              </h3>
              <button onClick={() => setShowModal(false)} className="text-ink-muted hover:text-ink">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-2xs font-semibold uppercase tracking-normal text-ink-faint">SKU <span className="normal-case opacity-70">(se genera con Categoría + Color)</span></label>
                  <input
                    className="inp mt-1.5"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-2xs font-semibold uppercase tracking-normal text-ink-faint">Categoría</label>
                  <select
                    className="inp mt-1.5"
                    value={formData.categoriaId}
                    onChange={(e) => onChangeForm({ categoriaId: e.target.value })}
                    required
                  >
                    <option value="">Seleccionar...</option>
                    {categorias.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-2xs font-semibold uppercase tracking-normal text-ink-faint">Color</label>
                <select
                  className="inp mt-1.5"
                  value={formData.color}
                  onChange={(e) => onChangeForm({ color: e.target.value })}
                  required
                >
                  <option value="">Seleccionar...</option>
                  {COLORES.map((color) => (
                    <option key={color} value={color}>{color}</option>
                  ))}
                </select>
                {formData.categoriaId && formData.color && (
                  <p className="mt-1 text-2xs text-ink-muted">SKU generado: <span className="font-mono text-gold">{`${formData.sku}`}</span></p>
                )}
              </div>
              <div>
                <label className="text-2xs font-semibold uppercase tracking-normal text-ink-faint">Nombre <span className="normal-case opacity-70">(se rellena automáticamente)</span></label>
                <input
                  className="inp mt-1.5"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-2xs font-semibold uppercase tracking-normal text-ink-faint">Descripción</label>
                <textarea
                  className="inp mt-1.5"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border border-border p-3">
                  <label className="text-2xs font-semibold uppercase tracking-normal text-ink-faint">Costo unitario</label>
                  <div className="mt-1.5 tabular-nums text-sm font-semibold">
                    {editing ? `${costoMoneda(editing)} ${Number(editing.costoUnitario).toFixed(2)}` : "Se asigna en el Costeo"}
                  </div>
                  <p className="mt-1 text-2xs text-ink-muted">El costo real lo define el Costeo de Importación.</p>
                </div>
                <div>
                  <label className="text-2xs font-semibold uppercase tracking-normal text-ink-faint">Precio Venta</label>
                  <input
                    type="number"
                    step="0.01"
                    className="inp mt-1.5"
                    value={formData.precioVenta}
                    onChange={(e) => setFormData({ ...formData, precioVenta: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-2xs font-semibold uppercase tracking-normal text-ink-faint">Stock Mínimo</label>
                  <input
                    type="number"
                    className="inp mt-1.5"
                    value={formData.stockMinimo}
                    onChange={(e) => setFormData({ ...formData, stockMinimo: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-2xs font-semibold uppercase tracking-normal text-ink-faint">{editing ? "Stock actual" : "Stock inicial"}</label>
                  <input
                    type="number"
                    className="inp mt-1.5"
                    value={formData.stockInicial}
                    onChange={(e) => setFormData({ ...formData, stockInicial: e.target.value })}
                    readOnly={!!editing}
                    disabled={!!editing}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-2xs font-semibold uppercase tracking-normal text-ink-faint">Estado</label>
                  <select
                    className="inp mt-1.5"
                    value={formData.estado}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                  >
                    <option value="ACTIVO">Activo</option>
                    <option value="INACTIVO">Inactivo</option>
                  </select>
                </div>
                <div>
                  <label className="text-2xs font-semibold uppercase tracking-normal text-ink-faint">URL Imagen</label>
                  <input
                    className="inp mt-1.5"
                    value={formData.imagenUrl}
                    onChange={(e) => setFormData({ ...formData, imagenUrl: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2.5 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-ink hover:bg-raised">
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-bg transition-transform hover:-translate-y-px disabled:pointer-events-none disabled:opacity-50"
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
