import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";
import { seedBase, authHeader } from "./helpers.js";

const app = createApp();

describe("Reserva de unidad", () => {
  it("reserva una unidad disponible y mueve el deal a RESERVA", async () => {
    const { asesor, unidad, oportunidad } = await seedBase();

    const res = await request(app)
      .post(`/api/unidades/${unidad.id}/reservar`)
      .set(authHeader(asesor))
      .send({ oportunidadId: oportunidad.id, montoSeparacion: 5000 });

    expect(res.status).toBe(201);
    expect(res.body.estado).toBe("ACTIVA");

    const u = await prisma.unidad.findUniqueOrThrow({ where: { id: unidad.id } });
    expect(u.estado).toBe("RESERVADA");

    const opp = await prisma.oportunidad.findUniqueOrThrow({ where: { id: oportunidad.id } });
    expect(opp.etapa).toBe("RESERVA");
  });

  it("evita doble reserva de la misma unidad (409)", async () => {
    const { asesor, unidad, oportunidad } = await seedBase();
    const h = authHeader(asesor);

    const primera = await request(app)
      .post(`/api/unidades/${unidad.id}/reservar`)
      .set(h)
      .send({ oportunidadId: oportunidad.id, montoSeparacion: 5000 });
    expect(primera.status).toBe(201);

    const segunda = await request(app)
      .post(`/api/unidades/${unidad.id}/reservar`)
      .set(h)
      .send({ oportunidadId: oportunidad.id, montoSeparacion: 5000 });
    expect(segunda.status).toBe(409);

    // Solo una reserva quedó registrada.
    const reservas = await prisma.reserva.count({ where: { unidadId: unidad.id } });
    expect(reservas).toBe(1);
  });

  it("404 si la unidad no existe", async () => {
    const { asesor, oportunidad } = await seedBase();
    const res = await request(app)
      .post(`/api/unidades/no-existe/reservar`)
      .set(authHeader(asesor))
      .send({ oportunidadId: oportunidad.id, montoSeparacion: 5000 });
    expect(res.status).toBe(404);
  });
});
