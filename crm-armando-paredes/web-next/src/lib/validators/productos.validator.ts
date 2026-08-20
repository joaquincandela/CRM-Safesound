import { z } from "zod";

export const crearProductoSchema = z.object({
  sku: z.string().min(1).max(50),
  nombre: z.string().min(1).max(200),
  descripcion: z.string().optional(),
  categoriaId: z.string(),
  // Costo inicial opcional: el costo real siempre lo fija el Costeo de Importación.
  costoUnitario: z.number().nonnegative().default(0),
  precioVenta: z.number().positive(),
  stockMinimo: z.number().int().min(0).default(0),
  stockInicial: z.number().int().min(0).optional(),
  estado: z.enum(["ACTIVO", "INACTIVO"]).default("ACTIVO"),
  imagenUrl: z.string().url().optional().or(z.literal("")),
});

export const actualizarProductoSchema = z.object({
  sku: z.string().min(1).max(50).optional(),
  nombre: z.string().min(1).max(200).optional(),
  descripcion: z.string().optional(),
  categoriaId: z.string().optional(),
  precioVenta: z.number().positive().optional(),
  stockMinimo: z.number().int().min(0).optional(),
  estado: z.enum(["ACTIVO", "INACTIVO"]).optional(),
  imagenUrl: z.string().url().optional().or(z.literal("")),
});

export type CrearProductoInput = z.infer<typeof crearProductoSchema>;
export type ActualizarProductoInput = z.infer<typeof actualizarProductoSchema>;
