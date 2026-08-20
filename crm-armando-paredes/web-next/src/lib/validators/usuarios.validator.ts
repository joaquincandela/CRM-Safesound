import { z } from "zod";

const roles = ["ADMIN", "VENTAS", "INVENTARIO", "OPERACIONES"] as const;

export const crearUsuarioSchema = z.object({
  nombre: z.string().min(1).max(200),
  email: z.string().email(),
  telefono: z.string().max(50).optional(),
  password: z.string().min(6).max(100),
  rol: z.enum(roles).default("VENTAS"),
  activo: z.boolean().optional().default(true),
});

export const actualizarUsuarioSchema = z.object({
  nombre: z.string().min(1).max(200).optional(),
  email: z.string().email().optional(),
  telefono: z.string().max(50).optional(),
  password: z.string().min(6).max(100).optional(),
  rol: z.enum(roles).optional(),
  activo: z.boolean().optional(),
});

export type CrearUsuarioInput = z.infer<typeof crearUsuarioSchema>;
export type ActualizarUsuarioInput = z.infer<typeof actualizarUsuarioSchema>;
