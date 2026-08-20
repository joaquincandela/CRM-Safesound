import { z } from "zod";

export const crearGastoSchema = z.object({
  comprobanteTipo: z.enum(["FACTURA", "BOLETA", "RECIBO", "OTRO"]).optional(),
  comprobanteNumero: z.string().min(1).max(100).optional(),
  proveedorId: z.string().optional(),
  categoria: z.string().min(1).max(100),
  descripcion: z.string().min(1),
  monto: z.number().positive(),
  moneda: z.string().default("PEN"),
  fecha: z.string(),
  archivoUrl: z.string().url().optional().or(z.literal("")),
});

export const actualizarGastoSchema = z.object({
  comprobanteTipo: z.enum(["FACTURA", "BOLETA", "RECIBO", "OTRO"]).optional(),
  comprobanteNumero: z.string().min(1).max(100).optional(),
  proveedorId: z.string().optional(),
  categoria: z.string().min(1).max(100).optional(),
  descripcion: z.string().min(1).optional(),
  monto: z.number().positive().optional(),
  moneda: z.string().optional(),
  fecha: z.string().optional(),
  archivoUrl: z.string().url().optional().or(z.literal("")),
});

export type CrearGastoInput = z.infer<typeof crearGastoSchema>;
export type ActualizarGastoInput = z.infer<typeof actualizarGastoSchema>;
