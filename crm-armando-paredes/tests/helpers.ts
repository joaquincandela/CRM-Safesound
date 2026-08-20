import jwt from "jsonwebtoken";
import { prisma } from "../src/lib/prisma.js";

// Token JWT válido para las pruebas (mismo secreto que vitest.config.ts).
export function authHeader(asesor: { id: string; email: string; nombre: string }) {
  const token = jwt.sign(
    { sub: asesor.id, email: asesor.email, nombre: asesor.nombre },
    process.env.JWT_SECRET!,
    { expiresIn: "1h" },
  );
  return { Authorization: `Bearer ${token}` } as const;
}

/**
 * Crea un escenario mínimo: asesor, proyecto con una unidad disponible,
 * prospecto con una oportunidad. Devuelve los ids para las aserciones.
 */
export async function seedBase() {
  const asesor = await prisma.asesor.create({
    data: { nombre: "Test Asesor", email: `asesor_${Date.now()}@test.pe` },
  });

  const proyecto = await prisma.proyecto.create({
    data: {
      nombre: "Proyecto Test",
      linea: "VENTA_VIVIENDA",
      distrito: "San Isidro",
      estado: "EN_VENTA",
      unidades: {
        create: {
          piso: 5,
          numero: "501",
          area: 100,
          dormitorios: 2,
          precio: 400000,
          estado: "DISPONIBLE",
        },
      },
    },
    include: { unidades: true },
  });

  const prospecto = await prisma.prospecto.create({
    data: {
      nombre: "Test Prospecto",
      telefono: "+51900000000",
      fuente: "WEB",
      oportunidades: {
        create: { proyectoId: proyecto.id, asesorId: asesor.id, etapa: "CALIFICADO" },
      },
    },
    include: { oportunidades: true },
  });

  return {
    asesor,
    proyecto,
    unidad: proyecto.unidades[0],
    prospecto,
    oportunidad: prospecto.oportunidades[0],
  };
}
