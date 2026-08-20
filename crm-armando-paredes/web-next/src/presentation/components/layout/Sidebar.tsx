"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ComponentType, SVGProps } from "react";
import {
  IconCalendar,
  IconCoin,
  IconDashboard,
  IconInfluencer,
  IconInventario,
  IconLogout,
  IconOrders,
  IconProducts,
  IconReceipt,
  IconSettings,
  IconTags,
  IconTruck,
  IconMenu,
  IconClose,
  IconCosteo,
  IconSimulador,
} from "@/presentation/components/ui/icons";
import { useAuth } from "@/presentation/providers/AuthProvider";

type Item = { to: string; label: string; icon: ComponentType<SVGProps<SVGSVGElement>>; roles?: string[] };

const ROLES_NEGOCIO = ["ADMIN", "VENTAS", "INVENTARIO", "OPERACIONES"];

const NAV: Item[] = [
  { to: "/dashboard", label: "Dashboard", icon: IconDashboard, roles: ROLES_NEGOCIO },
  { to: "/productos", label: "Productos", icon: IconProducts, roles: ROLES_NEGOCIO },
  { to: "/categorias", label: "Categorías", icon: IconTags, roles: ROLES_NEGOCIO },
  { to: "/inventario", label: "Inventario", icon: IconInventario, roles: ROLES_NEGOCIO },
  { to: "/pedidos", label: "Pedidos", icon: IconOrders, roles: ROLES_NEGOCIO },
  { to: "/calendario", label: "Calendario", icon: IconCalendar },
  { to: "/proveedores", label: "Proveedores", icon: IconTruck, roles: ROLES_NEGOCIO },
  { to: "/influencers", label: "Influencers", icon: IconInfluencer, roles: ["ADMIN", "VENTAS"] },
  { to: "/ordenes-compra", label: "Órdenes de Compra", icon: IconReceipt, roles: ["ADMIN"] },
  { to: "/recepciones", label: "Recepciones", icon: IconReceipt, roles: ROLES_NEGOCIO },
  { to: "/costeo-importacion", label: "Costeo de Importación", icon: IconCosteo, roles: ["ADMIN", "INVENTARIO", "OPERACIONES"] },
  { to: "/gastos", label: "Gastos", icon: IconCoin, roles: ["ADMIN"] },
  { to: "/finanzas", label: "Finanzas", icon: IconCoin, roles: ["ADMIN"] },
  { to: "/simulador-financiero", label: "Simulador Financiero", icon: IconSimulador, roles: ["ADMIN"] },
  { to: "/mi-metricas", label: "Mi Métricas", icon: IconInfluencer, roles: ["INFLUENCER"] },
  { to: "/configuracion", label: "Configuración", icon: IconSettings, roles: ["ADMIN"] },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { session, logout } = useAuth();

  const initials = session
    ? session.nombre
        .split(" ")
        .slice(0, 2)
        .map((word) => word[0]?.toUpperCase())
        .join("")
    : "SS";

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 flex w-[280px] max-w-[85vw] shrink-0 flex-col border-r transition-transform duration-300 ease-out lg:static lg:translate-x-0 ${
        open ? "translate-x-0" : "-translate-x-full"
      }`}
      style={{
        borderColor: "var(--border)",
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0) 24%), rgb(var(--bg-rgb))",
      }}
    >
      <div className="shrink-0 px-5 pb-4 pt-5">
        <div
          className="rounded-3xl border p-4"
          style={{ borderColor: "var(--border)", background: "rgb(var(--surface-rgb))" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl"
              style={{ background: "rgb(var(--gold-rgb))", color: "rgb(var(--bg-rgb))" }}
            >
              <span className="text-lg font-extrabold leading-none" style={{ fontFamily: "var(--font-syne, Syne)" }}>
                S
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-bold tracking-tight" style={{ color: "rgb(var(--ink-rgb))" }}>
                SafeSound ERP
              </div>
              <div className="truncate text-xs" style={{ color: "rgb(var(--ink-faint-rgb))" }}>
                Operación comercial y financiera
              </div>
            </div>
            <button
              onClick={onClose}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-xl text-ink-muted hover:bg-raised lg:hidden"
              aria-label="Cerrar menú"
            >
              <IconClose width={18} height={18} />
            </button>
          </div>
        </div>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
        <div className="flex flex-col gap-1">
          {NAV.filter((item) => !item.roles || (session?.rol && item.roles.includes(session.rol))).map(
            ({ to, label, icon: Icon }) => {
              const isActive = pathname === to || (to !== "/dashboard" && pathname.startsWith(to));

              return (
                <Link
                  key={to}
                  href={to}
                  onClick={onClose}
                  className="flex shrink-0 items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors"
                  style={
                    isActive
                      ? {
                          background: "rgb(var(--surface-rgb))",
                          color: "rgb(var(--ink-rgb))",
                          border: "1px solid var(--border-strong)",
                        }
                      : { color: "rgb(var(--ink-muted-rgb))", border: "1px solid transparent" }
                  }
                >
                  <Icon style={{ color: isActive ? "rgb(var(--gold-rgb))" : "currentColor" }} />
                  <span>{label}</span>
                </Link>
              );
            },
          )}
        </div>
      </nav>

      <div
        className="shrink-0 m-3 rounded-3xl border p-4"
        style={{ borderColor: "var(--border)", background: "rgb(var(--surface-rgb))" }}
      >
        <div className="mb-4 flex items-center gap-3">
          <div
            className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl text-sm font-bold"
            style={{ background: "rgb(var(--blue-rgb) / 0.18)", color: "rgb(var(--blue-rgb))" }}
          >
            {initials}
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold" style={{ color: "rgb(var(--ink-rgb))" }}>
              {session?.nombre ?? "Administrador"}
            </div>
            <div className="text-xs uppercase tracking-[0.12em]" style={{ color: "rgb(var(--ink-faint-rgb))" }}>
              {session?.rol ?? "ADMIN"}
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-2xl px-3 py-2.5 text-sm font-semibold"
          style={{ background: "rgb(var(--bg-rgb))", color: "rgb(var(--ink-rgb))", border: "1px solid var(--border)" }}
        >
          <IconLogout width={16} height={16} />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  );
}

export function SidebarMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl lg:hidden"
      style={{ border: "1px solid var(--border)", background: "rgb(var(--surface-rgb))", color: "rgb(var(--ink-muted-rgb))" }}
      aria-label="Abrir menú"
    >
      <IconMenu width={20} height={20} />
    </button>
  );
}
