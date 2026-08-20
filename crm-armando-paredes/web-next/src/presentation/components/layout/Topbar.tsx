"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { IconMoon, IconSearch, IconSun } from "@/presentation/components/ui/icons";
import { SidebarMenuButton } from "./Sidebar";
import { usePrefs, type Currency } from "@/presentation/providers/PrefsProvider";
import { apiClient, ApiError } from "@/infrastructure/api/ApiClient";

interface ResultadoBusqueda {
  id: string;
  nombre: string;
  codigo: string;
  detalle: string;
  estado?: string;
  total?: number;
}

type GrupoBusqueda = {
  clave: "productos" | "clientes" | "pedidos" | "proveedores";
  titulo: string;
  items: ResultadoBusqueda[];
};

const GRUPOS: GrupoBusqueda[] = [
  { clave: "productos", titulo: "Productos", items: [] },
  { clave: "clientes", titulo: "Clientes", items: [] },
  { clave: "pedidos", titulo: "Pedidos", items: [] },
  { clave: "proveedores", titulo: "Proveedores", items: [] },
];

function destino(grupo: string, item: ResultadoBusqueda): string {
  switch (grupo) {
    case "productos":
      return `/productos?q=${encodeURIComponent(item.codigo || item.nombre)}`;
    case "clientes":
      return `/pedidos?q=${encodeURIComponent(item.nombre)}`;
    case "pedidos":
      return `/pedidos?q=${encodeURIComponent(item.nombre)}`;
    default:
      return `/proveedores?q=${encodeURIComponent(item.nombre)}`;
  }
}

export function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { theme, toggleTheme, currency, setCurrency, fx } = usePrefs();
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [grupos, setGrupos] = useState<GrupoBusqueda[]>([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [active, setActive] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  const totalItems = grupos.reduce((acc, g) => acc + g.items.length, 0);

  const buscar = useCallback(async (termino: string) => {
    const t = termino.trim();
    if (t.length === 0) {
      setGrupos([]);
      return;
    }
    setBusy(true);
    try {
      const data = await apiClient.get<Record<string, ResultadoBusqueda[]>>(`/buscar?q=${encodeURIComponent(t)}`);
      setGrupos(
        GRUPOS.map((g) => ({
          ...g,
          items: data[g.clave] ?? [],
        })),
      );
    } catch (e) {
      setGrupos([]);
      if (!(e instanceof ApiError && e.status === 401)) console.error("Error en búsqueda:", e);
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim().length > 0) {
        buscar(query);
      } else {
        setGrupos([]);
        setBusy(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [query, buscar]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const flatItems = grupos.flatMap((g) => g.items.map((item) => ({ grupo: g.clave, item })));

  const navegar = (grupo: string, item: ResultadoBusqueda) => {
    setOpen(false);
    setQuery("");
    router.push(destino(grupo, item));
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => (a + 1) % Math.max(totalItems, 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (a - 1 + Math.max(totalItems, 1)) % Math.max(totalItems, 1));
    } else if (e.key === "Enter") {
      if (flatItems[active]) {
        navegar(flatItems[active].grupo, flatItems[active].item);
      } else if (flatItems[0]) {
        navegar(flatItems[0].grupo, flatItems[0].item);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const mostrarGrupos = grupos.filter((g) => g.items.length > 0);

  return (
    <header
      className="flex h-16 shrink-0 items-center gap-3 px-4 backdrop-blur sm:h-20 sm:px-6"
      style={{ borderBottom: "1px solid var(--border)", backgroundColor: "rgb(var(--bg-rgb) / 0.84)" }}
    >
      <SidebarMenuButton onClick={onMenuClick} />

      <div className="hidden min-w-0 sm:block">
        <div className="text-[11px] uppercase tracking-[0.24em]" style={{ color: "rgb(var(--ink-faint-rgb))" }}>
          SafeSound
        </div>
        <h1 className="truncate text-lg font-semibold" style={{ color: "rgb(var(--ink-rgb))" }}>
          Centro de operaciones
        </h1>
      </div>

      <div ref={boxRef} className="relative ml-1 hidden h-11 w-full max-w-xl md:block">
        <label
          className="flex h-full w-full items-center gap-3 rounded-2xl px-4"
          style={{ border: "1px solid var(--border)", background: "rgb(var(--surface-rgb))" }}
        >
          <IconSearch style={{ color: "rgb(var(--ink-faint-rgb))" }} width={16} height={16} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
              setActive(-1);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
            placeholder="Buscar producto, cliente, pedido o proveedor"
            className="w-full bg-transparent text-sm focus:outline-none"
            style={{ color: "rgb(var(--ink-rgb))" }}
            autoComplete="off"
          />
          {busy && <span className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full" style={{ border: "2px solid rgb(var(--ink-faint-rgb) / 0.4)", borderTopColor: "rgb(var(--gold-rgb))" }} />}
          {!busy && query && (
            <button
              onClick={() => { setQuery(""); setOpen(false); setGrupos([]); }}
              className="shrink-0 text-ink-muted hover:text-ink"
              aria-label="Limpiar búsqueda"
            >
              ✕
            </button>
          )}
        </label>

        {open && query.trim() && (
          <div
            className="absolute top-[calc(100%+8px)] left-0 right-0 z-50 max-h-[min(60vh,480px)] overflow-y-auto rounded-2xl border bg-surface p-2 shadow-2xl"
            style={{ borderColor: "var(--border-strong)" }}
          >
            {busy && totalItems === 0 && (
              <div className="px-3 py-4 text-center text-sm text-ink-muted">Buscando…</div>
            )}
            {!busy && totalItems === 0 && (
              <div className="px-3 py-4 text-center text-sm text-ink-muted">
                Sin resultados para «{query.trim()}»
              </div>
            )}
            {mostrarGrupos.map((g, gi) => (
              <div key={g.clave}>
                <div className="px-3 pb-1 pt-2.5 text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: "rgb(var(--ink-faint-rgb))" }}>
                  {g.titulo}
                </div>
                {g.items.map((item, ii) => {
                  const idx = grupos.slice(0, gi).reduce((a, x) => a + x.items.length, 0) + ii;
                  return (
                    <button
                      key={item.id}
                      onClick={() => navegar(g.clave, item)}
                      onMouseEnter={() => setActive(idx)}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors"
                      style={idx === active ? { background: "rgb(var(--gold-rgb) / 0.12)" } : undefined}
                    >
                      <span
                        className="w-20 shrink-0 rounded-pill py-0.5 text-center text-[10px] font-semibold uppercase"
                        style={{ background: "rgb(var(--bg-rgb) / 0.6)", color: "rgb(var(--ink-muted-rgb))" }}
                      >
                        {g.titulo.slice(0, -1)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium" style={{ color: "rgb(var(--ink-rgb))" }}>
                          {item.nombre}
                          {item.codigo && <span className="ml-1.5 font-mono text-2xs opacity-60">{item.codigo}</span>}
                        </span>
                        {item.detalle && (
                          <span className="block truncate text-xs" style={{ color: "rgb(var(--ink-faint-rgb))" }}>
                            {item.detalle}
                            {item.estado ? ` · ${item.estado}` : ""}
                          </span>
                        )}
                      </span>
                      {item.total !== undefined && (
                        <span className="shrink-0 text-xs font-semibold tabular-nums" style={{ color: "rgb(var(--ink-muted-rgb))" }}>
                          S/ {item.total.toFixed(2)}
                        </span>
                      )}
                      <span className="text-ink-faint">→</span>
                    </button>
                  );
                })}
              </div>
            ))}
            {totalItems > 0 && (
              <div className="border-t px-3 py-2 text-[11px] text-ink-faint" style={{ borderColor: "var(--border)" }}>
                ↑↓ navegar · Enter abrir · Esc cerrar
              </div>
            )}
          </div>
        )}
      </div>

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <div
          className="hidden items-center gap-2 rounded-2xl px-3 py-2.5 lg:flex"
          style={{ border: "1px solid var(--border)", background: "rgb(var(--surface-rgb))" }}
        >
          <span className="h-2 w-2 rounded-full animate-pulse2" style={{ background: "rgb(var(--green-rgb))" }} />
          <span className="text-xs font-medium" style={{ color: "rgb(var(--ink-faint-rgb))" }}>
            USD/PEN
          </span>
          <span className="text-sm font-semibold tabular-nums" style={{ color: "rgb(var(--ink-rgb))" }}>
            {fx.toFixed(3)}
          </span>
        </div>

        <div className="flex items-center gap-0.5 rounded-2xl p-1" style={{ border: "1px solid var(--border)", background: "rgb(var(--surface-rgb))" }}>
          {(["PEN", "USD"] as Currency[]).map((code) => (
            <button
              key={code}
              onClick={() => setCurrency(code)}
              className="rounded-xl px-2.5 py-1.5 text-xs font-semibold transition-colors sm:px-3"
              style={
                currency === code
                  ? { background: "rgb(var(--gold-rgb))", color: "rgb(var(--bg-rgb))" }
                  : { color: "rgb(var(--ink-muted-rgb))" }
              }
            >
              {code === "PEN" ? "S/" : "$"}
            </button>
          ))}
        </div>

        <button
          onClick={toggleTheme}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl"
          style={{ border: "1px solid var(--border)", background: "rgb(var(--surface-rgb))", color: "rgb(var(--ink-muted-rgb))" }}
          title={theme === "dark" ? "Modo claro" : "Modo oscuro"}
        >
          {theme === "dark" ? <IconSun width={17} height={17} /> : <IconMoon width={17} height={17} />}
        </button>
      </div>
    </header>
  );
}
