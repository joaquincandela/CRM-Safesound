import { z } from "zod";

export const crearProveedorSchema = z.object({
  tipoDocumento: z.enum(["DNI", "RUC", "CE", "PASAPORTE", "OTRO"]),
  numeroDocumento: z.string().min(1).max(50),
  razonSocial: z.string().min(1).max(300),
  nombreComercial: z.string().max(300).optional(),
  contacto: z.string().max(200).optional(),
  email: z.string().email().optional().or(z.literal("")),
  telefono: z.string().max(50).optional(),
  direccion: z.string().max(500).optional(),
  pais: z.string().max(100).optional(),
  activo: z.boolean().optional().default(true),
});

export const actualizarProveedorSchema = z.object({
  tipoDocumento: z.enum(["DNI", "RUC", "CE", "PASAPORTE", "OTRO"]).optional(),
  numeroDocumento: z.string().min(1).max(50).optional(),
  razonSocial: z.string().min(1).max(300).optional(),
  nombreComercial: z.string().max(300).optional(),
  contacto: z.string().max(200).optional(),
  email: z.string().email().optional().or(z.literal("")),
  telefono: z.string().max(50).optional(),
  direccion: z.string().max(500).optional(),
  pais: z.string().max(100).optional(),
  activo: z.boolean().optional(),
});

export type CrearProveedorInput = z.infer<typeof crearProveedorSchema>;
export type ActualizarProveedorInput = z.infer<typeof actualizarProveedorSchema>;
