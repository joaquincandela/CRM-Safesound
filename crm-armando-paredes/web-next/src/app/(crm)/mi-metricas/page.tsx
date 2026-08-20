"use client";
import { useEffect, useState } from "react";
import { apiClient } from "@/infrastructure/api/ApiClient";
import { ProgressRing } from "@/presentation/components/ui/ProgressRing";

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

interface InfluencerMi {
  id: string;
  nombre: string;
  instagram: string | null;
  tiktok: string | null;
  youtube: string | null;
  metaPublicaciones: number;
  activo: boolean;
  usuario: { id: string; email: string; activo: boolean } | null;
  metricas: Metricas[];
  tareas: Tarea[];
  objetivos: Objetivo[];
}

function toMes(iso: string) {
  const d = new Date(iso);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function mesActual() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function MiMetricasPage() {
  const [inf, setInf] = useState<InfluencerMi | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchMi = () =>
    apiClient
      .get<InfluencerMi>("/influencers/mi")
      .then(setInf)
      .catch((e) => setError(e instanceof Error ? e.message : "No se pudo cargar tu información"))
      .finally(() => setLoading(false));

  useEffect(() => {
    fetchMi();
  }, []);

  const setProgreso = async (tarea: Tarea, valor: number) => {
    setUpdating(tarea.id);
    try {
      await apiClient.patch(`/influencers/mi/tareas/${tarea.id}`, { cantidadCompletada: valor });
      await fetchMi();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar el avance");
    } finally {
      setUpdating(null);
    }
  };

  const setProgresoObjetivo = async (objetivo: Objetivo, valor: number) => {
    setUpdating(objetivo.id);
    try {
      await apiClient.patch(`/influencers/mi/objetivo/${objetivo.id}`, { cantidadCompletada: valor });
      await fetchMi();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar el avance del objetivo");
    } finally {
      setUpdating(null);
    }
  };

  if (loading) return <div className="p-6 text-ink-muted">Cargando...</div>;

  if (error || !inf) {
    return (
      <div className="mx-auto max-w-[1600px] space-y-5 p-4 sm:p-6">
        <header>
          <h1 className="font-display text-2xl font-bold">Mis Métricas</h1>
          <p className="text-sm text-ink-muted">{error ?? "No se encontró tu perfil de influencer."}</p>
        </header>
      </div>
    );
  }

  const ultima = inf.metricas[0];
  const historial = [...inf.metricas].reverse();
  const tareasMes = (inf.tareas || []).filter((t) => toMes(t.mes) === mesActual());
  const objetivoMes = (inf.objetivos || []).find((o) => toMes(o.mes) === mesActual());

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 p-4 sm:p-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Mis Métricas</h1>
          <p className="text-sm text-ink-muted">
            {inf.instagram && <span className="mr-4">Instagram: @{inf.instagram}</span>}
            {inf.tiktok && <span className="mr-4">TikTok: @{inf.tiktok}</span>}
            {inf.youtube && <span>YouTube: {inf.youtube}</span>}
            {!inf.instagram && !inf.tiktok && !inf.youtube && <span>Sin redes registradas</span>}
          </p>
        </div>
        <span className={`rounded-pill px-3 py-1 text-xs font-semibold ${inf.activo ? "bg-green/15 text-green" : "bg-red/15 text-red"}`}>
          {inf.activo ? "Activo" : "Inactivo"}
        </span>
      </header>

      <section className="card p-5">
        <div className="mb-4">
          <h2 className="font-display text-lg font-bold">Mi objetivo del mes</h2>
          <p className="text-sm text-ink-muted">Meta mensual fijada por tu equipo de marketing</p>
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
              <div className={`mt-1 inline-flex items-center rounded-pill px-2 py-0.5 text-2xs font-semibold ${objetivoMes.cantidadCompletada >= objetivoMes.cantidadMeta ? "bg-green/15 text-green" : "bg-red/15 text-red"}`}>
                {objetivoMes.cantidadCompletada >= objetivoMes.cantidadMeta ? "¡Meta cumplida!" : "En curso"}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  onClick={() => setProgresoObjetivo(objetivoMes, objetivoMes.cantidadCompletada - 1)}
                  disabled={updating === objetivoMes.id || objetivoMes.cantidadCompletada <= 0}
                  className="grid h-9 w-9 place-items-center rounded-lg border border-border text-lg font-bold text-ink hover:bg-raised disabled:opacity-40"
                  title="Restar uno"
                >
                  −
                </button>
                <button
                  onClick={() => setProgresoObjetivo(objetivoMes, objetivoMes.cantidadCompletada + 1)}
                  disabled={updating === objetivoMes.id || objetivoMes.cantidadCompletada >= objetivoMes.cantidadMeta}
                  className="grid h-9 w-9 place-items-center rounded-lg bg-gold text-lg font-bold text-bg disabled:opacity-40"
                  title="Sumar uno (acabo de subir uno)"
                >
                  +
                </button>
                {objetivoMes.cantidadCompletada < objetivoMes.cantidadMeta && (
                  <button
                    onClick={() => setProgresoObjetivo(objetivoMes, objetivoMes.cantidadMeta)}
                    disabled={updating === objetivoMes.id}
                    className="rounded-lg border border-green px-3 py-2 text-xs font-semibold text-green hover:bg-green/15 disabled:opacity-40"
                  >
                    ✓ Completar objetivo
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-border px-4 py-6 text-center text-sm text-ink-muted">
            Aún no tienes objetivo este mes. Tu equipo de marketing lo fijará (ej. subir 20 videos).
          </div>
        )}
      </section>

      <section className="card p-5">
        <div className="mb-4">
          <h2 className="font-display text-lg font-bold">Mis tareas del mes</h2>
          <p className="text-sm text-ink-muted">Marca cada publicación o actividad que ya realizaste</p>
        </div>

        {tareasMes.length === 0 ? (
          <div className="rounded-2xl border border-border px-4 py-6 text-center text-sm text-ink-muted">
            No tienes tareas asignadas este mes. Tu equipo de marketing te asignará la lista.
          </div>
        ) : (
          <div className="flex flex-wrap items-start gap-6">
            <div className="min-w-0 flex-1 space-y-3">
              {tareasMes.map((t) => {
                const completo = t.cantidadCompletada >= t.cantidadMeta;
                const pct = Math.min((t.cantidadCompletada / Math.max(t.cantidadMeta, 1)) * 100, 100);
                return (
                  <div key={t.id} className="rounded-2xl border border-border p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="text-sm font-semibold">{t.descripcion}</div>
                        <div className={`text-xs ${completo ? "text-green" : "text-ink-muted"}`}>
                          {t.cantidadCompletada}/{t.cantidadMeta} · {completo ? "Completada" : "En progreso"}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setProgreso(t, t.cantidadCompletada - 1)}
                          disabled={updating === t.id || t.cantidadCompletada <= 0}
                          className="grid h-9 w-9 place-items-center rounded-lg border border-border text-lg font-bold text-ink hover:bg-raised disabled:opacity-40"
                          title="Restar uno"
                        >
                          −
                        </button>
                        <button
                          onClick={() => setProgreso(t, t.cantidadCompletada + 1)}
                          disabled={updating === t.id || completo}
                          className="grid h-9 w-9 place-items-center rounded-lg bg-gold text-lg font-bold text-bg disabled:opacity-40"
                          title="Sumar uno (ya subí uno)"
                        >
                          +
                        </button>
                        {!completo && (
                          <button
                            onClick={() => setProgreso(t, t.cantidadMeta)}
                            disabled={updating === t.id}
                            className="rounded-lg border border-green px-3 py-2 text-xs font-semibold text-green hover:bg-green/15 disabled:opacity-40"
                          >
                            ✓ Completar
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="mt-2.5 h-2 overflow-hidden rounded-full" style={{ background: "rgb(var(--bg-rgb))" }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${pct}%`,
                          background: completo ? "rgb(var(--green-rgb))" : "rgb(var(--gold-rgb))",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {ultima ? (
        <>
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="card p-8 text-center">
          <p className="text-sm text-ink-muted">
            Todavía no tienes métricas registradas. Tu equipo de marketing las cargará mes a mes.
          </p>
        </div>
      )}
    </div>
  );
}
