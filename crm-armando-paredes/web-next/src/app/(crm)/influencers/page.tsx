"use client";
import { useState, useEffect, useRef } from "react";
import { apiClient, ApiError } from "@/infrastructure/api/ApiClient";
import { useAuth } from "@/presentation/providers/AuthProvider";
import Link from "next/link";

interface Metricas {
  id: string;
  fechaInicio: string;
  seguidores: number;
  engagement: number;
  alcance: number;
  vistas: number;
  publicaciones: number;
  clics: number;
  conversiones: number;
}

interface Tarea {
  id: string;
  mes: string;
  descripcion: string;
  cantidadMeta: number;
  cantidadCompletada: number;
}

interface Objetivo {
  id: string;
  mes: string;
  descripcion: string;
  cantidadMeta: number;
  cantidadCompletada: number;
}

interface Influencer {
  id: string;
  nombre: string;
  instagram: string | null;
  tiktok: string | null;
  youtube: string | null;
  metaPublicaciones: number;
  activo: boolean;
  createdAt: string;
  usuario: { id: string; email: string; activo: boolean } | null;
  metricas: Metricas[];
  tareas: Tarea[];
  objetivos: Objetivo[];
}

type Toast = { type: "ok" | "err"; msg: string } | null;

const emptyForm = {
  nombre: "",
  instagram: "",
  tiktok: "",
  youtube: "",
  metaPublicaciones: "0",
  email: "",
  password: "",
};

const emptyObjetivo = { descripcion: "", cantidadMeta: "20" };

interface TareaForm {
  key: string;
  id?: string;
  descripcion: string;
  cantidadMeta: string;
  cantidadCompletada?: number;
}

let tareaKey = 0;
const nuevaTareaFila = (): TareaForm => ({
  key: `tarea-${++tareaKey}`,
  descripcion: "",
  cantidadMeta: "1",
});

function mesActualISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

function mesActualLabel() {
  return new Date().toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

function toMes(iso: string) {
  const d = new Date(iso);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export default function InfluencersPage() {
  const { session } = useAuth();
  const esAdmin = session?.rol === "ADMIN";
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Influencer | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<Toast>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [tareas, setTareas] = useState<TareaForm[]>([]);
  const [removedIds, setRemovedIds] = useState<string[]>([]);
  const [objetivoForm, setObjetivoForm] = useState(emptyObjetivo);

  const showToast = (t: Toast) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(t);
    if (t) toastTimer.current = setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const fetchInfluencers = async () => {
    try {
      const data = await apiClient.get<Influencer[]>("/influencers");
      setInfluencers(data);
    } catch (error) {
      console.error("Error fetching influencers:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInfluencers();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setFormData(emptyForm);
    setTareas([]);
    setRemovedIds([]);
    setObjetivoForm(emptyObjetivo);
    setShowModal(true);
  };

  const openEdit = (inf: Influencer) => {
    setEditing(inf);
    setFormData({
      nombre: inf.nombre,
      instagram: inf.instagram || "",
      tiktok: inf.tiktok || "",
      youtube: inf.youtube || "",
      metaPublicaciones: inf.metaPublicaciones.toString(),
      email: inf.usuario?.email || "",
      password: "",
    });
    const mesHoy = toMes(new Date().toISOString());
    setTareas(
      (inf.tareas || [])
        .filter((t) => toMes(t.mes) === mesHoy)
        .map((t) => ({
          key: `tarea-existente-${t.id}`,
          id: t.id,
          descripcion: t.descripcion,
          cantidadMeta: t.cantidadMeta.toString(),
          cantidadCompletada: t.cantidadCompletada,
        })),
    );
    const obj = (inf.objetivos || []).find((o) => toMes(o.mes) === mesHoy);
    setObjetivoForm(obj ? { descripcion: obj.descripcion, cantidadMeta: obj.cantidadMeta.toString() } : emptyObjetivo);
    setRemovedIds([]);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        nombre: formData.nombre,
        instagram: formData.instagram || undefined,
        tiktok: formData.tiktok || undefined,
        youtube: formData.youtube || undefined,
        metaPublicaciones: parseInt(formData.metaPublicaciones) || 0,
      };
      let influencerId: string | null = editing?.id ?? null;
      if (editing) {
        if (formData.email) body.email = formData.email;
        if (formData.password) body.password = formData.password;
        await apiClient.patch(`/influencers/${editing.id}`, body);
        showToast({ type: "ok", msg: "Influencer actualizado" });
      } else {
        const creado = await apiClient.post<Influencer>("/influencers", { ...body, email: formData.email, password: formData.password });
        influencerId = creado.id;
        showToast({ type: "ok", msg: "Influencer creado" });
      }

      const tareasValidas = tareas.filter((t) => t.descripcion.trim() !== "");
      if (influencerId) {
        for (const id of removedIds) {
          await apiClient.delete(`/influencers/${influencerId}/tareas/${id}`);
        }
        for (const t of tareasValidas) {
          const cantidadMeta = parseInt(t.cantidadMeta) || 1;
          if (t.id) {
            await apiClient.patch(`/influencers/${influencerId}/tareas/${t.id}`, {
              descripcion: t.descripcion.trim(),
              cantidadMeta,
            });
          } else {
            await apiClient.post(`/influencers/${influencerId}/tareas`, {
              mes: mesActualISO(),
              descripcion: t.descripcion.trim(),
              cantidadMeta,
            });
          }
        }
        if (objetivoForm.descripcion.trim() !== "") {
          await apiClient.post(`/influencers/${influencerId}/objetivo`, {
            mes: mesActualISO(),
            descripcion: objetivoForm.descripcion.trim(),
            cantidadMeta: parseInt(objetivoForm.cantidadMeta) || 1,
          });
        }
      }

      setShowModal(false);
      setEditing(null);
      fetchInfluencers();
    } catch (error) {
      const msg = error instanceof ApiError ? error.message : "Error al guardar";
      showToast({ type: "err", msg });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (inf: Influencer) => {
    try {
      await apiClient.patch(`/influencers/${inf.id}`, { activo: !inf.activo });
      showToast({ type: "ok", msg: inf.activo ? "Influencer desactivado" : "Influencer activado" });
      fetchInfluencers();
    } catch (error) {
      const msg = error instanceof ApiError ? error.message : "Error al actualizar";
      showToast({ type: "err", msg });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este influencer? También se eliminará su usuario de acceso.")) return;
    try {
      await apiClient.delete(`/influencers/${id}`);
      showToast({ type: "ok", msg: "Influencer eliminado" });
      fetchInfluencers();
    } catch (error) {
      const msg = error instanceof ApiError ? error.message : "Error al eliminar";
      showToast({ type: "err", msg });
    }
  };

  if (loading) return <div className="p-6 text-ink-muted">Cargando...</div>;

  return (
    <div className="mx-auto max-w-[1600px] space-y-5 p-4 sm:p-6">
      {toast && (
        <div className={`fixed top-5 right-5 z-[100] rounded-lg px-5 py-3 text-sm font-medium shadow-lg transition-opacity ${
          toast.type === "ok" ? "bg-green/15 text-green border border-green/30" : "bg-red/15 text-red border border-red/30"
        }`}>
          {toast.msg}
        </div>
      )}

      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Influencers</h1>
          <p className="text-sm text-ink-muted">Gestión de influencers de marketing</p>
        </div>
        {esAdmin && (
          <button onClick={openCreate} className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-bg transition-transform hover:-translate-y-px">
            Nuevo Influencer
          </button>
        )}
      </header>

      <div className="card overflow-x-auto p-5">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="px-4 py-3 text-2xs font-semibold uppercase tracking-normal text-ink-faint">Nombre</th>
              <th className="px-4 py-3 text-2xs font-semibold uppercase tracking-normal text-ink-faint">Redes</th>
              <th className="px-4 py-3 text-2xs font-semibold uppercase tracking-normal text-ink-faint">Objetivo del mes</th>
              <th className="px-4 py-3 text-2xs font-semibold uppercase tracking-normal text-ink-faint">Estado</th>
              {esAdmin && <th className="px-4 py-3 text-2xs font-semibold uppercase tracking-normal text-ink-faint">Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {influencers.map((inf) => (
              <tr key={inf.id} className="border-b border-border hover:bg-raised">
                  <td className="px-4 py-3">
                    <Link href={`/influencers/${inf.id}`} className="font-medium text-gold hover:underline">
                      {inf.nombre}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-ink-muted">
                    <div className="flex flex-wrap gap-1.5 text-xs">
                      {inf.instagram && <span className="rounded bg-raised px-1.5 py-0.5">IG: @{inf.instagram}</span>}
                      {inf.tiktok && <span className="rounded bg-raised px-1.5 py-0.5">TT: @{inf.tiktok}</span>}
                      {inf.youtube && <span className="rounded bg-raised px-1.5 py-0.5">YT: {inf.youtube}</span>}
                      {!inf.instagram && !inf.tiktok && !inf.youtube && <span>—</span>}
                    </div>
                    {inf.usuario?.email && <div className="mt-1 text-2xs text-ink-faint">{inf.usuario.email}</div>}
                  </td>
                  <td className="px-4 py-3">
                    {(() => {
                      const obj = inf.objetivos?.[0];
                      if (!obj) return <span className="text-ink-muted">—</span>;
                      const ok = obj.cantidadCompletada >= obj.cantidadMeta;
                      return (
                        <div>
                          <div className="text-xs text-ink-muted">{obj.descripcion}</div>
                          <span className={`mt-0.5 inline-flex items-center gap-1 rounded-pill px-2 py-0.5 text-2xs font-semibold ${ok ? "bg-green/15 text-green" : "bg-red/15 text-red"}`}>
                            {ok ? "Cumplido" : "En curso"}
                            <span className="opacity-70">({obj.cantidadCompletada}/{obj.cantidadMeta})</span>
                          </span>
                        </div>
                      );
                    })()}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 rounded-pill px-2 py-0.5 text-2xs font-semibold ${
                      inf.activo ? "bg-green/15 text-green" : "bg-red/15 text-red"
                    }`}>
                      {inf.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  {esAdmin && (
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button onClick={() => openEdit(inf)} className="rounded border border-border px-2 py-1 text-xs hover:bg-raised">
                          Editar
                        </button>
                        <button onClick={() => handleToggle(inf)} className="rounded border border-border px-2 py-1 text-xs hover:bg-raised">
                          {inf.activo ? "Desactivar" : "Activar"}
                        </button>
                        <button onClick={() => handleDelete(inf.id)} className="rounded border border-red px-2 py-1 text-xs text-red hover:bg-red/15">
                          Eliminar
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            {influencers.length === 0 && (
              <tr>
                <td colSpan={esAdmin ? 5 : 4} className="px-4 py-8 text-center text-ink-muted">
                  No hay influencers registrados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm sm:p-6" onClick={() => setShowModal(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-card border border-border-strong bg-surface shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h3 className="font-display text-lg font-bold">{editing ? "Editar" : "Nuevo"} Influencer</h3>
              <button onClick={() => setShowModal(false)} className="text-ink-muted hover:text-ink">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4 p-5">
              <div>
                <label className="text-2xs font-semibold uppercase tracking-normal text-ink-faint">Nombre</label>
                <input className="inp mt-1.5" value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} required />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="text-2xs font-semibold uppercase tracking-normal text-ink-faint">Instagram</label>
                  <input placeholder="@usuario" className="inp mt-1.5" value={formData.instagram} onChange={(e) => setFormData({ ...formData, instagram: e.target.value })} />
                </div>
                <div>
                  <label className="text-2xs font-semibold uppercase tracking-normal text-ink-faint">TikTok</label>
                  <input placeholder="@usuario" className="inp mt-1.5" value={formData.tiktok} onChange={(e) => setFormData({ ...formData, tiktok: e.target.value })} />
                </div>
                <div>
                  <label className="text-2xs font-semibold uppercase tracking-normal text-ink-faint">YouTube</label>
                  <input className="inp mt-1.5" value={formData.youtube} onChange={(e) => setFormData({ ...formData, youtube: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="text-2xs font-semibold uppercase tracking-normal text-ink-faint">Meta mensual de publicaciones</label>
                <input type="number" min={0} className="inp mt-1.5" value={formData.metaPublicaciones} onChange={(e) => setFormData({ ...formData, metaPublicaciones: e.target.value })} />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-2xs font-semibold uppercase tracking-normal text-ink-faint">
                    Email de acceso {editing && <span className="normal-case opacity-70">(opcional)</span>}
                  </label>
                  <input type="email" className="inp mt-1.5" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required={!editing} />
                </div>
                <div>
                  <label className="text-2xs font-semibold uppercase tracking-normal text-ink-faint">
                    Contraseña {editing && <span className="normal-case opacity-70">(opcional)</span>}
                  </label>
                  <input type="password" className="inp mt-1.5" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required={!editing} minLength={6} />
                </div>
              </div>

              <div className="rounded-2xl border border-border p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-bold">Tareas del mes</h4>
                    <p className="text-xs text-ink-muted">
                      Lista para {mesActualLabel()} · la verá el influencer en su cuenta
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setTareas([...tareas, nuevaTareaFila()])}
                    className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold hover:bg-raised"
                  >
                    + Añadir tarea
                  </button>
                </div>

                {tareas.length === 0 ? (
                  <p className="rounded-xl px-3 py-4 text-center text-xs text-ink-muted" style={{ background: "rgb(var(--bg-rgb) / 0.5)" }}>
                    Sin tareas. Añade la lista mensual, por ejemplo "Subir TikTok" con cantidad 10.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {tareas.map((t) => (
                      <div key={t.key} className="flex flex-col gap-2 rounded-xl border border-border p-3 sm:flex-row sm:items-center">
                        <div className="min-w-0 flex-1">
                          <label className="text-2xs font-semibold uppercase tracking-normal text-ink-faint">Descripción</label>
                          <input
                            className="inp mt-1"
                            placeholder="Ej: Subir TikTok"
                            value={t.descripcion}
                            onChange={(e) =>
                              setTareas(tareas.map((x) => (x.key === t.key ? { ...x, descripcion: e.target.value } : x)))
                            }
                          />
                        </div>
                        <div className="w-full sm:w-28">
                          <label className="text-2xs font-semibold uppercase tracking-normal text-ink-faint">Cantidad</label>
                          <input
                            type="number"
                            min={1}
                            className="inp mt-1"
                            value={t.cantidadMeta}
                            onChange={(e) =>
                              setTareas(tareas.map((x) => (x.key === t.key ? { ...x, cantidadMeta: e.target.value } : x)))
                            }
                          />
                        </div>
                        <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                          {t.id && t.cantidadCompletada !== undefined && (
                            <span className="text-xs text-ink-muted">{t.cantidadCompletada} hechas</span>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              if (t.id) setRemovedIds((r) => [...r, t.id!]);
                              setTareas(tareas.filter((x) => x.key !== t.key));
                            }}
                            className="text-xs text-red hover:underline"
                          >
                            Quitar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-border p-4">
                <div className="mb-3">
                  <h4 className="text-sm font-bold">Objetivo del mes</h4>
                  <p className="text-xs text-ink-muted">
                    Meta mensual para {mesActualLabel()} · ej. "Subir 20 videos al mes". El influencer verá un gráfico circular de avance.
                  </p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <div className="min-w-0 flex-1">
                    <label className="text-2xs font-semibold uppercase tracking-normal text-ink-faint">Descripción</label>
                    <input
                      className="inp mt-1.5"
                      placeholder="Ej: Subir videos a TikTok"
                      value={objetivoForm.descripcion}
                      onChange={(e) => setObjetivoForm({ ...objetivoForm, descripcion: e.target.value })}
                    />
                  </div>
                  <div className="w-full sm:w-36">
                    <label className="text-2xs font-semibold uppercase tracking-normal text-ink-faint">Cantidad meta</label>
                    <input
                      type="number"
                      min={1}
                      className="inp mt-1.5"
                      value={objetivoForm.cantidadMeta}
                      onChange={(e) => setObjetivoForm({ ...objetivoForm, cantidadMeta: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-ink hover:bg-raised">
                  Cancelar
                </button>
                <button type="submit" disabled={submitting} className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-bg transition-transform hover:-translate-y-px disabled:opacity-60 disabled:cursor-not-allowed">
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
