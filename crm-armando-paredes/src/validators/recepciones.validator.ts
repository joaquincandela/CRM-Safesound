import { z } from "zod";

export const crearLineaRecepcionSchema = z.object({
  productoId: z.string(),
  cantidadRecibida: z.number().int().positive(),
});

export const crearRecepcionSchema = z.object({
  ordenId: z.string(),
  notas: z.string().optional(),
  lineas: z.array(crearLineaRecepcionSchema).min(1),
});

export type CrearRecepcionInput = z.infer<typeof crearRecepcionSchema>;
export type CrearLineaRecepcionInput = z.infer<typeof crearLineaRecepcionSchema>;
