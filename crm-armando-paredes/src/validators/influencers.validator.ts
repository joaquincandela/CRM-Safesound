import { z } from "zod";

export const crearInfluencerSchema = z.object({
  nombre: z.string().min(1).max(200),
  instagram: z.string().optional().or(z.literal("")),
  tiktok: z.string().optional().or(z.literal("")),
  youtube: z.string().optional().or(z.literal("")),
  metaPublicaciones: z.number().int().min(0).default(0),
  activo: z.boolean().optional(),
  email: z.string().email(),
  password: z.string().min(6),
});

export const actualizarInfluencerSchema = z.object({
  nombre: z.string().min(1).max(200).optional(),
  instagram: z.string().optional().or(z.literal("")).optional(),
  tiktok: z.string().optional().or(z.literal("")).optional(),
  youtube: z.string().optional().or(z.literal("")).optional(),
  metaPublicaciones: z.number().int().min(0).optional(),
  activo: z.boolean().optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
});

export const crearMetricaSchema = z.object({
  fechaInicio: z.string(), // ISO date (inicio del mes)
  seguidores: z.number().int().min(0).default(0),
  engagement: z.number().min(0).default(0),
  alcance: z.number().int().min(0).default(0),
  vistas: z.number().int().min(0).default(0),
  publicaciones: z.number().int().min(0).default(0),
  clics: z.number().int().min(0).default(0),
  conversiones: z.number().int().min(0).default(0),
});

export const crearTareaSchema = z.object({
  mes: z.string(), // ISO date "YYYY-MM-DD" (inicio del mes)
  descripcion: z.string().min(1).max(300),
  cantidadMeta: z.number().int().min(1).default(1),
});

export const actualizarTareaSchema = z.object({
  descripcion: z.string().min(1).max(300).optional(),
  cantidadMeta: z.number().int().min(1).optional(),
  cantidadCompletada: z.number().int().min(0).optional(),
  activo: z.boolean().optional(),
});

export const progresoTareaSchema = z.object({
  cantidadCompletada: z.number().int().min(0),
});

export const crearObjetivoSchema = z.object({
  mes: z.string(), // ISO date "YYYY-MM-DD" (inicio del mes)
  descripcion: z.string().min(1).max(300),
  cantidadMeta: z.number().int().min(1).default(1),
});

export const actualizarObjetivoSchema = z.object({
  descripcion: z.string().min(1).max(300).optional(),
  cantidadMeta: z.number().int().min(1).optional(),
  cantidadCompletada: z.number().int().min(0).optional(),
});

export const progresoObjetivoSchema = z.object({
  cantidadCompletada: z.number().int().min(0),
});

export type CrearInfluencerInput = z.infer<typeof crearInfluencerSchema>;
export type ActualizarInfluencerInput = z.infer<typeof actualizarInfluencerSchema>;
export type CrearMetricaInput = z.infer<typeof crearMetricaSchema>;
export type CrearTareaInput = z.infer<typeof crearTareaSchema>;
export type ActualizarTareaInput = z.infer<typeof actualizarTareaSchema>;
export type ProgresoTareaInput = z.infer<typeof progresoTareaSchema>;
export type CrearObjetivoInput = z.infer<typeof crearObjetivoSchema>;
export type ActualizarObjetivoInput = z.infer<typeof actualizarObjetivoSchema>;
export type ProgresoObjetivoInput = z.infer<typeof progresoObjetivoSchema>;
