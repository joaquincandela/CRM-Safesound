import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";
import { seedBase, authHeader } from "./helpers.js";

const app = createApp();

describe("Score engine", () => {
  it("aplica una regla, recalcula el score y guarda el ScoreEvento", async () => {
    const { asesor, oportunidad } = await seedBase();

    const res = await request(app)
      .post("/api/score/evento")
      .set(authHeader(asesor))
      .send({ oportunidadId: oportunidad.id, regla: "PRIMERA_VISITA" });

    expect(res.status).toBe(201);
    expect(res.body.oportunidad.score).toBe(20); // 0 + 20
    expect(res.body.evento.scoreResultante).toBe(20);
    expect(res.body.evento.puntos).toBe(20);
    expect(res.body.evento.explicacion).toMatch(/primera visita/i);

    // Persistido en la oportunidad y con ultimaActividad refrescada.
    const opp = await prisma.oportunidad.findUniqueOrThrow({ where: { id: oportunidad.id } });
    expect(opp.score).toBe(20);
  });

  it("acota el score a 100 y mantiene Σpuntos == scoreResultante", async () => {
    const { asesor, oportunidad } = await seedBase();
    const h = authHeader(asesor);

    // +30 +30 +30 +30 => debería topar en 100, no 120.
    for (let i = 0; i < 4; i++) {
      await request(app)
        .post("/api/score/evento")
        .set(h)
        .send({ oportunidadId: oportunidad.id, regla: "HIPOTECA_PREAPROBADA" });
    }

    const opp = await prisma.oportunidad.findUniqueOrThrow({ where: { id: oportunidad.id } });
    expect(opp.score).toBe(100);

    const suma = await prisma.scoreEvento.aggregate({
      where: { oportunidadId: oportunidad.id },
      _sum: { puntos: true },
    });
    expect(suma._sum.puntos).toBe(100); // el delta efectivo respeta el clamp
  });

  it("registra interacción + scoring en una sola operación", async () => {
    const { asesor, prospecto, oportunidad } = await seedBase();

    const res = await request(app)
      .post("/api/score/interaccion")
      .set(authHeader(asesor))
      .send({
        prospectoId: prospecto.id,
        oportunidadId: oportunidad.id,
        asesorId: asesor.id,
        tipo: "VISITA",
        resumen: "Visita con la esposa",
        regla: "CODECISOR_CONTACTO",
      });

    expect(res.status).toBe(201);
    expect(res.body.score.oportunidad.score).toBe(25);

    const interacciones = await prisma.interaccion.count({ where: { prospectoId: prospecto.id } });
    expect(interacciones).toBe(1);
  });

  it("GET /prospectos/:id/score devuelve score actual + historial", async () => {
    const { asesor, prospecto, oportunidad } = await seedBase();
    const h = authHeader(asesor);

    await request(app)
      .post("/api/score/evento")
      .set(h)
      .send({ oportunidadId: oportunidad.id, regla: "PRIMERA_VISITA" });
    await request(app)
      .post("/api/score/evento")
      .set(h)
      .send({ oportunidadId: oportunidad.id, regla: "PIDIO_FINANCIAMIENTO" });

    const res = await request(app).get(`/api/prospectos/${prospecto.id}/score`).set(h);

    expect(res.status).toBe(200);
    expect(res.body.scoreActual).toBe(30); // 20 + 10
    expect(res.body.historial).toHaveLength(2);
    expect(res.body.historial[0].explicacion).toBeTruthy();
  });

  it("rechaza eventos sin token (401) y con regla inválida (400)", async () => {
    const { asesor, oportunidad } = await seedBase();

    const sinToken = await request(app)
      .post("/api/score/evento")
      .send({ oportunidadId: oportunidad.id, regla: "PRIMERA_VISITA" });
    expect(sinToken.status).toBe(401);

    const reglaMala = await request(app)
      .post("/api/score/evento")
      .set(authHeader(asesor))
      .send({ oportunidadId: oportunidad.id, regla: "NO_EXISTE" });
    expect(reglaMala.status).toBe(400);
  });
});
