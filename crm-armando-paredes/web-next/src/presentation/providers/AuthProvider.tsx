"use client";

import { createContext, useCallback, useContext, useState, useEffect, type ReactNode } from "react";
import type { UsuarioSession } from "@/domain/repositories/IAuthRepository";
import { SESSION_KEY, TOKEN_KEY } from "@/infrastructure/api/ApiClient";
import { container } from "@/infrastructure/container";

interface AuthCtx {
  session: UsuarioSession | null;
  login: (email: string, password: string) => Promise<UsuarioSession>;
  logout: () => void;
}

const Ctx = createContext<AuthCtx | null>(null);

function readSession(): UsuarioSession | null {
  if (typeof window === "undefined") return null;

  try {
    const storedSession = localStorage.getItem(SESSION_KEY);
    if (storedSession) return JSON.parse(storedSession) as UsuarioSession;

    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return null;

    const [, payload] = token.split(".");
    return JSON.parse(atob(payload)) as UsuarioSession;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<UsuarioSession | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setSession(readSession());
    setHydrated(true);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { token, usuario } = await container.auth.login(email, password);
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(SESSION_KEY, JSON.stringify(usuario));
    setSession(usuario);
    return usuario;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(SESSION_KEY);
    setSession(null);
  }, []);

  if (!hydrated) return null;

  return <Ctx.Provider value={{ session, login, logout }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth fuera de AuthProvider");
  return ctx;
}
