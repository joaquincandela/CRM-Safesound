"use client";
import { useState, useEffect, useCallback } from "react";
import { apiClient, ApiError } from "@/infrastructure/api/ApiClient";

interface Categoria {
  id: string;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
  _count: { productos: number };
}

export default function CategoriasPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Categoria | null>(null);
  const [formData, setFormData] = useState({ nombre: "", descripcion: "", activo: true });
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  const showToast = useCallback((type: "ok" | "err", msg: string) => {
    setToast({ type, msg });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(id);
  }, [toast]);

  const fetchCategorias = async () => {
    try {
      const data = await apiClient.get<Categoria[]>("/categorias");
      setCategorias(data);
    } catch (error) {
      console.error("Error fetching categorias:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategorias();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editing) {
        await apiClient.patch(`/categorias/${editing.id}`, formData);
        showToast("ok", "Categoría actualizada");
      } else {
        await apiClient.post("/categorias", formData);
        showToast("ok", "Categoría creada");
      }
      setShowModal(false);
      setEditing(null);
      setFormData({ nombre: "", descripcion: "", activo: true });
      fetchCategorias();
    } catch (error) {
      const msg = error instanceof ApiError ? error.message : "Error de conexión";
      showToast("err", msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (cat: Categoria) => {
    setEditing(cat);
    setFormData({ nombre: cat.nombre, descripcion: cat.descripcion || "", activo: cat.activo });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar esta categoría?")) return;
    try {
      await apiClient.delete(`/categorias/${id}`);
      fetchCategorias();
      showToast("ok", "Categoría eliminada");
    } catch (error) {
      const msg = error instanceof ApiError ? error.message : "Error de conexión";
      showToast("err", msg);
    }
  };

  if (loading) {
    return <div className="p-6 text-ink-muted animate-pulse">Cargando...</div>;
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-5 p-4 sm:p-6">
      {toast && (
        <div
          className={`fixed top-4 right-4 z-[100] rounded-lg px-4 py-3 text-sm font-medium shadow-lg transition-opacity ${
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
          <h1 className="font-display text-2xl font-bold">Categorías</h1>
          <p className="text-sm text-ink-muted">Gestiona las categorías de productos</p>
        </div>
        <button
          onClick={() => { setEditing(null); setFormData({ nombre: "", descripcion: "", activo: true }); setShowModal(true); }}
          className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-bg transition-transform hover:-translate-y-px"
        >
          Nueva Categoría
        </button>
      </header>

      <div className="card overflow-x-auto p-5">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="px-4 py-3 text-2xs font-semibold uppercase tracking-normal text-ink-faint">Nombre</th>
              <th className="px-4 py-3 text-2xs font-semibold uppercase tracking-normal text-ink-faint">Descripción</th>
              <th className="px-4 py-3 text-2xs font-semibold uppercase tracking-normal text-ink-faint">Productos</th>
              <th className="px-4 py-3 text-2xs font-semibold uppercase tracking-normal text-ink-faint">Estado</th>
              <th className="px-4 py-3 text-2xs font-semibold uppercase tracking-normal text-ink-faint">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {categorias.map((cat) => (
              <tr key={cat.id} className="border-b border-border hover:bg-raised">
                <td className="px-4 py-3 font-medium">{cat.nombre}</td>
                <td className="px-4 py-3 text-ink-muted">{cat.descripcion || "—"}</td>
                <td className="px-4 py-3 tabular-nums">{cat._count.productos}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1.5 rounded-pill px-2 py-0.5 text-2xs font-semibold ${
                    cat.activo ? "bg-green/15 text-green" : "bg-red/15 text-red"
                  }`}>
                    {cat.activo ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(cat)}
                      className="rounded border border-border px-2 py-1 text-xs hover:bg-raised"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(cat.id)}
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
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-card border border-border-strong bg-surface shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h3 className="font-display text-lg font-bold">
                {editing ? "Editar" : "Nueva"} Categoría
              </h3>
              <button onClick={() => setShowModal(false)} className="text-ink-muted hover:text-ink">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="text-2xs font-semibold uppercase tracking-normal text-ink-faint">Nombre</label>
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
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="activo"
                  checked={formData.activo}
                  onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                  className="h-4 w-4"
                />
                <label htmlFor="activo" className="text-sm">Activo</label>
              </div>
              <div className="flex justify-end gap-2.5 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-ink hover:bg-raised" disabled={submitting}>
                  Cancelar
                </button>
                <button type="submit" disabled={submitting} className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-bg transition-transform hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed">
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
