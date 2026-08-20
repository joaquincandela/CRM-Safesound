"use client";
import { useState, useEffect, useRef } from "react";
import { apiClient, ApiError } from "@/infrastructure/api/ApiClient";

interface Usuario {
  id: string;
  nombre: string;
  email: string;
  telefono: string | null;
  rol: string;
  activo: boolean;
  createdAt: string;
}

const ROLES = ["ADMIN", "VENTAS", "INVENTARIO", "OPERACIONES"] as const;

const rolColor: Record<string, string> = {
  ADMIN: "bg-red/15 text-red",
  VENTAS: "bg-blue/15 text-blue",
  INVENTARIO: "bg-purple/15 text-purple",
  OPERACIONES: "bg-yellow/15 text-yellow",
};

export default function ConfiguracionPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Usuario | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: "ok" | "err"; msg: string } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    telefono: "",
    password: "",
    rol: "VENTAS",
    activo: true,
  });

  const showToast = (type: "ok" | "err", msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ type, msg });
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  };

  const fetchUsuarios = async () => {
    try {
      const data = await apiClient.get<Usuario[]>("/usuarios");
      setUsuarios(data);
    } catch (error) {
      console.error("Error fetching usuarios:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsuarios();
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const openCreate = () => {
    setEditing(null);
    setFormData({ nombre: "", email: "", telefono: "", password: "", rol: "VENTAS", activo: true });
    setShowModal(true);
  };

  const openEdit = (u: Usuario) => {
    setEditing(u);
    setFormData({
      nombre: u.nombre,
      email: u.email,
      telefono: u.telefono ?? "",
      password: "",
      rol: u.rol,
      activo: u.activo,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        nombre: formData.nombre,
        email: formData.email,
        telefono: formData.telefono || undefined,
        rol: formData.rol,
      };
      if (!editing) {
        body.password = formData.password;
      } else {
        body.activo = formData.activo;
        if (formData.password) body.password = formData.password;
      }

      if (editing) {
        await apiClient.patch(`/usuarios/${editing.id}`, body);
        showToast("ok", "Usuario actualizado correctamente");
      } else {
        await apiClient.post("/usuarios", body);
        showToast("ok", "Usuario creado correctamente");
      }

      setShowModal(false);
      setEditing(null);
      fetchUsuarios();
    } catch (error) {
      showToast("err", error instanceof ApiError ? error.message : "Error al guardar el usuario");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActivo = async (u: Usuario) => {
    try {
      await apiClient.patch(`/usuarios/${u.id}`, { activo: !u.activo });
      showToast("ok", u.activo ? "Usuario desactivado" : "Usuario activado");
      fetchUsuarios();
    } catch (error) {
      showToast("err", error instanceof ApiError ? error.message : "Error al cambiar estado");
    }
  };

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 p-4 sm:p-6">
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
          <h1 className="font-display text-2xl font-bold">Configuración</h1>
          <p className="text-sm text-ink-muted">Gestión de usuarios y parámetros del sistema.</p>
        </div>
        <button
          onClick={openCreate}
          className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-bg transition-transform hover:-translate-y-px"
        >
          Nuevo Usuario
        </button>
      </header>

      <div className="card p-5">
        <h2 className="font-display text-lg font-bold mb-4">Usuarios del sistema</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-4 py-3 text-2xs font-semibold uppercase tracking-normal text-ink-faint">Nombre</th>
                <th className="px-4 py-3 text-2xs font-semibold uppercase tracking-normal text-ink-faint">Email</th>
                <th className="px-4 py-3 text-2xs font-semibold uppercase tracking-normal text-ink-faint">Teléfono</th>
                <th className="px-4 py-3 text-2xs font-semibold uppercase tracking-normal text-ink-faint">Rol</th>
                <th className="px-4 py-3 text-2xs font-semibold uppercase tracking-normal text-ink-faint">Estado</th>
                <th className="px-4 py-3 text-2xs font-semibold uppercase tracking-normal text-ink-faint">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id} className="border-b border-border hover:bg-raised">
                  <td className="px-4 py-3 font-medium">{u.nombre}</td>
                  <td className="px-4 py-3 text-ink-muted">{u.email}</td>
                  <td className="px-4 py-3 text-ink-muted">{u.telefono || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 rounded-pill px-2 py-0.5 text-2xs font-semibold ${rolColor[u.rol] ?? "bg-gray/15 text-gray"}`}>
                      {u.rol}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggleActivo(u)}
                      className={`rounded-pill px-2 py-0.5 text-2xs font-semibold ${u.activo ? "bg-green/15 text-green" : "bg-red/15 text-red"}`}
                    >
                      {u.activo ? "Activo" : "Inactivo"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => openEdit(u)}
                      className="rounded border border-border px-2 py-1 text-xs hover:bg-raised"
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
              {usuarios.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-ink-muted">
                    No hay usuarios registrados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {loading && <div className="p-4 text-sm text-ink-muted">Cargando usuarios...</div>}
      </div>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="text-lg font-semibold">Empresa</h2>
          <p className="mt-1 text-sm text-ink-muted">Datos visibles de la operación.</p>
          <div className="mt-5 grid gap-4">
            <Field label="Razón social" value="SafeSound" />
            <Field label="Correo principal" value="admin@safesound.com" />
            <Field label="Moneda base" value="PEN" />
            <Field label="Zona horaria" value="America/Lima" />
          </div>
        </div>

        <div className="card p-5">
          <h2 className="text-lg font-semibold">Estado del sistema</h2>
          <p className="mt-1 text-sm text-ink-muted">Checklist para iniciar operación y siguientes iteraciones.</p>
          <div className="mt-5 space-y-3">
            <StatusItem title="Autenticación JWT" detail="Activa y conectada al backend real." />
            <StatusItem title="Base de datos PostgreSQL" detail="Operativa con Prisma y seed aplicado." />
            <StatusItem title="Módulos ERP" detail="Productos, compras, inventario, ventas y finanzas disponibles." />
            <StatusItem title="Accesos por rol" detail="Gastos, finanzas y órdenes de compra solo para ADMIN." />
          </div>
        </div>
      </section>

      {showModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm sm:p-6" onClick={() => setShowModal(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-card border border-border-strong bg-surface shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h3 className="font-display text-lg font-bold">{editing ? "Editar" : "Nuevo"} usuario</h3>
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
                <label className="text-2xs font-semibold uppercase tracking-normal text-ink-faint">Email</label>
                <input
                  type="email"
                  className="inp mt-1.5"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-2xs font-semibold uppercase tracking-normal text-ink-faint">Teléfono</label>
                  <input
                    className="inp mt-1.5"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-2xs font-semibold uppercase tracking-normal text-ink-faint">Rol</label>
                  <select
                    className="inp mt-1.5"
                    value={formData.rol}
                    onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-2xs font-semibold uppercase tracking-normal text-ink-faint">
                  {editing ? "Nueva contraseña (dejar vacío para no cambiar)" : "Contraseña"}
                </label>
                <input
                  type="password"
                  className="inp mt-1.5"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  {...(!editing ? { required: true, minLength: 6 } : {})}
                />
              </div>
              {editing && (
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={formData.activo}
                    onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                  />
                  Usuario activo
                </label>
              )}
              <div className="flex justify-end gap-2.5 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-ink hover:bg-raised">
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-bg transition-transform hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "Guardando..." : editing ? "Actualizar" : "Crear usuario"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-[0.16em] text-ink-faint">{label}</div>
      <div className="mt-2 rounded-2xl border px-4 py-3 text-sm" style={{ borderColor: "var(--border)" }}>
        {value}
      </div>
    </div>
  );
}

function StatusItem({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-2xl border px-4 py-4" style={{ borderColor: "var(--border)" }}>
      <div className="text-sm font-semibold">{title}</div>
      <div className="mt-1 text-sm text-ink-muted">{detail}</div>
    </div>
  );
}
