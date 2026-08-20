"use client";
import { useState, useEffect } from "react";
import { apiClient, ApiError } from "@/infrastructure/api/ApiClient";

interface Proveedor {
  id: string;
  tipoDocumento: string;
  numeroDocumento: string;
  razonSocial: string;
  nombreComercial: string | null;
  contacto: string | null;
  email: string | null;
  telefono: string | null;
  direccion: string | null;
  pais: string | null;
  activo: boolean;
  createdAt: string;
  _count: { ordenes: number };
}

export default function ProveedoresPage() {
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Proveedor | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: "ok" | "err"; msg: string } | null>(null);
  const [formData, setFormData] = useState({
    tipoDocumento: "RUC",
    numeroDocumento: "",
    razonSocial: "",
    nombreComercial: "",
    contacto: "",
    email: "",
    telefono: "",
    direccion: "",
    pais: "",
    activo: true,
  });
  const [filtro, setFiltro] = useState("");

  const showToast = (type: "ok" | "err", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchProveedores = async () => {
    try {
      const params = new URLSearchParams();
      if (filtro) params.append("buscar", filtro);
      const qs = params.toString();
      const data = await apiClient.get<Proveedor[]>(`/proveedores${qs ? `?${qs}` : ""}`);
      setProveedores(data);
    } catch (error) {
      console.error("Error fetching proveedores:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProveedores();
  }, [filtro]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const qParam = params.get("q");
    if (qParam && qParam.trim()) setFiltro(qParam.trim());
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        tipoDocumento: formData.tipoDocumento,
        numeroDocumento: formData.numeroDocumento,
        razonSocial: formData.razonSocial,
        activo: formData.activo,
      };
      if (formData.nombreComercial) body.nombreComercial = formData.nombreComercial;
      if (formData.contacto) body.contacto = formData.contacto;
      if (formData.email) body.email = formData.email;
      if (formData.telefono) body.telefono = formData.telefono;
      if (formData.direccion) body.direccion = formData.direccion;
      if (formData.pais) body.pais = formData.pais;

      if (editing) {
        await apiClient.patch(`/proveedores/${editing.id}`, body);
        showToast("ok", "Proveedor actualizado");
      } else {
        await apiClient.post("/proveedores", body);
        showToast("ok", "Proveedor creado");
      }

      setShowModal(false);
      setEditing(null);
      resetForm();
      fetchProveedores();
    } catch (error) {
      const msg = error instanceof ApiError ? error.message : "Error de conexion al guardar proveedor";
      showToast("err", msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (proveedor: Proveedor) => {
    setEditing(proveedor);
    setFormData({
      tipoDocumento: proveedor.tipoDocumento || "RUC",
      numeroDocumento: proveedor.numeroDocumento || "",
      razonSocial: proveedor.razonSocial,
      nombreComercial: proveedor.nombreComercial || "",
      contacto: proveedor.contacto || "",
      email: proveedor.email || "",
      telefono: proveedor.telefono || "",
      direccion: proveedor.direccion || "",
      pais: proveedor.pais || "",
      activo: proveedor.activo,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estas seguro de eliminar este proveedor?")) return;
    try {
      await apiClient.delete(`/proveedores/${id}`);
      fetchProveedores();
      showToast("ok", "Proveedor eliminado");
    } catch (error) {
      const msg = error instanceof ApiError ? error.message : "Error de conexion al eliminar proveedor";
      showToast("err", msg);
    }
  };

  const resetForm = () => {
    setFormData({
      tipoDocumento: "RUC",
      numeroDocumento: "",
      razonSocial: "",
      nombreComercial: "",
      contacto: "",
      email: "",
      telefono: "",
      direccion: "",
      pais: "",
      activo: true,
    });
  };

  if (loading) {
    return <div className="p-6 text-ink-muted">Cargando...</div>;
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
          <h1 className="font-display text-2xl font-bold">Proveedores</h1>
          <p className="text-sm text-ink-muted">Gestiona la base de proveedores</p>
        </div>
        <button
          onClick={() => { resetForm(); setEditing(null); setShowModal(true); }}
          className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-bg transition-transform hover:-translate-y-px"
        >
          Nuevo Proveedor
        </button>
      </header>

      <div className="card p-5">
        <div className="mb-4">
          <input
            className="inp"
            placeholder="Buscar por razon social, nombre comercial o documento..."
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-4 py-3 text-2xs font-semibold uppercase tracking-normal text-ink-faint">Razon Social</th>
                <th className="px-4 py-3 text-2xs font-semibold uppercase tracking-normal text-ink-faint">Nombre Comercial</th>
                <th className="px-4 py-3 text-2xs font-semibold uppercase tracking-normal text-ink-faint">Documento</th>
                <th className="px-4 py-3 text-2xs font-semibold uppercase tracking-normal text-ink-faint">Email</th>
                <th className="px-4 py-3 text-2xs font-semibold uppercase tracking-normal text-ink-faint">Telefono</th>
                <th className="px-4 py-3 text-2xs font-semibold uppercase tracking-normal text-ink-faint">Contacto</th>
                <th className="px-4 py-3 text-2xs font-semibold uppercase tracking-normal text-ink-faint">Pais</th>
                <th className="px-4 py-3 text-2xs font-semibold uppercase tracking-normal text-ink-faint">Direccion</th>
                <th className="px-4 py-3 text-2xs font-semibold uppercase tracking-normal text-ink-faint">Ordenes</th>
                <th className="px-4 py-3 text-2xs font-semibold uppercase tracking-normal text-ink-faint">Estado</th>
                <th className="px-4 py-3 text-2xs font-semibold uppercase tracking-normal text-ink-faint">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {proveedores.map((proveedor) => (
                <tr key={proveedor.id} className="border-b border-border hover:bg-raised">
                  <td className="px-4 py-3 font-medium">{proveedor.razonSocial}</td>
                  <td className="px-4 py-3 text-ink-muted">{proveedor.nombreComercial || "—"}</td>
                  <td className="px-4 py-3 text-ink-muted font-mono text-xs">
                    {proveedor.tipoDocumento}: {proveedor.numeroDocumento}
                  </td>
                  <td className="px-4 py-3 text-ink-muted">{proveedor.email || "—"}</td>
                  <td className="px-4 py-3 text-ink-muted">{proveedor.telefono || "—"}</td>
                  <td className="px-4 py-3 text-ink-muted">{proveedor.contacto || "—"}</td>
                  <td className="px-4 py-3 text-ink-muted">{proveedor.pais || "—"}</td>
                  <td className="px-4 py-3 text-ink-muted">{proveedor.direccion || "—"}</td>
                  <td className="px-4 py-3 tabular-nums">{proveedor._count.ordenes}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 rounded-pill px-2 py-0.5 text-2xs font-semibold ${
                      proveedor.activo ? "bg-green/15 text-green" : "bg-red/15 text-red"
                    }`}>
                      {proveedor.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(proveedor)}
                        className="rounded border border-border px-2 py-1 text-xs hover:bg-raised"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(proveedor.id)}
                        className="rounded border border-red px-2 py-1 text-xs text-red hover:bg-red/15"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {proveedores.length === 0 && (
                <tr>
                  <td colSpan={11} className="px-4 py-8 text-center text-ink-muted">
                    No hay proveedores registrados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm sm:p-6" onClick={() => setShowModal(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-card border border-border-strong bg-surface shadow-2xl max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h3 className="font-display text-lg font-bold">
                {editing ? "Editar" : "Nuevo"} Proveedor
              </h3>
              <button onClick={() => setShowModal(false)} className="text-ink-muted hover:text-ink">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="text-2xs font-semibold uppercase tracking-normal text-ink-faint">Razon Social</label>
                <input
                  className="inp mt-1.5"
                  value={formData.razonSocial}
                  onChange={(e) => setFormData({ ...formData, razonSocial: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-2xs font-semibold uppercase tracking-normal text-ink-faint">Tipo Documento</label>
                  <select
                    className="inp mt-1.5"
                    value={formData.tipoDocumento}
                    onChange={(e) => setFormData({ ...formData, tipoDocumento: e.target.value })}
                  >
                    <option value="RUC">RUC</option>
                    <option value="DNI">DNI</option>
                    <option value="CE">Carnet de Extrangeria</option>
                    <option value="PASAPORTE">Pasaporte</option>
                    <option value="OTRO">Otro</option>
                  </select>
                </div>
                <div>
                  <label className="text-2xs font-semibold uppercase tracking-normal text-ink-faint">Numero de Documento</label>
                  <input
                    className="inp mt-1.5"
                    value={formData.numeroDocumento}
                    onChange={(e) => setFormData({ ...formData, numeroDocumento: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-2xs font-semibold uppercase tracking-normal text-ink-faint">Nombre Comercial</label>
                  <input
                    className="inp mt-1.5"
                    value={formData.nombreComercial}
                    onChange={(e) => setFormData({ ...formData, nombreComercial: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-2xs font-semibold uppercase tracking-normal text-ink-faint">Contacto</label>
                  <input
                    className="inp mt-1.5"
                    value={formData.contacto}
                    onChange={(e) => setFormData({ ...formData, contacto: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-2xs font-semibold uppercase tracking-normal text-ink-faint">Email</label>
                  <input
                    type="email"
                    className="inp mt-1.5"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-2xs font-semibold uppercase tracking-normal text-ink-faint">Telefono</label>
                  <input
                    className="inp mt-1.5"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-2xs font-semibold uppercase tracking-normal text-ink-faint">Pais</label>
                  <input
                    className="inp mt-1.5"
                    value={formData.pais}
                    onChange={(e) => setFormData({ ...formData, pais: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-2xs font-semibold uppercase tracking-normal text-ink-faint">Direccion</label>
                  <input
                    className="inp mt-1.5"
                    value={formData.direccion}
                    onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                  />
                </div>
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
                <button type="button" onClick={() => setShowModal(false)} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-ink hover:bg-raised">
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-bg transition-transform hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed"
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
