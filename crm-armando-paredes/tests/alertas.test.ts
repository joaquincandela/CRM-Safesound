import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";
import { detectarInactividad } from "../src/jobs/inactividad.job.js";
import { seedBase, authHeader } from "./helpers.js";

const app = createApp();

function hace(dias: number) {
  const d = new Date();
  d.setDate(d.getDate() - dias);
  return d;
}
function enDias(dias: number) {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  return d;
}

describe("Alertas", () => {
  it("GET /alertas detecta inactividad, deals en riesgo e hipotecas por vencer", async () => {
    const { asesor, oportunidad, prospecto } = await seedBase();

    // Deal de alto valor, etapa avanzada y estancado 40 días => riesgo + inactividad.
    await prisma.oportunidad.update({
      where: { id: oportunidad.id },
      data: { etapa: "NEGOCIACION", valorEstimado: 500000, ultimaActividad: hace(40) },
    });
    // Hipoteca pre-aprobada venciendo en 10 días.
    await prisma.prospecto.update({
      where: { id: prospecto.id },
      data: { hipotecaPreAprobada: true, hipotecaVenceEl: enDias(10) },
    });

    const res = await request(app).get("/api/alertas").set(authHeader(asesor));

    expect(res.status).toBe(200);
    expect(res.body.totales.inactividad30).toBe(1);
    expect(res.body.totales.enRiesgo).toBe(1);
    expect(res.body.totales.hipotecasPorVencer).toBe(1);
    expect(res.body.dealsEnRiesgo[0].id).toBe(oportunidad.id);
  });

  it("el job de inactividad penaliza el score de forma idempotente", async () => {
    const { oportunidad } = await seedBase();
    await prisma.oportunidad.update({
      where: { id: oportunidad.id },
      data: { score: 50, ultimaActividad: hace(40) },
    });

    const r1 = await detectarInactividad();
    expect(r1.penalizadas).toBe(1);

    const opp1 = await prisma.oportunidad.findUniqueOrThrow({ where: { id: oportunidad.id } });
    expect(opp1.score).toBe(35); // 50 - 15 (>30 días)

    // Segunda corrida: NO vuelve a penalizar (idempotente).
    const r2 = await detectarInactividad();
    expect(r2.penalizadas).toBe(0);

    const opp2 = await prisma.oportunidad.findUniqueOrThrow({ where: { id: oportunidad.id } });
    expect(opp2.score).toBe(35);
  });
});
