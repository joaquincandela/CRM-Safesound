import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/presentation/providers/AuthProvider";
import { PrefsProvider } from "@/presentation/providers/PrefsProvider";

export const metadata: Metadata = {
  title: "SafeSound ERP",
  description: "Sistema de Gestión SafeSound",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" data-theme="dark" className="h-full">
      <body className="h-full antialiased" style={{ fontFamily: "var(--font-body)" }}>
        <AuthProvider>
          <PrefsProvider>{children}</PrefsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
