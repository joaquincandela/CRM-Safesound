import { avatarColor, initials } from "@/presentation/lib/format";

// Avatar generado: iniciales sobre color determinista por nombre.
// Más reconocible que un placeholder gris idéntico para todos.
export function Avatar({ nombre, size = 36 }: { nombre: string; size?: number }) {
  const c = avatarColor(nombre);
  return (
    <div
      className="grid shrink-0 place-items-center rounded-full font-display font-bold"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.36,
        color: c,
        background: `${c}1f`,
        border: `1px solid ${c}33`,
      }}
      aria-hidden
    >
      {initials(nombre)}
    </div>
  );
}
