import { z } from "zod";

export const crearLineaOrdenSchema = z.object({
  productoId: z.string(),
  cantidad: z.number().int().positive(),
  costoUnitario: z.number().positive(),
});

export const crearOrdenCompraSchema = z.object({
  proveedorId: z.string(),
  estado: z.enum(["BORRADOR", "CONFIRMADA", "EN_FABRICACION", "EN_TRANSITO", "RECIBIDA", "CANCELADA"]).default("BORRADOR"),
  moneda: z.string().default("USD"),
  impuestos: z.number().nonnegative().default(0),
  fechaEstimada: z.string().optional(),
  notas: z.string().optional(),
  lineas: z.array(crearLineaOrdenSchema).min(1),
});

export const actualizarOrdenCompraSchema = z.object({
  estado: z.enum(["BORRADOR", "CONFIRMADA", "EN_FABRICACION", "EN_TRANSITO", "RECIBIDA", "CANCELADA"]).optional(),
  moneda: z.string().optional(),
  impuestos: z.number().nonnegative().optional(),
  fechaEstimada: z.string().optional(),
  notas: z.string().optional(),
});

export type CrearOrdenCompraInput = z.infer<typeof crearOrdenCompraSchema>;
export type ActualizarOrdenCompraInput = z.infer<typeof actualizarOrdenCompraSchema>;
export type CrearLineaOrdenInput = z.infer<typeof crearLineaOrdenSchema>;
