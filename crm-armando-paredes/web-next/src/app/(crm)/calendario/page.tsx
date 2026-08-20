"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { apiClient, ApiError } from "@/infrastructure/api/ApiClient";
import { useAuth } from "@/presentation/providers/AuthProvider";
import { ProgressRing } from "@/presentation/components/ui/ProgressRing";

interface TareaCal {
  id: string;
  titulo: string;
  descripcion: string | null;
  fecha: string;
  hora: string | null;
  completada: boolean;
}

const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

function dayKey(iso: string) {
  const d = new Date(iso);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

function hoyKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function mesActual() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function labelMes(month: string) {
  const [y, m] = month.split("-").map(Number);
  return `${MESES[m - 1]} ${y}`;
}

const emptyForm = { titulo: "", hora: "", descripcion: "" };

export default function CalendarioPage() {
  const { session } = useAuth();
  const esInfluencer = session?.rol === "INFLUENCER";
  const [month, setMonth] = useState(mesActual());
  const [tareas, setTareas] = useState<TareaCal[]>([]);
  const [meta, setMeta] = useState<{ descripcion: string; cantidadCompletada: number; cantidadMeta: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalDay, setModalDay] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  const showToast = useCallback((type: "ok" | "err", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const fetchTareas = useCallback(async () => {
    const [y, m] = month.split("-").map(Number);
    const ultimoDia = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const desde = `${month}-01`;
    const hasta = `${month}-${String(ultimoDia).padStart(2, "0")}`;
    try {
      const data = await apiClient.get<TareaCal[]>(`/calendario?desde=${desde}&hasta=${hasta}`);
      setTareas(data);
    } catch (e) {
      showToast("err", e instanceof ApiError ? e.message : "No se pudo cargar el calendario");
    } finally {
      setLoading(false);
    }
  }, [month, showToast]);

  const fetchMeta = useCallback(async () => {
    if (!esInfluencer) return;
    try {
      const data = await apiClient.get<{
        objetivos: Array<{ mes: string; descripcion: string; cantidadMeta: number; cantidadCompletada: number }>;
      }>("/influencers/mi");
      const obj = (data.objetivos || []).find((o) => o.mes.slice(0, 7) === mesActual());
      setMeta(
        obj
          ? { descripcion: obj.descripcion, cantidadCompletada: obj.cantidadCompletada, cantidadMeta: obj.cantidadMeta }
          : null,
      );
    } catch {
      setMeta(null);
    }
  }, [esInfluencer]);

  useEffect(() => {
    setLoading(true);
    fetchTareas();
    fetchMeta();
  }, [fetchTareas, fetchMeta]);

  const cells = useMemo(() => {
    const [y, m] = month.split("-").map(Number);
    const first = new Date(Date.UTC(y, m - 1, 1));
    const offset = (first.getUTCDay() + 6) % 7; // semana inicia en lunes
    const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const prevDays = new Date(Date.UTC(y, m - 1, 0)).getUTCDate();
    const totalCells = Math.ceil((offset + daysInMonth) / 7) * 7;

    const list: Array<{ key: string; day: number; current: boolean; iso: string }> = [];
    for (let i = 0; i < totalCells; i++) {
      const idx = i - offset;
      if (idx < 0) {
        const d = prevDays + idx + 1;
        const iso = `${y}-${String(m - 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        list.push({ key: iso, day: d, current: false, iso });
      } else if (idx >= daysInMonth) {
        const d = idx - daysInMonth + 1;
        const iso = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        list.push({ key: iso, day: d, current: false, iso });
      } else {
        const d = idx + 1;
        const iso = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        list.push({ key: iso, day: d, current: true, iso });
      }
    }
    return list;
  }, [month]);

  const tareasPorDia = useMemo(() => {
    const map = new Map<string, TareaCal[]>();
    for (const t of tareas) {
      const k = dayKey(t.fecha);
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(t);
    }
    for (const arr of map.values()) arr.sort((a, b) => (a.hora || "").localeCompare(b.hora || ""));
    return map;
  }, [tareas]);

  const stats = useMemo(() => {
    const pendientes = tareas.filter((t) => !t.completada).length;
    const completadas = tareas.filter((t) => t.completada).length;
    const hoy = hoyKey();
    const hoyPendientes = (tareasPorDia.get(hoy) || []).filter((t) => !t.completada).length;
    return { pendientes, completadas, hoyPendientes };
  }, [tareas, tareasPorDia]);

  const cambiarMes = (delta: number) => {
    const [y, m] = month.split("-").map(Number);
    const d = new Date(Date.UTC(y, m - 1, 1));
    d.setUTCMonth(d.getUTCMonth() + delta);
    setMonth(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`);
  };

  const toggleTarea = async (t: TareaCal) => {
    try {
      await apiClient.patch(`/calendario/${t.id}`, { completada: !t.completada });
      fetchTareas();
      fetchMeta();
    } catch (e) {
      showToast("err", e instanceof ApiError ? e.message : "No se pudo actualizar la tarea");
    }
  };

  const abrirDia = (iso: string) => {
    setModalDay(iso);
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalDay) return;
    if (form.titulo.trim() === "") return;
    setSaving(true);
    try {
      const body = {
        titulo: form.titulo,
        hora: form.hora || null,
        descripcion: form.descripcion,
        fecha: modalDay,
      };
      if (editingId) {
        await apiClient.patch(`/calendario/${editingId}`, body);
      } else {
        await apiClient.post("/calendario", body);
      }
      setForm(emptyForm);
      setEditingId(null);
      fetchTareas();
    } catch (e) {
      showToast("err", e instanceof ApiError ? e.message : "No se pudo guardar la tarea");
    } finally {
      setSaving(false);
    }
  };

  const eliminarTarea = async (id: string) => {
    if (!confirm("¿Eliminar esta tarea?")) return;
    try {
      await apiClient.delete(`/calendario/${id}`);
      fetchTareas();
    } catch (e) {
      showToast("err", e instanceof ApiError ? e.message : "No se pudo eliminar la tarea");
    }
  };

  const editarTarea = (t: TareaCal) => {
    setEditingId(t.id);
    setForm({ titulo: t.titulo, hora: t.hora || "", descripcion: t.descripcion || "" });
  };

  const tareasDelDia = modalDay ? tareasPorDia.get(modalDay) || [] : [];

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
          <h1 className="font-display text-2xl font-bold">Calendario</h1>
          <p className="text-sm text-ink-muted">Organiza tus tareas y pendientes por día</p>
        </div>
        <div className="flex flex-wrap gap-3 text-center">
          <div className="card px-4 py-2">
            <div className="text-2xs font-semibold uppercase tracking-normal text-ink-faint">Pendientes</div>
            <div className="font-display text-xl font-bold text-red">{stats.pendientes}</div>
          </div>
          <div className="card px-4 py-2">
            <div className="text-2xs font-semibold uppercase tracking-normal text-ink-faint">Completadas</div>
            <div className="font-display text-xl font-bold text-green">{stats.completadas}</div>
          </div>
          <div className="card px-4 py-2">
            <div className="text-2xs font-semibold uppercase tracking-normal text-ink-faint">Hoy sin hacer</div>
            <div className="font-display text-xl font-bold text-gold">{stats.hoyPendientes}</div>
          </div>
        </div>
      </header>

      {esInfluencer && (
        <section className="card p-5">
          <div className="mb-4">
            <h2 className="font-display text-lg font-bold">Mi meta del mes</h2>
            <p className="text-sm text-ink-muted">Cada tarea del calendario que completes suma a tu objetivo</p>
          </div>
          {meta ? (
            <div className="flex flex-wrap items-center gap-6">
              <ProgressRing
                value={meta.cantidadCompletada}
                max={meta.cantidadMeta}
                label={`${meta.cantidadCompletada}/${meta.cantidadMeta}`}
                sublabel="de la meta"
              />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold">{meta.descripcion}</div>
                <div className={`mt-1 inline-flex items-center rounded-pill px-2 py-0.5 text-2xs font-semibold ${meta.cantidadCompletada >= meta.cantidadMeta ? "bg-green/15 text-green" : "bg-red/15 text-red"}`}>
                  {meta.cantidadCompletada >= meta.cantidadMeta ? "¡Meta cumplida!" : "En curso"}
                </div>
                <p className="mt-2 text-xs text-ink-muted">
                  Marca una tarea como completada (✓) para sumar 1 a tu meta; desmárcala para restar.
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-border px-4 py-6 text-center text-sm text-ink-muted">
              Aún no tienes una meta fijada este mes. Tu equipo de marketing la definirá.
            </div>
          )}
        </section>
      )}

      <section className="card p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button onClick={() => cambiarMes(-1)} className="grid h-9 w-9 place-items-center rounded-lg border border-border hover:bg-raised" aria-label="Mes anterior">
              ←
            </button>
            <h2 className="font-display text-xl font-bold min-w-[140px] text-center">{labelMes(month)}</h2>
            <button onClick={() => cambiarMes(1)} className="grid h-9 w-9 place-items-center rounded-lg border border-border hover:bg-raised" aria-label="Mes siguiente">
              →
            </button>
          </div>
          <button onClick={() => setMonth(mesActual())} className="rounded-lg border border-border px-4 py-2 text-sm font-semibold hover:bg-raised">
            Hoy
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="skeleton h-24 rounded-2xl" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-7 gap-2">
              {DIAS.map((d) => (
                <div key={d} className="pb-2 text-center text-2xs font-semibold uppercase tracking-normal text-ink-faint">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {cells.map((c) => {
                const dayTareas = tareasPorDia.get(c.iso) || [];
                const completas = dayTareas.filter((t) => t.completada).length;
                const esHoy = c.iso === hoyKey();
                return (
                  <button
                    key={c.key}
                    onClick={() => abrirDia(c.iso)}
                    className={`flex min-h-24 flex-col rounded-2xl border p-2 text-left transition-colors ${
                      c.current ? "border-border hover:bg-raised" : "border-transparent opacity-45 hover:bg-raised"
                    } ${esHoy ? "ring-2 ring-gold/60" : ""}`}
                    style={{ background: "rgb(var(--surface-rgb))" }}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold ${esHoy ? "text-gold" : "text-ink-muted"}`}>{c.day}</span>
                      {dayTareas.length > 0 && (
                        <span className={`rounded-pill px-1.5 py-0.5 text-2xs font-semibold ${completas === dayTareas.length ? "bg-green/15 text-green" : "bg-gold/20 text-gold"}`}>
                          {completas}/{dayTareas.length}
                        </span>
                      )}
                    </div>
                    <div className="mt-1.5 space-y-1 overflow-hidden">
                      {dayTareas.slice(0, 3).map((t) => (
                        <div key={t.id} className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={t.completada}
                            onChange={() => toggleTarea(t)}
                            className="h-3.5 w-3.5 shrink-0 accent-green"
                            title={t.completada ? "Marcar como pendiente" : "Marcar como completada"}
                          />
                          <span className={`truncate text-xs ${t.completada ? "text-ink-muted line-through" : "text-ink"}`}>
                            {t.hora && <span className="font-mono opacity-60">{t.hora} </span>}
                            {t.titulo}
                          </span>
                        </div>
                      ))}
                      {dayTareas.length > 3 && <div className="text-2xs text-ink-faint">+{dayTareas.length - 3} más</div>}
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </section>

      {modalDay && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm sm:p-6" onClick={() => setModalDay(null)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-card border border-border-strong bg-surface shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h3 className="font-display text-lg font-bold">
                {new Date(`${modalDay}T00:00:00`).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}
              </h3>
              <button onClick={() => setModalDay(null)} className="text-ink-muted hover:text-ink">✕</button>
            </div>

            <div className="space-y-4 p-5">
              <form onSubmit={handleGuardar} className="space-y-3 rounded-2xl border border-border p-4">
                <div className="flex flex-col gap-3 sm:flex-row">
                  <div className="min-w-0 flex-1">
                    <label className="text-2xs font-semibold uppercase tracking-normal text-ink-faint">
                      {editingId ? "Editar tarea" : "Nueva tarea"}
                    </label>
                    <input
                      className="inp mt-1.5"
                      placeholder="Ej: Llamar al proveedor"
                      value={form.titulo}
                      onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                      required
                    />
                  </div>
                  <div className="w-full sm:w-32">
                    <label className="text-2xs font-semibold uppercase tracking-normal text-ink-faint">Hora</label>
                    <input
                      type="time"
                      className="inp mt-1.5"
                      value={form.hora}
                      onChange={(e) => setForm({ ...form, hora: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-2xs font-semibold uppercase tracking-normal text-ink-faint">Detalle <span className="normal-case opacity-70">(opcional)</span></label>
                  <textarea
                    className="inp mt-1.5"
                    rows={2}
                    value={form.descripcion}
                    onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  {editingId && (
                    <button type="button" onClick={() => { setEditingId(null); setForm(emptyForm); }} className="rounded-lg border border-border px-3 py-2 text-xs font-medium hover:bg-raised">
                      Cancelar edición
                    </button>
                  )}
                  <button type="submit" disabled={saving} className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-bg disabled:opacity-60">
                    {saving ? "Guardando..." : editingId ? "Actualizar" : "Añadir"}
                  </button>
                </div>
              </form>

              {tareasDelDia.length === 0 ? (
                <p className="rounded-xl px-3 py-5 text-center text-sm text-ink-muted" style={{ background: "rgb(var(--bg-rgb) / 0.5)" }}>
                  Sin tareas para este día. Añade la primera arriba.
                </p>
              ) : (
                <div className="space-y-2">
                  {tareasDelDia.map((t) => (
                    <div key={t.id} className={`flex items-start gap-3 rounded-2xl border border-border p-3 ${t.completada ? "opacity-60" : ""}`}>
                      <input
                        type="checkbox"
                        checked={t.completada}
                        onChange={() => toggleTarea(t)}
                        className="mt-1 h-4 w-4 accent-green"
                      />
                      <div className="min-w-0 flex-1">
                        <div className={`text-sm font-semibold ${t.completada ? "line-through" : ""}`}>
                          {t.hora && <span className="mr-1 font-mono text-xs text-ink-muted">{t.hora}</span>}
                          {t.titulo}
                        </div>
                        {t.descripcion && <div className="text-xs text-ink-muted">{t.descripcion}</div>}
                      </div>
                      <div className="flex gap-1.5">
                        <button onClick={() => editarTarea(t)} className="rounded border border-border px-2 py-1 text-2xs hover:bg-raised">Editar</button>
                        <button onClick={() => eliminarTarea(t.id)} className="rounded border border-red px-2 py-1 text-2xs text-red hover:bg-red/15">Eliminar</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
