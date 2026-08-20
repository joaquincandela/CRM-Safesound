"use client";
import { useState, useEffect } from "react";
import { apiClient, ApiError } from "@/infrastructure/api/ApiClient";

interface ProveedorMini {
  id: string;
  razonSocial: string;
  nombreComercial: string | null;
}

interface OrdenMini {
  id: string;
  numero: string;
  moneda: string;
  total: number;
}

interface ProductoMini {
  id: string;
  sku: string;
  nombre: string;
}

interface LineaRecepcion {
  id: string;
  productoId: string;
  cantidadRecibida: number;
  producto: ProductoMini;
}

interface Recepcion {
  id: string;
  orden: { numero: string; proveedor: { razonSocial: string } };
  fecha: string;
  lineas: Array<{ producto: ProductoMini; cantidadRecibida: number }>;
}

interface Lote {
  id: string;
  producto: ProductoMini;
  cantidad: number;
  costoUnitario: number;
  costoTotal: number;
}

interface Costeo {
  id: string;
  numero: string;
  recepcionId: string;
  ordenId: string;
  proveedorId: string;
  fecha: string;
  moneda: string;
  tipoCambio: number | null;
  costoProductos: number;
  comisionBancaria: number;
  comisionPlataforma: number;
  courierFlete: number;
  seguro: number;
  aduanas: number;
  almacenaje: number;
  transporteLocal: number;
  otros: number;
  comisionBancariaMoneda: string;
  comisionPlataformaMoneda: string;
  courierFleteMoneda: string;
  seguroMoneda: string;
  aduanasMoneda: string;
  almacenajeMoneda: string;
  transporteLocalMoneda: string;
  otrosMoneda: string;
  gastosTotal: number;
  costoTotal: number;
  costoUnitario: number;
  observaciones: string | null;
  estado: "BORRADOR" | "CONFIRMADO";
  createdAt: string;
  recepcion: { id: string; fecha: string; lineas: LineaRecepcion[] };
  orden: OrdenMini;
  proveedor: ProveedorMini;
  usuario: { id: string; nombre: string };
  lotes: Lote[];
}

type GastoKey =
  | "comisionBancaria"
  | "comisionPlataforma"
  | "courierFlete"
  | "seguro"
  | "aduanas"
  | "almacenaje"
  | "transporteLocal"
  | "otros";

const GASTOS: Array<{ key: GastoKey; label: string }> = [
  { key: "comisionBancaria", label: "Comisión bancaria" },
  { key: "comisionPlataforma", label: "Comisión de plataforma" },
  { key: "courierFlete", label: "Courier / flete" },
  { key: "seguro", label: "Seguro" },
  { key: "aduanas", label: "Derechos de aduana" },
  { key: "almacenaje", label: "Almacenaje" },
  { key: "transporteLocal", label: "Transporte local" },
  { key: "otros", label: "Otros gastos" },
];

const MONEDAS = ["PEN", "USD"];

type GastoForm = { monto: string; moneda: string };

type FormData = {
  recepcionId: string;
  fecha: string;
  moneda: string;
  tipoCambio: string;
  gastos: Record<GastoKey, GastoForm>;
  observaciones: string;
};

function emptyForm(): FormData {
  const gastos = {} as Record<GastoKey, GastoForm>;
  const defaultMoneda: Record<GastoKey, string> = {
    comisionBancaria: "PEN",
    comisionPlataforma: "USD",
    courierFlete: "USD",
    seguro: "USD",
    aduanas: "USD",
    almacenaje: "PEN",
    transporteLocal: "PEN",
    otros: "PEN",
  };
  for (const g of GASTOS) gastos[g.key] = { monto: "", moneda: defaultMoneda[g.key] };
  return {
    recepcionId: "",
    fecha: new Date().toISOString().slice(0, 10),
    moneda: "PEN",
    tipoCambio: "",
    gastos,
    observaciones: "",
  };
}

export default function CosteoImportacionPage() {
  const [costeos, setCosteos] = useState<Costeo[]>([]);
  const [recepciones, setRecepciones] = useState<Recepcion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Costeo | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "detail">("list");
  const [selected, setSelected] = useState<Costeo | null>(null);
  const [toast, setToast] = useState<{ type: "ok" | "err"; msg: string } | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm());

  const showToast = (type: "ok" | "err", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchCosteos = async () => {
    try {
      const data = await apiClient.get<Costeo[]>("/costeo-importacion");
      setCosteos(data);
    } catch (error) {
      console.error("Error fetching costeos:", error instanceof ApiError ? error.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  const fetchRecepciones = async () => {
    try {
      const data = await apiClient.get<Recepcion[]>("/recepciones");
      setRecepciones(data);
    } catch (error) {
      console.error("Error fetching recepciones:", error instanceof ApiError ? error.message : "Error desconocido");
    }
  };

  useEffect(() => {
    fetchCosteos();
    fetchRecepciones();
  }, []);

  const sym = (moneda: string) => (moneda === "USD" ? "$" : "S/");
  const money = (n: number | null | undefined, moneda = "PEN") =>
    `${sym(moneda)} ${Number(n ?? 0).toFixed(2)}`;

  const tc = parseFloat(form.tipoCambio) || 0;
  const gastosTotalesForm = GASTOS.reduce((sum, g) => {
    const monto = parseFloat(form.gastos[g.key].monto) || 0;
    const moneda = form.gastos[g.key].moneda;
    if (moneda === form.moneda) return sum + monto;
    if (form.moneda === "PEN") return sum + monto * (tc || 1);
    return sum + (tc ? monto / tc : monto);
  }, 0);
  const recepcionesConCosteo = new Set(costeos.map((c) => c.recepcionId));

  const costoUnitarioLabel = (costeo: Costeo) => {
    if (costeo.estado !== "CONFIRMADO" || costeo.lotes.length === 0) {
      return money(costeo.costoUnitario, costeo.moneda);
    }
    const costos = costeo.lotes.map((l) => Number(l.costoUnitario));
    const min = Math.min(...costos);
    const max = Math.max(...costos);
    return min === max ? money(min, costeo.moneda) : `${money(min, costeo.moneda)} – ${money(max, costeo.moneda)}`;
  };

  const openCrear = () => {
    setEditing(null);
    setForm(emptyForm());
    setShowModal(true);
  };

  const openEditar = (costeo: Costeo) => {
    setEditing(costeo);
    const gastos = {} as Record<GastoKey, GastoForm>;
    for (const g of GASTOS) {
      gastos[g.key] = {
        monto: costeo[g.key].toString(),
        moneda: costeo[(g.key + "Moneda") as keyof Costeo] as string,
      };
    }
    setForm({
      recepcionId: costeo.recepcionId,
      fecha: costeo.fecha.slice(0, 10),
      moneda: costeo.moneda,
      tipoCambio: costeo.tipoCambio ? costeo.tipoCambio.toString() : "",
      gastos,
      observaciones: costeo.observaciones || "",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing && !form.recepcionId) return showToast("err", "Selecciona una recepción");
    setSubmitting(true);

    const gastos = Object.fromEntries(
      GASTOS.map((g) => [
        g.key,
        {
          monto: parseFloat(form.gastos[g.key].monto) || 0,
          moneda: form.gastos[g.key].moneda,
        },
      ]),
    );

    const body = {
      ...(editing ? {} : { recepcionId: form.recepcionId }),
      fecha: form.fecha,
      moneda: form.moneda,
      tipoCambio: form.tipoCambio ? parseFloat(form.tipoCambio) : undefined,
      gastos,
      observaciones: form.observaciones || undefined,
    };

    try {
      if (editing) {
        await apiClient.patch(`/costeo-importacion/${editing.id}`, body);
        showToast("ok", "Costeo actualizado");
      } else {
        await apiClient.post("/costeo-importacion", body);
        showToast("ok", "Costeo creado");
      }
      setShowModal(false);
      setEditing(null);
      setForm(emptyForm());
      fetchCosteos();
    } catch (error) {
      const msg = error instanceof ApiError ? error.message : "Error de conexión al guardar";
      showToast("err", msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmar = async (costeo: Costeo) => {
    if (!confirm(`¿Confirmar el costeo ${costeo.numero}?\nSe generarán los lotes y se actualizará el costo real de los productos.`)) return;
    setConfirmingId(costeo.id);
    try {
      const updated = await apiClient.post<Costeo>(`/costeo-importacion/${costeo.id}/confirmar`);
      showToast("ok", "Costeo confirmado: lotes generados y costos actualizados");
      if (selected?.id === costeo.id) setSelected(updated);
      fetchCosteos();
    } catch (error) {
      const msg = error instanceof ApiError ? error.message : "Error de conexión al confirmar";
      showToast("err", msg);
    } finally {
      setConfirmingId(null);
    }
  };

  const handleEliminar = async (costeo: Costeo) => {
    if (!confirm(`¿Eliminar el costeo ${costeo.numero}?\nLos costos se revierten al costeo anterior o al costo de la orden.`)) return;
    setDeletingId(costeo.id);
    try {
      await apiClient.delete(`/costeo-importacion/${costeo.id}`);
      showToast("ok", "Costeo eliminado");
      if (selected?.id === costeo.id) {
        setSelected(null);
        setViewMode("list");
      }
      fetchCosteos();
    } catch (error) {
      const msg = error instanceof ApiError ? error.message : "Error de conexión al eliminar";
      showToast("err", msg);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return <div className="p-6 text-ink-muted">Cargando costeos...</div>;
  }

  const EstadoBadge = ({ estado }: { estado: Costeo["estado"] }) => (
    <span className={`inline-flex items-center gap-1.5 rounded-pill px-2 py-0.5 text-2xs font-semibold ${
      estado === "CONFIRMADO" ? "bg-green/15 text-green" : "bg-gold/15 text-gold"
    }`}>
      {estado === "CONFIRMADO" ? "Confirmado" : "Borrador"}
    </span>
  );

  if (viewMode === "detail" && selected) {
    return (
      <div className="mx-auto max-w-[1600px] space-y-5 p-4 sm:p-6">
        <header className="flex flex-wrap items-center gap-4">
          <button
            onClick={() => { setViewMode("list"); setSelected(null); }}
            className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-raised"
          >
            ← Volver
          </button>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-display text-2xl font-bold">Costeo {selected.numero}</h1>
              <EstadoBadge estado={selected.estado} />
            </div>
            <p className="text-sm text-ink-muted">
              {new Date(selected.fecha).toLocaleString()} · Por {selected.usuario.nombre} · {selected.moneda}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => openEditar(selected)}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-ink hover:bg-raised"
            >
              Editar
            </button>
            <button
              onClick={() => handleConfirmar(selected)}
              disabled={confirmingId === selected.id}
              className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-bg transition-transform hover:-translate-y-px disabled:opacity-50"
            >
              {confirmingId === selected.id ? "Confirmando..." : "Confirmar costeo"}
            </button>
            <button
              onClick={() => handleEliminar(selected)}
              disabled={deletingId === selected.id}
              className="rounded-lg border border-red/50 px-4 py-2 text-sm font-medium text-red hover:bg-red/15 disabled:opacity-50"
            >
              {deletingId === selected.id ? "Eliminando..." : "Eliminar"}
            </button>
          </div>
        </header>

        <div className="grid gap-5 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-5">
            <div className="card p-5">
              <h2 className="font-semibold mb-4">Resumen de costos</h2>
              <table className="w-full border-collapse text-sm">
                <tbody>
                  <tr className="border-b border-border">
                    <td className="px-4 py-3 text-ink-muted">Costo de productos</td>
                    <td className="px-4 py-3 text-right tabular-nums">{money(selected.costoProductos, selected.moneda)}</td>
                  </tr>
                  {GASTOS.map((g) => (
                    <tr key={g.key} className="border-b border-border">
                      <td className="px-4 py-3 text-ink-muted">{g.label}</td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {money(selected[g.key], selected[(g.key + "Moneda") as keyof Costeo] as string)}
                        <span className="ml-1.5 text-2xs text-ink-faint">{selected[(g.key + "Moneda") as keyof Costeo] as string}</span>
                      </td>
                    </tr>
                  ))}
                  <tr className="border-b border-border">
                    <td className="px-4 py-3 font-medium">Total gastos de importación</td>
                    <td className="px-4 py-3 text-right tabular-nums font-semibold">{money(selected.gastosTotal, selected.moneda)}</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-semibold">Costo total importación</td>
                    <td className="px-4 py-3 text-right tabular-nums font-bold text-gold">{money(selected.costoTotal, selected.moneda)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="card p-5">
              <h2 className="font-semibold mb-1">Lotes generados</h2>
              <p className="mb-4 text-xs text-ink-muted">Costo unitario por producto: es el costo que aparece en el catálogo de Productos.</p>
              {selected.estado === "BORRADOR" ? (
                <p className="text-sm text-ink-muted">Confirma el costeo para generar los lotes por producto.</p>
              ) : (
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="px-4 py-3 text-2xs font-semibold uppercase tracking-normal text-ink-faint">Producto</th>
                      <th className="px-4 py-3 text-2xs font-semibold uppercase tracking-normal text-ink-faint">Cantidad</th>
                      <th className="px-4 py-3 text-2xs font-semibold uppercase tracking-normal text-ink-faint">Costo unitario</th>
                      <th className="px-4 py-3 text-2xs font-semibold uppercase tracking-normal text-ink-faint">Costo total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selected.lotes.map((lote) => (
                      <tr key={lote.id} className="border-b border-border">
                        <td className="px-4 py-3">
                          <div className="font-medium">{lote.producto.nombre}</div>
                          <div className="font-mono text-xs text-ink-muted">{lote.producto.sku}</div>
                        </td>
                        <td className="px-4 py-3 tabular-nums">{lote.cantidad}</td>
                        <td className="px-4 py-3 tabular-nums">{money(lote.costoUnitario, selected.moneda)}</td>
                        <td className="px-4 py-3 tabular-nums font-semibold">{money(lote.costoTotal, selected.moneda)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="card p-5">
              <h2 className="font-semibold mb-4">Productos recibidos</h2>
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="px-4 py-3 text-2xs font-semibold uppercase tracking-normal text-ink-faint">Producto</th>
                    <th className="px-4 py-3 text-2xs font-semibold uppercase tracking-normal text-ink-faint">Cantidad recibida</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.recepcion.lineas.map((linea, i) => (
                    <tr key={linea.id || i} className="border-b border-border">
                      <td className="px-4 py-3">
                        <div className="font-medium">{linea.producto.nombre}</div>
                        <div className="font-mono text-xs text-ink-muted">{linea.producto.sku}</div>
                      </td>
                      <td className="px-4 py-3 tabular-nums font-semibold">{linea.cantidadRecibida}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-5">
            <div className="card p-5">
              <h2 className="font-semibold mb-4">Datos del costeo</h2>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between"><dt className="text-ink-muted">Promedio por unidad</dt><dd className="font-semibold tabular-nums">{money(selected.costoUnitario, selected.moneda)}</dd></div>
                <div className="flex justify-between"><dt className="text-ink-muted">Moneda</dt><dd>{selected.moneda}</dd></div>
                <div className="flex justify-between"><dt className="text-ink-muted">Tipo de cambio</dt><dd className="tabular-nums">{selected.tipoCambio ? Number(selected.tipoCambio).toFixed(3) : "—"}</dd></div>
                <div className="flex justify-between"><dt className="text-ink-muted">Recepción</dt><dd className="font-mono text-xs">{selected.recepcionId.slice(0, 8)}…</dd></div>
              </dl>
            </div>
            <div className="card p-5">
              <h2 className="font-semibold mb-4">Orden de compra</h2>
              <div className="font-display font-bold">{selected.orden.numero}</div>
              <div className="text-sm text-ink-muted mt-1">Total OC: {money(selected.orden.total, selected.orden.moneda)} · {selected.orden.moneda}</div>
            </div>
            <div className="card p-5">
              <h2 className="font-semibold mb-4">Proveedor</h2>
              <div className="font-medium">{selected.proveedor.razonSocial}</div>
            </div>
            {selected.observaciones && (
              <div className="card p-5">
                <h2 className="font-semibold mb-4">Observaciones</h2>
                <p className="text-sm text-ink-muted">{selected.observaciones}</p>
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
          <h1 className="font-display text-2xl font-bold">Costeo de Importación</h1>
          <p className="text-sm text-ink-muted">Calcula el costo real por unidad de cada importación</p>
        </div>
        <button
          onClick={openCrear}
          className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-bg transition-transform hover:-translate-y-px"
        >
          Nuevo Costeo
        </button>
      </header>

      <div className="card overflow-x-auto p-5">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="px-4 py-3 text-2xs font-semibold uppercase tracking-normal text-ink-faint">Número</th>
              <th className="px-4 py-3 text-2xs font-semibold uppercase tracking-normal text-ink-faint">Orden</th>
              <th className="px-4 py-3 text-2xs font-semibold uppercase tracking-normal text-ink-faint">Proveedor</th>
              <th className="px-4 py-3 text-2xs font-semibold uppercase tracking-normal text-ink-faint">Fecha</th>
              <th className="px-4 py-3 text-2xs font-semibold uppercase tracking-normal text-ink-faint">Moneda</th>
              <th className="px-4 py-3 text-2xs font-semibold uppercase tracking-normal text-ink-faint">Costo total</th>
              <th className="px-4 py-3 text-2xs font-semibold uppercase tracking-normal text-ink-faint">Costo unit.</th>
              <th className="px-4 py-3 text-2xs font-semibold uppercase tracking-normal text-ink-faint">Estado</th>
              <th className="px-4 py-3 text-2xs font-semibold uppercase tracking-normal text-ink-faint">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {costeos.map((costeo) => (
              <tr key={costeo.id} className="border-b border-border hover:bg-raised cursor-pointer" onClick={() => { setSelected(costeo); setViewMode("detail"); }}>
                <td className="px-4 py-3 font-display font-bold">{costeo.numero}</td>
                <td className="px-4 py-3">{costeo.orden.numero}</td>
                <td className="px-4 py-3 text-ink-muted">{costeo.proveedor.razonSocial}</td>
                <td className="px-4 py-3 text-xs text-ink-muted">{new Date(costeo.fecha).toLocaleDateString()}</td>
                <td className="px-4 py-3">{costeo.moneda}</td>
                <td className="px-4 py-3 tabular-nums font-semibold">{money(costeo.costoTotal, costeo.moneda)}</td>
                <td className="px-4 py-3 tabular-nums">{costoUnitarioLabel(costeo)}</td>
                <td className="px-4 py-3"><EstadoBadge estado={costeo.estado} /></td>
                <td className="px-4 py-3">
                  <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => openEditar(costeo)}
                      className="rounded border border-border px-2 py-1 text-xs hover:bg-raised"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleConfirmar(costeo)}
                      disabled={confirmingId === costeo.id}
                      className="rounded border border-gold px-2 py-1 text-xs text-gold hover:bg-gold/15 disabled:pointer-events-none disabled:opacity-40"
                    >
                      {confirmingId === costeo.id ? "Confirmando..." : "Confirmar"}
                    </button>
                    <button
                      onClick={() => handleEliminar(costeo)}
                      disabled={deletingId === costeo.id}
                      className="rounded border border-red/50 px-2 py-1 text-xs text-red hover:bg-red/15 disabled:pointer-events-none disabled:opacity-40"
                    >
                      {deletingId === costeo.id ? "Eliminando..." : "Eliminar"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {costeos.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-ink-muted">
                  No hay costeos registrados. Crea uno a partir de una recepción.
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
              <h3 className="font-display text-lg font-bold">
                {editing ? `Editar ${editing.numero}` : "Nuevo Costeo"}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-ink-muted hover:text-ink">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="text-2xs font-semibold uppercase tracking-normal text-ink-faint">Recepción de mercadería</label>
                <select
                  className="inp mt-1.5"
                  value={form.recepcionId}
                  onChange={(e) => setForm({ ...form, recepcionId: e.target.value })}
                  required
                  disabled={!!editing}
                >
                  <option value="">Seleccionar recepción...</option>
                  {recepciones.map((r) => {
                    const usado = recepcionesConCosteo.has(r.id);
                    return (
                      <option key={r.id} value={r.id} disabled={usado}>
                        {r.orden.numero} — {r.orden.proveedor.razonSocial}
                        {usado ? " (ya costeado)" : ""}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="text-2xs font-semibold uppercase tracking-normal text-ink-faint">Fecha</label>
                  <input type="date" className="inp mt-1.5" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} required />
                </div>
                <div>
                  <label className="text-2xs font-semibold uppercase tracking-normal text-ink-faint">Moneda</label>
                  <select className="inp mt-1.5" value={form.moneda} onChange={(e) => setForm({ ...form, moneda: e.target.value })}>
                    {MONEDAS.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-2xs font-semibold uppercase tracking-normal text-ink-faint">Tipo de cambio</label>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    className="inp mt-1.5"
                    value={form.tipoCambio}
                    onChange={(e) => setForm({ ...form, tipoCambio: e.target.value })}
                    placeholder="Solo si moneda ≠ OC"
                  />
                </div>
              </div>

              <div className="border border-border rounded-lg p-4">
                <h4 className="font-semibold mb-3">Gastos de importación</h4>
                <div className="grid grid-cols-2 gap-4">
                  {GASTOS.map((g) => (
                    <div key={g.key}>
                      <label className="text-2xs font-semibold uppercase tracking-normal text-ink-faint">{g.label}</label>
                      <div className="mt-1.5 flex gap-2">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          className="inp flex-1"
                          value={form.gastos[g.key].monto}
                          onChange={(e) => setForm({ ...form, gastos: { ...form.gastos, [g.key]: { ...form.gastos[g.key], monto: e.target.value } } })}
                        />
                        <select
                          className="inp !w-16 shrink-0"
                          value={form.gastos[g.key].moneda}
                          onChange={(e) => setForm({ ...form, gastos: { ...form.gastos, [g.key]: { ...form.gastos[g.key], moneda: e.target.value } } })}
                        >
                          {MONEDAS.map((m) => <option key={m} value={m}>{m}</option>)}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex justify-end">
                  <span className="text-sm text-ink-muted">
                    Total gastos (convertidos): <span className="font-semibold text-ink">{money(gastosTotalesForm, form.moneda)}</span>
                  </span>
                </div>
              </div>

              <div>
                <label className="text-2xs font-semibold uppercase tracking-normal text-ink-faint">Observaciones</label>
                <textarea
                  className="inp mt-1.5"
                  rows={2}
                  value={form.observaciones}
                  onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
                />
              </div>

              <p className="text-xs text-ink-muted">
                Al confirmar el costeo se generan los lotes por producto, se actualiza el costo real en el catálogo y el kardex.
              </p>

              <div className="flex justify-end gap-2.5 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-ink hover:bg-raised">
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-bg transition-transform hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "Guardando..." : editing ? "Guardar cambios" : "Crear costeo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
