import { prisma } from "@/lib/prisma";

const LIMITE = 5;

export async function buscarGlobal(q: string) {
  const termino = q.trim();
  if (!termino) {
    return { productos: [], clientes: [], pedidos: [], proveedores: [] };
  }

  const where = { contains: termino, mode: "insensitive" } as const;

  const [productos, clientes, pedidos, proveedores] = await Promise.all([
    prisma.producto.findMany({
      where: {
        OR: [
          { nombre: where },
          { sku: where },
        ],
      },
      take: LIMITE,
      select: {
        id: true,
        sku: true,
        nombre: true,
        categoria: { select: { nombre: true } },
      },
      orderBy: { nombre: "asc" },
    }),
    prisma.cliente.findMany({
      where: {
        OR: [
          { nombre: where },
          { apellido: where },
          { razonSocial: where },
          { numeroDocumento: where },
          { email: where },
          { telefono: where },
        ],
      },
      take: LIMITE,
      select: {
        id: true,
        nombre: true,
        apellido: true,
        razonSocial: true,
        numeroDocumento: true,
        email: true,
        telefono: true,
      },
      orderBy: { nombre: "asc" },
    }),
    prisma.pedido.findMany({
      where: {
        OR: [
          { numero: where },
          { clienteNombre: where },
          { clienteDocumento: where },
          { clienteTelefono: where },
        ],
      },
      take: LIMITE,
      select: {
        id: true,
        numero: true,
        clienteNombre: true,
        clienteTelefono: true,
        estado: true,
        total: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.proveedor.findMany({
      where: {
        OR: [
          { razonSocial: where },
          { nombreComercial: where },
          { numeroDocumento: where },
          { email: where },
          { telefono: where },
        ],
      },
      take: LIMITE,
      select: {
        id: true,
        razonSocial: true,
        nombreComercial: true,
        numeroDocumento: true,
        email: true,
        telefono: true,
      },
      orderBy: { razonSocial: "asc" },
    }),
  ]);

  return {
    productos: productos.map((p) => ({
      id: p.id,
      codigo: p.sku,
      nombre: p.nombre,
      detalle: p.categoria?.nombre ?? "",
    })),
    clientes: clientes.map((c) => ({
      id: c.id,
      nombre: c.razonSocial ?? [c.nombre, c.apellido].filter(Boolean).join(" "),
      codigo: c.numeroDocumento,
      detalle: c.email ?? c.telefono ?? "",
    })),
    pedidos: pedidos.map((p) => ({
      id: p.id,
      nombre: p.numero,
      codigo: "",
      detalle: p.clienteNombre ?? "",
      estado: p.estado,
      total: Number(p.total),
    })),
    proveedores: proveedores.map((pv) => ({
      id: pv.id,
      nombre: pv.razonSocial,
      codigo: pv.numeroDocumento,
      detalle: pv.nombreComercial ?? pv.email ?? "",
    })),
  };
}
