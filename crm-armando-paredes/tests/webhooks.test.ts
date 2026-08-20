import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";
import { procesarCola } from "../src/services/webhooks.service.js";

const app = createApp();
const secret = { "x-webhook-secret": process.env.WEBHOOK_SECRET! };

describe("Webhooks", () => {
  it("encola WhatsApp y el procesamiento crea el prospecto + interacción", async () => {
    const res = await request(app)
      .post("/webhook/whatsapp")
      .set(secret)
      .send({ from: "+51955123456", name: "Juan Pérez", message: "Hola, info del proyecto", messageId: "wamid.1" });

    expect(res.status).toBe(202);

    // En cola, aún sin prospecto.
    expect(await prisma.prospecto.count()).toBe(0);
    expect(await prisma.mensajeEntrante.count({ where: { estado: "PENDIENTE" } })).toBe(1);

    const r = await procesarCola();
    expect(r.ok).toBe(1);

    const prospecto = await prisma.prospecto.findFirst({ where: { telefono: "+51955123456" } });
    expect(prospecto?.fuente).toBe("WHATSAPP");
    expect(await prisma.interaccion.count({ where: { prospectoId: prospecto!.id } })).toBe(1);
  });

  it("rechaza sin el secreto compartido (401)", async () => {
    const res = await request(app)
      .post("/webhook/whatsapp")
      .send({ from: "+51999", messageId: "x" });
    expect(res.status).toBe(401);
  });

  it("es idempotente por (canal, externalId)", async () => {
    const payload = { from: "+51955999888", message: "hola", messageId: "wamid.dup" };
    await request(app).post("/webhook/whatsapp").set(secret).send(payload);
    await request(app).post("/webhook/whatsapp").set(secret).send(payload);

    expect(await prisma.mensajeEntrante.count()).toBe(1);
  });
});
