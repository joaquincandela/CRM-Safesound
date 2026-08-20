import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Prisma 7 usa driver adapters en runtime.
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Sembrando SafeSound CRM + ERP...");

  // Limpiar base de datos (orden inverso por FKs).
  await prisma.gasto.deleteMany();
  await prisma.interaccion.deleteMany();
  await prisma.movimientoInventario.deleteMany();
  await prisma.lineaRecepcion.deleteMany();
  await prisma.recepcionMercaderia.deleteMany();
  await prisma.lineaOrdenCompra.deleteMany();
  await prisma.ordenCompra.deleteMany();
  await prisma.proveedor.deleteMany();
  await prisma.lineaPedido.deleteMany();
  await prisma.pedido.deleteMany();
  await prisma.cliente.deleteMany();
  await prisma.producto.deleteMany();
  await prisma.categoria.deleteMany();
  await prisma.usuario.deleteMany();
  await prisma.mensajeEntrante.deleteMany();

  // ----------------------------------------------------------------------
  // USUARIOS ADMINISTRADORES OFICIALES
  // ----------------------------------------------------------------------
  const admins = [
    { nombre: "Joaquin", email: "joaquin@safesound.com", telefono: "+51 900 000 001", password: "joaquin123" },
    { nombre: "Xoan", email: "xoan@safesound.com", telefono: "+51 900 000 002", password: "xoan123" },
  ];

  for (const a of admins) {
    const passwordHash = await bcrypt.hash(a.password, 10); // CAMBIAR EN PRODUCCIÓN
    await prisma.usuario.create({
      data: {
        nombre: a.nombre,
        email: a.email,
        telefono: a.telefono,
        passwordHash,
        rol: "ADMIN",
        activo: true,
      },
    });
  }

  console.log(`✅ Seed completado. Usuarios admin creados: ${admins.map((a) => a.email).join(", ")}`);
  console.log("⚠️  Cambiar contraseñas en producción.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
