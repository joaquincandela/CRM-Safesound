// Formateadores de moneda y números. El ticket es alto: abreviamos con criterio.
// Núcleo agnóstico de símbolo; useMoney() inyecta US$ o S/ según la moneda activa.

/** Compacto con símbolo arbitrario: "US$ 685K" · "S/ 2.57M". */
export function fmtCompact(n: number | null, sym: string): string {
  if (n == null) return "—";
  if (n >= 1_000_000) return `${sym} ${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${sym} ${Math.round(n / 1_000)}K`;
  return `${sym} ${Math.round(n)}`;
}

/** Completo con separador de miles: "US$ 685,000" · "S/ 2,568,750". */
export function fmtFull(n: number | null, sym: string): string {
  if (n == null) return "—";
  const locale = sym === "S/" ? "es-PE" : "en-US";
  return `${sym} ${Math.round(n).toLocaleString(locale)}`;
}

export function usdShort(n: number | null): string {
  return fmtCompact(n, "US$");
}

// Monto completo con separador de miles — para documentos formales (PDF).
export function usdFull(n: number | null): string {
  return fmtFull(n, "US$");
}

export function penShort(n: number): string {
  return fmtCompact(n, "S/");
}

export function pct(n: number, signed = false): string {
  const v = Math.round(n * 100);
  return `${signed && v > 0 ? "+" : ""}${v}%`;
}

export function initials(nombre: string): string {
  return nombre
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86_400_000);
  if (d <= 0) {
    const h = Math.floor(diff / 3_600_000);
    return h <= 0 ? "hace un momento" : `hace ${h} h`;
  }
  if (d === 1) return "ayer";
  if (d < 30) return `hace ${d} días`;
  const m = Math.floor(d / 30);
  return `hace ${m} mes${m > 1 ? "es" : ""}`;
}

export function fecha(iso: string): string {
  return new Date(iso).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" });
}

// Avatar determinista: el color sale del nombre, así cada persona es reconocible.
const AVATAR_HUES = ["#5B8EF0", "#3EC898", "#E8C547", "#E86060", "#A78BFA", "#F0883E"];
export function avatarColor(nombre: string): string {
  let h = 0;
  for (let i = 0; i < nombre.length; i++) h = (h * 31 + nombre.charCodeAt(i)) % 997;
  return AVATAR_HUES[h % AVATAR_HUES.length];
}
