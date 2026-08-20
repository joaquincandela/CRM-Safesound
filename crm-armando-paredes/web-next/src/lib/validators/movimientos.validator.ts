import { z } from "zod";

export const crearMovimientoSchema = z.object({
  productoId: z.string(),
  tipo: z.enum(["ENTRADA", "SALIDA", "AJUSTE_POSITIVO", "AJUSTE_NEGATIVO", "VENTA", "DEVOLUCION_CLIENTE", "DEVOLUCION_PROVEEDOR"]),
  cantidad: z.number().int().positive(),
  referenciaTipo: z.enum(["PEDIDO", "ORDEN_COMPRA", "RECEPCION", "AJUSTE", "DEVOLUCION"]).optional(),
  referenciaId: z.string().optional(),
  motivo: z.string().optional(),
});

export type CrearMovimientoInput = z.infer<typeof crearMovimientoSchema>;
