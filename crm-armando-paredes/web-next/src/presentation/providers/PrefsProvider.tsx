"use client";
import {
  createContext, useContext, useState, useEffect, useCallback,
  type ReactNode,
} from "react";

export type ThemeMode = "dark" | "light";
export type Currency  = "USD" | "PEN";
export type Role      = "seller" | "admin";

interface PrefsCtx {
  theme: ThemeMode; toggleTheme: () => void;
  currency: Currency; setCurrency: (c: Currency) => void;
  fx: number;
  role: Role; setRole: (r: Role) => void;
}

const Ctx = createContext<PrefsCtx | null>(null);
const FX_BASE = 3.752;

export function PrefsProvider({ children }: { children: ReactNode }) {
  const [theme,    setTheme]    = useState<ThemeMode>("dark");
  const [currency, setCurrency] = useState<Currency>("USD");
  const [role,     setRole]     = useState<Role>("seller");
  const [fx,       setFx]       = useState(FX_BASE);

  // Cargar prefs desde localStorage
  useEffect(() => {
    const t = localStorage.getItem("ap.theme")    as ThemeMode | null;
    const c = localStorage.getItem("ap.currency") as Currency  | null;
    const r = localStorage.getItem("ap.role")     as Role      | null;
    if (t) setTheme(t);
    if (c) setCurrency(c);
    if (r) setRole(r);
  }, []);

  // Reflejar tema en <html data-theme>
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("ap.theme", theme);
  }, [theme]);

  // Reflejar rol en <body data-role>
  useEffect(() => {
    document.body.setAttribute("data-role", role);
    localStorage.setItem("ap.role", role);
  }, [role]);

  useEffect(() => {
    localStorage.setItem("ap.currency", currency);
  }, [currency]);

  // Simular deriva de FX en vivo
  useEffect(() => {
    const id = setInterval(() => {
      setFx((f) => parseFloat((f + (Math.random() - 0.5) * 0.002).toFixed(3)));
    }, 8000);
    return () => clearInterval(id);
  }, []);

  const toggleTheme = useCallback(() => setTheme((t) => t === "dark" ? "light" : "dark"), []);
  const handleSetCurrency = useCallback((c: Currency) => setCurrency(c), []);
  const handleSetRole     = useCallback((r: Role) => setRole(r), []);

  return (
    <Ctx.Provider value={{ theme, toggleTheme, currency, setCurrency: handleSetCurrency, fx, role, setRole: handleSetRole }}>
      {children}
    </Ctx.Provider>
  );
}

export function usePrefs() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("usePrefs fuera de PrefsProvider");
  return ctx;
}

export function useMoney() {
  const { currency, fx } = usePrefs();
  const symbol = currency === "PEN" ? "S/" : "US$";
  const convert = (usd: number | null) => usd == null ? null : currency === "PEN" ? usd * fx : usd;

  const fmt = (n: number | null, compact = false) => {
    if (n == null) return "—";
    return compact
      ? n >= 1_000_000 ? `${symbol} ${(n/1_000_000).toFixed(1)}M`
        : n >= 1_000   ? `${symbol} ${(n/1_000).toFixed(0)}K`
        : `${symbol} ${n.toFixed(0)}`
      : `${symbol} ${n.toLocaleString("es-PE", { minimumFractionDigits:0, maximumFractionDigits:0 })}`;
  };

  return {
    short: (usd: number | null) => fmt(convert(usd), true),
    full:  (usd: number | null) => fmt(convert(usd), false),
    currency, fx, symbol,
  };
}
