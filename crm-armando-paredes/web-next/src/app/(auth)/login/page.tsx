"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/presentation/providers/AuthProvider";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const usuario = await login(email, password);
      router.replace(usuario.rol === "INFLUENCER" ? "/mi-metricas" : "/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión");
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor:"rgb(var(--bg-rgb))" }}>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background:"radial-gradient(ellipse 80% 60% at 50% 0%, rgb(var(--gold-rgb)/0.08) 0%, transparent 70%)" }}
      />
      <div className="relative w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4" style={{ background:"rgb(var(--gold-rgb)/0.12)" }}>
            <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="rgb(var(--gold-rgb))" strokeWidth="1.8">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily:"var(--font-syne, Syne, sans-serif)", color:"rgb(var(--ink-rgb))" }}>
            SafeSound ERP
          </h1>
          <p className="text-sm mt-1" style={{ color:"rgb(var(--ink-muted-rgb))" }}>Sistema de Gestión · Iniciar sesión</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl p-8 space-y-5"
          style={{ background:"rgb(var(--surface-rgb))", border:"1px solid var(--border-strong)" }}>
          <div className="space-y-2">
            <label className="block text-xs font-medium" style={{ color:"rgb(var(--ink-muted-rgb))" }}>Correo electrónico</label>
            <input type="email" required autoComplete="email" value={email} onChange={(e)=>setEmail(e.target.value)}
              placeholder="tucorreo@safesound.com" className="inp w-full" />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium" style={{ color:"rgb(var(--ink-muted-rgb))" }}>Contraseña</label>
            <input type="password" required autoComplete="current-password" value={password} onChange={(e)=>setPassword(e.target.value)}
              placeholder="••••••••" className="inp w-full" />
          </div>
          {error && (
            <p className="text-sm rounded-lg px-3 py-2" style={{ color:"rgb(var(--red-rgb))", background:"rgb(var(--red-rgb)/0.1)" }}>
              {error}
            </p>
          )}
          <button type="submit" disabled={loading}
            className="w-full py-2.5 rounded-xl text-sm font-semibold transition-opacity disabled:opacity-60"
            style={{ background:"rgb(var(--gold-rgb))", color:"rgb(var(--bg-rgb))" }}>
            {loading ? "Ingresando…" : "Ingresar"}
          </button>
        </form>
        <p className="text-center text-xs mt-6" style={{ color:"rgb(var(--ink-faint-rgb))" }}>
          ¿Problemas para acceder? Contacta a tu administrador.
        </p>
      </div>
    </div>
  );
}
