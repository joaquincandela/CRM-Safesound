"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/presentation/providers/AuthProvider";
import { Sidebar } from "@/presentation/components/layout/Sidebar";
import { Topbar } from "@/presentation/components/layout/Topbar";

export default function CrmLayout({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !session) router.replace("/login");
  }, [mounted, session, router]);

  useEffect(() => {
    if (mounted && session?.rol === "INFLUENCER" && pathname !== "/mi-metricas" && pathname !== "/calendario") {
      router.replace("/mi-metricas");
    }
  }, [mounted, session, pathname, router]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  if (!mounted || !session) return null;

  return (
    <div className="flex h-dvh overflow-hidden" style={{ backgroundColor: "rgb(var(--bg-rgb))", color: "rgb(var(--ink-rgb))" }}>
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />

      {menuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar onMenuClick={() => setMenuOpen(true)} />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
