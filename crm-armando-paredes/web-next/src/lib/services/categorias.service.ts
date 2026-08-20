import { prisma } from "@/lib/prisma";
import { NotFound } from "@/lib/errors";
import type { CrearCategoriaInput, ActualizarCategoriaInput } from "@/lib/validators/categorias.validator";

export async function crearCategoria(data: CrearCategoriaInput) {
  return prisma.categoria.create({
    data,
  });
}

export async function listarCategorias(activo?: boolean) {
  return prisma.categoria.findMany({
    where: activo !== undefined ? { activo } : undefined,
    orderBy: { nombre: "asc" },
    include: {
      _count: {
        select: { productos: true },
      },
    },
  });
}

export async function obtenerCategoria(id: string) {
  const categoria = await prisma.categoria.findUnique({
    where: { id },
    include: {
      productos: {
        select: {
          id: true,
          sku: true,
          nombre: true,
          estado: true,
        },
      },
    },
  });
  if (!categoria) throw NotFound("Categoría");
  return categoria;
}

export async function actualizarCategoria(id: string, data: ActualizarCategoriaInput) {
  const categoria = await prisma.categoria.findUnique({ where: { id } });
  if (!categoria) throw NotFound("Categoría");

  return prisma.categoria.update({
    where: { id },
    data,
  });
}

export async function eliminarCategoria(id: string) {
  const categoria = await prisma.categoria.findUnique({
    where: { id },
    include: { _count: { select: { productos: true } } },
  });
  if (!categoria) throw NotFound("Categoría");
  if (categoria._count.productos > 0) {
    throw new Error("No se puede eliminar una categoría con productos asociados");
  }

  return prisma.categoria.delete({
    where: { id },
  });
}
