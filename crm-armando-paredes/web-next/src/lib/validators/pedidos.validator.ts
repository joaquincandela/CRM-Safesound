import { z } from "zod";

export const crearLineaPedidoSchema = z.object({
  productoId: z.string(),
  cantidad: z.number().int().positive(),
});

export const crearPedidoSchema = z.object({
  clienteId: z.string().optional(),
  clienteNombre: z.string().max(200).optional(),
  clienteTelefono: z.string().max(50).optional(),
  clienteEmail: z.string().email().optional().or(z.literal("")).optional(),
  clienteDocumento: z.string().max(50).optional(),
  clienteDireccion: z.string().max(300).optional(),
  estado: z.enum(["PENDIENTE", "PAGADO", "PREPARANDO", "ENVIADO", "ENTREGADO", "CANCELADO"]).default("PENDIENTE"),
  descuento: z.number().nonnegative().default(0),
  igv: z.number().nonnegative().default(0),
  notas: z.string().optional(),
  lineas: z.array(crearLineaPedidoSchema).min(1),
});

export const actualizarPedidoSchema = z.object({
  estado: z.enum(["PENDIENTE", "PAGADO", "PREPARANDO", "ENVIADO", "ENTREGADO", "CANCELADO"]).optional(),
  descuento: z.number().nonnegative().optional(),
  igv: z.number().nonnegative().optional(),
  notas: z.string().optional(),
});

export type CrearPedidoInput = z.infer<typeof crearPedidoSchema>;
export type ActualizarPedidoInput = z.infer<typeof actualizarPedidoSchema>;
export type CrearLineaPedidoInput = z.infer<typeof crearLineaPedidoSchema>;
