import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";
import { setPassword } from "../src/services/auth.service.js";

const app = createApp();

describe("Auth", () => {
  it("login válido emite un JWT", async () => {
    const asesor = await prisma.asesor.create({
      data: { nombre: "Login Test", email: "login@test.pe" },
    });
    await setPassword(asesor.id, "secreto123");

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "login@test.pe", password: "secreto123" });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
    expect(res.body.asesor.email).toBe("login@test.pe");
  });

  it("login con password incorrecto => 401", async () => {
    const asesor = await prisma.asesor.create({
      data: { nombre: "Login Test", email: "login2@test.pe" },
    });
    await setPassword(asesor.id, "secreto123");

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "login2@test.pe", password: "passwordIncorrecto" });

    expect(res.status).toBe(401);
  });

  it("email inexistente => 401", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "nadie@test.pe", password: "x123456" });
    expect(res.status).toBe(401);
  });
});
