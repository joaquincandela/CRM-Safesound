"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { apiClient, ApiError } from "@/infrastructure/api/ApiClient";
import Link from "next/link";
import { ProgressRing } from "@/presentation/components/ui/ProgressRing";
import { useAuth } from "@/presentation/providers/AuthProvider";

interface InfluencerDetalle {
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

interface Objetivo {
  id: string;
  mes: string;
  descripcion: string;
  cantidadMeta: number;
  cantidadCompletada: number;
}

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

const emptyForm = {
  fechaInicio: "",
  seguidores: "0",
  engagement: "0",
  alcance: "0",
  vistas: "0",
  publicaciones: "0",
  clics: "0",
  conversiones: "0",
};

const emptyTarea = { descripcion: "", cantidadMeta: "1" };
const emptyObjetivo = { descripcion: "", cantidadMeta: "20" };

function toMes(iso: string) {
  const d = new Date(iso);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function mesActual() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function InfluencerDetallePage() {
  const { id } = useParams<{ id: string }>();
  const { session } = useAuth();
  const esAdmin = session?.rol === "ADMIN";
  const [inf, setInf] = useState<InfluencerDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [showMetricaModal, setShowMetricaModal] = useState(false);
  const [editingMetrica, setEditingMetrica] = useState<Metricas | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState(emptyForm);

  const [selectedMes, setSelectedMes] = useState(mesActual());
  const [showNuevaTarea, setShowNuevaTarea] = useState(false);
  const [nuevaTarea, setNuevaTarea] = useState(emptyTarea);
  const [editingTareaId, setEditingTareaId] = useState<string | null>(null);
  const [tareaForm, setTareaForm] = useState(emptyTarea);
  const [savingTarea, setSavingTarea] = useState(false);

  const [objetivoForm, setObjetivoForm] = useState(emptyObjetivo);
  const [savingObjetivo, setSavingObjetivo] = useState(false);
  const [showNuevoObjetivo, setShowNuevoObjetivo] = useState(false);

  const fetchInfluencer = async () => {
    try {
      const data = await apiClient.get<InfluencerDetalle>(`/influencers/${id}`);
      setInf(data);
    } catch {
      // empty
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInfluencer();
  }, [id]);

  const openCreateMetrica = () => {
    setEditingMetrica(null);
    setFormData(emptyForm);
    setShowMetricaModal(true);
  };

  const openEditMetrica = (m: Metricas) => {
    setEditingMetrica(m);
    setFormData({
      fechaInicio: m.fechaInicio.split("T")[0],
      seguidores: m.seguidores.toString(),
      engagement: m.engagement.toString(),
      alcance: m.alcance.toString(),
      vistas: m.vistas.toString(),
      publicaciones: m.publicaciones.toString(),
      clics: m.clics.toString(),
      conversiones: m.conversiones.toString(),
    });
    setShowMetricaModal(true);
  };

  const handleSubmitMetrica = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const body = {
        fechaInicio: formData.fechaInicio,
        seguidores: parseInt(formData.seguidores) || 0,
        engagement: parseFloat(formData.engagement) || 0,
        alcance: parseInt(formData.alcance) || 0,
        vistas: parseInt(formData.vistas) || 0,
        publicaciones: parseInt(formData.publicaciones) || 0,
        clics: parseInt(formData.clics) || 0,
        conversiones: parseInt(formData.conversiones) || 0,
      };

      if (editingMetrica) {
        await apiClient.patch(`/influencers/${id}/metricas/${editingMetrica.id}`, body);
      } else {
        await apiClient.post(`/influencers/${id}/metricas`, body);
      }

      setShowMetricaModal(false);
      setEditingMetrica(null);
      setFormData(emptyForm);
      fetchInfluencer();
    } catch (error) {
      alert(error instanceof ApiError ? error.message : "Error al guardar métrica");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCrearTarea = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingTarea(true);
    try {
      await apiClient.post(`/influencers/${id}/tareas`, {
        mes: `${selectedMes}-01`,
        descripcion: nuevaTarea.descripcion,
        cantidadMeta: parseInt(nuevaTarea.cantidadMeta) || 1,
      });
      setNuevaTarea(emptyTarea);
      setShowNuevaTarea(false);
      fetchInfluencer();
    } catch (error) {
      alert(error instanceof ApiError ? error.message : "Error al crear tarea");
    } finally {
      setSavingTarea(false);
    }
  };

  const handleGuardarTarea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTareaId) return;
    setSavingTarea(true);
    try {
      await apiClient.patch(`/influencers/${id}/tareas/${editingTareaId}`, {
        descripcion: tareaForm.descripcion,
        cantidadMeta: parseInt(tareaForm.cantidadMeta) || 1,
      });
      setEditingTareaId(null);
      setTareaForm(emptyTarea);
      fetchInfluencer();
    } catch (error) {
      alert(error instanceof ApiError ? error.message : "Error al actualizar tarea");
    } finally {
      setSavingTarea(false);
    }
  };

  const handleEliminarTarea = async (tareaId: string, descripcion: string) => {
    if (!confirm(`¿Eliminar la tarea "${descripcion}"?`)) return;
    try {
      await apiClient.delete(`/influencers/${id}/tareas/${tareaId}`);
      fetchInfluencer();
    } catch (error) {
      alert(error instanceof ApiError ? error.message : "Error al eliminar tarea");
    }
  };

  const handleGuardarObjetivo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inf) return;
    setSavingObjetivo(true);
    try {
      const objetivo = (inf.objetivos || []).find((o) => toMes(o.mes) === selectedMes);
      const body = {
        mes: `${selectedMes}-01`,
        descripcion: objetivoForm.descripcion,
        cantidadMeta: parseInt(objetivoForm.cantidadMeta) || 1,
      };
      if (objetivo) {
        await apiClient.patch(`/influencers/${id}/objetivo/${objetivo.id}`, body);
      } else {
        await apiClient.post(`/influencers/${id}/objetivo`, body);
      }
      setShowNuevoObjetivo(false);
      setObjetivoForm(emptyObjetivo);
      fetchInfluencer();
    } catch (error) {
      alert(error instanceof ApiError ? error.message : "Error al guardar objetivo");
    } finally {
      setSavingObjetivo(false);
    }
  };

  const handleEliminarObjetivo = async (objetivoId: string, descripcion: string) => {
    if (!confirm(`¿Eliminar el objetivo "${descripcion}"?`)) return;
    try {
      await apiClient.delete(`/influencers/${id}/objetivo/${objetivoId}`);
      setShowNuevoObjetivo(false);
      fetchInfluencer();
    } catch (error) {
      alert(error instanceof ApiError ? error.message : "Error al eliminar objetivo");
    }
  };

  if (loading) return <div className="p-6 text-ink-muted">Cargando...</div>;
  if (!inf) return <div className="p-6 text-ink-muted">Influencer no encontrado</div>;

  const ultima = inf.metricas[0];
  const historial = [...inf.metricas].reverse();
  const tareasMes = (inf.tareas || []).filter((t) => toMes(t.mes) === selectedMes);
  const hechas = tareasMes.reduce((acc, t) => acc + t.cantidadCompletada, 0);
  const totalTareas = tareasMes.reduce((acc, t) => acc + t.cantidadMeta, 0);
  const objetivoMes = (inf.objetivos || []).find((o) => toMes(o.mes) === selectedMes);

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 p-4 sm:p-6">
      <Link href="/influencers" className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">&larr; Volver</Link>

      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">{inf.nombre}</h1>
          <p className="text-sm text-ink-muted">
            {inf.instagram && <span className="mr-4">Instagram: @{inf.instagram}</span>}
            {inf.tiktok && <span className="mr-4">TikTok: @{inf.tiktok}</span>}
            {inf.youtube && <span>YouTube: {inf.youtube}</span>}
            {!inf.instagram && !inf.tiktok && !inf.youtube && <span>Sin redes registradas</span>}
          </p>
          {inf.usuario?.email && <p className="mt-0.5 text-xs text-ink-faint">{inf.usuario.email}</p>}
        </div>
        <div className="flex flex-wrap gap-3">
          <span className={`rounded-pill px-3 py-1 text-xs font-semibold ${inf.activo ? "bg-green/15 text-green" : "bg-red/15 text-red"}`}>
            {inf.activo ? "Activo" : "Inactivo"}
          </span>
          <button onClick={openCreateMetrica} className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-bg transition-transform hover:-translate-y-px">
            + Métrica mensual
          </button>
        </div>
      </header>

      {ultima && (
        <section className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
          <div className="card p-4 text-center">
            <p className="text-2xs font-semibold uppercase tracking-normal text-ink-faint">Seguidores</p>
            <p className="font-display text-2xl font-bold mt-1">{ultima.seguidores.toLocaleString()}</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xs font-semibold uppercase tracking-normal text-ink-faint">Engagement</p>
            <p className="font-display text-2xl font-bold mt-1">{ultima.engagement.toFixed(1)}%</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xs font-semibold uppercase tracking-normal text-ink-faint">Alcance</p>
            <p className="font-display text-2xl font-bold mt-1">{ultima.alcance.toLocaleString()}</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xs font-semibold uppercase tracking-normal text-ink-faint">Vistas</p>
            <p className="font-display text-2xl font-bold mt-1">{ultima.vistas.toLocaleString()}</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xs font-semibold uppercase tracking-normal text-ink-faint">Conversiones</p>
            <p className="font-display text-2xl font-bold mt-1">{ultima.conversiones}</p>
          </div>
        </section>
      )}

      <section className="card p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-bold">Objetivo del mes</h2>
            <p className="text-sm text-ink-muted">Meta mensual · el influencer la ve con gráfico circular en su cuenta</p>
          </div>
          <input type="month" className="inp" value={selectedMes} onChange={(e) => setSelectedMes(e.target.value)} />
        </div>

        {objetivoMes ? (
          <div className="flex flex-wrap items-center gap-6">
            <ProgressRing
              value={objetivoMes.cantidadCompletada}
              max={objetivoMes.cantidadMeta}
              label={`${objetivoMes.cantidadCompletada}/${objetivoMes.cantidadMeta}`}
              sublabel="de la meta"
            />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold">{objetivoMes.descripcion}</div>
              <div className={`mt-1 inline-flex items-center gap-1 rounded-pill px-2 py-0.5 text-2xs font-semibold ${objetivoMes.cantidadCompletada >= objetivoMes.cantidadMeta ? "bg-green/15 text-green" : "bg-red/15 text-red"}`}>
                {objetivoMes.cantidadCompletada >= objetivoMes.cantidadMeta ? "Cumplido" : "En curso"}
              </div>
              {esAdmin && (
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => {
                      setObjetivoForm({ descripcion: objetivoMes.descripcion, cantidadMeta: objetivoMes.cantidadMeta.toString() });
                      setShowNuevoObjetivo(true);
                    }}
                    className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold hover:bg-raised"
                  >
                    Editar
                  </button>
                  <button onClick={() => handleEliminarObjetivo(objetivoMes.id, objetivoMes.descripcion)} className="rounded-lg border border-red px-3 py-1.5 text-xs font-semibold text-red hover:bg-red/15">
                    Eliminar
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-border px-4 py-6 text-center text-sm text-ink-muted">
            No hay objetivo para {selectedMes}. {esAdmin ? "Fija la meta mensual, ej. \"Subir 20 videos\"." : "El admin aún no fija objetivo este mes."}
          </div>
        )}

        {esAdmin && showNuevoObjetivo && (
          <form onSubmit={handleGuardarObjetivo} className="mt-5 grid grid-cols-1 gap-3 rounded-2xl border border-border p-4 sm:grid-cols-[1fr_140px_auto]">
            <div>
              <label className="text-2xs font-semibold uppercase tracking-normal text-ink-faint">Descripción</label>
              <input
                className="inp mt-1.5"
                placeholder="Ej: Subir videos a TikTok"
                value={objetivoForm.descripcion}
                onChange={(e) => setObjetivoForm({ ...objetivoForm, descripcion: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-2xs font-semibold uppercase tracking-normal text-ink-faint">Cantidad meta</label>
              <input
                type="number"
                min={1}
                className="inp mt-1.5"
                value={objetivoForm.cantidadMeta}
                onChange={(e) => setObjetivoForm({ ...objetivoForm, cantidadMeta: e.target.value })}
              />
            </div>
            <div className="flex items-end gap-2">
              <button type="submit" disabled={savingObjetivo} className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-bg disabled:opacity-60">
                {savingObjetivo ? "Guardando..." : "Guardar"}
              </button>
              <button type="button" onClick={() => setShowNuevoObjetivo(false)} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-ink hover:bg-raised">
                Cancelar
              </button>
            </div>
          </form>
        )}
        {esAdmin && !showNuevoObjetivo && !objetivoMes && (
          <button
            onClick={() => {
              setObjetivoForm(emptyObjetivo);
              setShowNuevoObjetivo(true);
            }}
            className="mt-4 rounded-lg border border-border px-4 py-2 text-sm font-semibold hover:bg-raised"
          >
            + Fijar objetivo
          </button>
        )}
      </section>

      <section className="card p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-bold">Tareas del mes</h2>
            <p className="text-sm text-ink-muted">El influencer marca avance desde su cuenta</p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            {esAdmin && (
              <button
                onClick={() => setShowNuevaTarea(!showNuevaTarea)}
                className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-bg transition-transform hover:-translate-y-px"
              >
                + Nueva tarea
              </button>
            )}
          </div>
        </div>

        {esAdmin && showNuevaTarea && (
          <form onSubmit={handleCrearTarea} className="mb-5 grid grid-cols-1 gap-3 rounded-2xl border border-border p-4 sm:grid-cols-[1fr_140px_auto]">
            <div>
              <label className="text-2xs font-semibold uppercase tracking-normal text-ink-faint">Descripción</label>
              <input
                className="inp mt-1.5"
                placeholder="Ej: Subir TikTok sobre producto nuevo"
                value={nuevaTarea.descripcion}
                onChange={(e) => setNuevaTarea({ ...nuevaTarea, descripcion: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-2xs font-semibold uppercase tracking-normal text-ink-faint">Cantidad meta</label>
              <input
                type="number"
                min={1}
                className="inp mt-1.5"
                value={nuevaTarea.cantidadMeta}
                onChange={(e) => setNuevaTarea({ ...nuevaTarea, cantidadMeta: e.target.value })}
              />
            </div>
            <div className="flex items-end gap-2">
              <button type="submit" disabled={savingTarea} className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-bg disabled:opacity-60">
                {savingTarea ? "Guardando..." : "Guardar"}
              </button>
              <button type="button" onClick={() => setShowNuevaTarea(false)} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-ink hover:bg-raised">
                Cancelar
              </button>
            </div>
          </form>
        )}

        {tareasMes.length === 0 ? (
          <div className="rounded-2xl border border-border px-4 py-6 text-center text-sm text-ink-muted">
            No hay tareas para {selectedMes}. {esAdmin ? "Crea la lista mensual para que el influencer la vea." : "El admin aún no asigna tareas este mes."}
          </div>
        ) : (
          <div className="flex flex-wrap items-start gap-6">
            <ProgressRing value={hechas} max={totalTareas} label={`${hechas}/${totalTareas}`} sublabel="tareas" />

            <div className="min-w-0 flex-1 space-y-3">
              {tareasMes.map((t) => {
                const completo = t.cantidadCompletada >= t.cantidadMeta;
                const editing = editingTareaId === t.id;
                return (
                  <div key={t.id} className="rounded-2xl border border-border p-4">
                    {editing ? (
                      <form onSubmit={handleGuardarTarea} className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_140px_auto]">
                        <input
                          className="inp"
                          value={tareaForm.descripcion}
                          onChange={(e) => setTareaForm({ ...tareaForm, descripcion: e.target.value })}
                          required
                        />
                        <input
                          type="number"
                          min={1}
                          className="inp"
                          value={tareaForm.cantidadMeta}
                          onChange={(e) => setTareaForm({ ...tareaForm, cantidadMeta: e.target.value })}
                        />
                        <div className="flex gap-2">
                          <button type="submit" disabled={savingTarea} className="rounded-lg bg-gold px-3 py-2 text-xs font-semibold text-bg disabled:opacity-60">
                            Guardar
                          </button>
                          <button type="button" onClick={() => setEditingTareaId(null)} className="rounded-lg border border-border px-3 py-2 text-xs hover:bg-raised">
                            Cancelar
                          </button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <div className="text-sm font-semibold">{t.descripcion}</div>
                            <div className={`text-xs ${completo ? "text-green" : "text-ink-muted"}`}>
                              {t.cantidadCompletada}/{t.cantidadMeta} · {completo ? "Completada" : "En progreso"}
                            </div>
                          </div>
                          {esAdmin && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setEditingTareaId(t.id);
                                  setTareaForm({ descripcion: t.descripcion, cantidadMeta: t.cantidadMeta.toString() });
                                }}
                                className="rounded border border-border px-2 py-1 text-xs hover:bg-raised"
                              >
                                Editar
                              </button>
                              <button onClick={() => handleEliminarTarea(t.id, t.descripcion)} className="rounded border border-red px-2 py-1 text-xs text-red hover:bg-red/15">
                                Eliminar
                              </button>
                            </div>
                          )}
                        </div>
                        <div className="mt-2.5 h-2 overflow-hidden rounded-full" style={{ background: "rgb(var(--bg-rgb))" }}>
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${Math.min((t.cantidadCompletada / Math.max(t.cantidadMeta, 1)) * 100, 100)}%`,
                              background: completo ? "rgb(var(--green-rgb))" : "rgb(var(--gold-rgb))",
                            }}
                          />
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {historial.length > 0 && (
        <div className="card p-5">
          <h2 className="font-display text-lg font-bold mb-4">Historial mensual</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-3 py-2 text-2xs font-semibold uppercase tracking-normal text-ink-faint">Mes</th>
                  <th className="px-3 py-2 text-2xs font-semibold uppercase tracking-normal text-ink-faint">Seguidores</th>
                  <th className="px-3 py-2 text-2xs font-semibold uppercase tracking-normal text-ink-faint">Engagement</th>
                  <th className="px-3 py-2 text-2xs font-semibold uppercase tracking-normal text-ink-faint">Alcance</th>
                  <th className="px-3 py-2 text-2xs font-semibold uppercase tracking-normal text-ink-faint">Vistas</th>
                  <th className="px-3 py-2 text-2xs font-semibold uppercase tracking-normal text-ink-faint">Publicaciones</th>
                  <th className="px-3 py-2 text-2xs font-semibold uppercase tracking-normal text-ink-faint">Clics</th>
                  <th className="px-3 py-2 text-2xs font-semibold uppercase tracking-normal text-ink-faint">Conv.</th>
                  <th className="px-3 py-2 text-2xs font-semibold uppercase tracking-normal text-ink-faint"></th>
                </tr>
              </thead>
              <tbody>
                {historial.map((m) => (
                  <tr key={m.id} className="border-b border-border hover:bg-raised">
                    <td className="px-3 py-2 text-xs text-ink-muted">{new Date(m.fechaInicio).toLocaleDateString(undefined, { month: "long", year: "numeric" })}</td>
                    <td className="px-3 py-2 tabular-nums">{m.seguidores.toLocaleString()}</td>
                    <td className="px-3 py-2 tabular-nums">{m.engagement.toFixed(1)}%</td>
                    <td className="px-3 py-2 tabular-nums">{m.alcance.toLocaleString()}</td>
                    <td className="px-3 py-2 tabular-nums">{m.vistas.toLocaleString()}</td>
                    <td className="px-3 py-2 tabular-nums">{m.publicaciones}</td>
                    <td className="px-3 py-2 tabular-nums">{m.clics.toLocaleString()}</td>
                    <td className="px-3 py-2 tabular-nums">{m.conversiones}</td>
                    <td className="px-3 py-2">
                      <button onClick={() => openEditMetrica(m)} className="rounded border border-border px-2 py-0.5 text-2xs hover:bg-raised">Editar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {historial.length >= 2 && (
        <div className="card p-5">
          <h2 className="font-display text-lg font-bold mb-4">Evolución de seguidores</h2>
          <div className="flex items-end gap-2" style={{ height: 160 }}>
            {(() => {
              const max = Math.max(...historial.map((m) => m.seguidores), 1);
              return historial.map((m) => (
                <div key={m.id} className="flex flex-1 flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t bg-gold/70 transition-all hover:bg-gold"
                    style={{ height: `${(m.seguidores / max) * 140}px` }}
                    title={`${m.seguidores.toLocaleString()} seguidores`}
                  />
                  <span className="text-3xs text-ink-muted">{new Date(m.fechaInicio).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
                </div>
              ));
            })()}
          </div>
        </div>
      )}

      {showMetricaModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm sm:p-6" onClick={() => setShowMetricaModal(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-card border border-border-strong bg-surface shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h3 className="font-display text-lg font-bold">{editingMetrica ? "Editar" : "Nueva"} métrica mensual</h3>
              <button onClick={() => setShowMetricaModal(false)} className="text-ink-muted hover:text-ink">✕</button>
            </div>
            <form onSubmit={handleSubmitMetrica} className="space-y-4 p-5">
              <div>
                <label className="text-2xs font-semibold uppercase tracking-normal text-ink-faint">Mes</label>
                <input type="date" className="inp mt-1.5" value={formData.fechaInicio} onChange={(e) => setFormData({ ...formData, fechaInicio: e.target.value })} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-2xs font-semibold uppercase tracking-normal text-ink-faint">Seguidores</label>
                  <input type="number" className="inp mt-1.5" value={formData.seguidores} onChange={(e) => setFormData({ ...formData, seguidores: e.target.value })} />
                </div>
                <div>
                  <label className="text-2xs font-semibold uppercase tracking-normal text-ink-faint">Engagement %</label>
                  <input type="number" step="0.1" className="inp mt-1.5" value={formData.engagement} onChange={(e) => setFormData({ ...formData, engagement: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-2xs font-semibold uppercase tracking-normal text-ink-faint">Alcance</label>
                  <input type="number" className="inp mt-1.5" value={formData.alcance} onChange={(e) => setFormData({ ...formData, alcance: e.target.value })} />
                </div>
                <div>
                  <label className="text-2xs font-semibold uppercase tracking-normal text-ink-faint">Vistas</label>
                  <input type="number" className="inp mt-1.5" value={formData.vistas} onChange={(e) => setFormData({ ...formData, vistas: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-2xs font-semibold uppercase tracking-normal text-ink-faint">Publicaciones</label>
                  <input type="number" className="inp mt-1.5" value={formData.publicaciones} onChange={(e) => setFormData({ ...formData, publicaciones: e.target.value })} />
                </div>
                <div>
                  <label className="text-2xs font-semibold uppercase tracking-normal text-ink-faint">Clics</label>
                  <input type="number" className="inp mt-1.5" value={formData.clics} onChange={(e) => setFormData({ ...formData, clics: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-2xs font-semibold uppercase tracking-normal text-ink-faint">Conversiones</label>
                  <input type="number" className="inp mt-1.5" value={formData.conversiones} onChange={(e) => setFormData({ ...formData, conversiones: e.target.value })} />
                </div>
              </div>
              <div className="flex justify-end gap-2.5 pt-4">
                <button type="button" onClick={() => setShowMetricaModal(false)} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-ink hover:bg-raised">Cancelar</button>
                <button type="submit" disabled={submitting} className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-bg disabled:opacity-60">
                  {submitting ? "Guardando..." : editingMetrica ? "Actualizar" : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
