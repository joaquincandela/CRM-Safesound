import { z } from "zod";

export const crearTareaCalendarioSchema = z.object({
  titulo: z.string().min(1).max(200),
  descripcion: z.string().max(1000).optional().or(z.literal("")),
  fecha: z.string(), // "YYYY-MM-DD"
  hora: z.string().regex(/^\d{2}:\d{2}$/).optional().or(z.literal("")),
  completada: z.boolean().optional(),
});

export const actualizarTareaCalendarioSchema = z.object({
  titulo: z.string().min(1).max(200).optional(),
  descripcion: z.string().max(1000).optional().or(z.literal("")),
  fecha: z.string().optional(), // "YYYY-MM-DD"
  hora: z.string().regex(/^\d{2}:\d{2}$/).optional().or(z.literal("")),
  completada: z.boolean().optional(),
});

export type CrearTareaCalendarioInput = z.infer<typeof crearTareaCalendarioSchema>;
export type ActualizarTareaCalendarioInput = z.infer<typeof actualizarTareaCalendarioSchema>;
