import { z } from "zod";

export const MONEDAS_COSTEO = ["PEN", "USD"] as const;
type Moneda = (typeof MONEDAS_COSTEO)[number];

// Cada gasto de importación tiene su propio monto y su propia moneda.
const gastoCreate = () =>
  z.object({
    monto: z.number().nonnegative().default(0),
    moneda: z.enum(MONEDAS_COSTEO).default("PEN"),
  });

// En edición, solo se tocan los gastos enviados; el resto se conserva.
const gastoUpdate = () =>
  z.object({
    monto: z.number().nonnegative().optional(),
    moneda: z.enum(MONEDAS_COSTEO).optional(),
  });

export const crearCosteoSchema = z.object({
  recepcionId: z.string(),
  fecha: z.string().optional(),
  moneda: z.enum(MONEDAS_COSTEO).default("PEN"),
  tipoCambio: z.number().positive().optional(),
  gastos: z
    .object({
      comisionBancaria: gastoCreate(),
      comisionPlataforma: gastoCreate(),
      courierFlete: gastoCreate(),
      seguro: gastoCreate(),
      aduanas: gastoCreate(),
      almacenaje: gastoCreate(),
      transporteLocal: gastoCreate(),
      otros: gastoCreate(),
    })
    .optional(),
  observaciones: z.string().optional(),
});

export const actualizarCosteoSchema = z.object({
  fecha: z.string().optional(),
  moneda: z.enum(MONEDAS_COSTEO).optional(),
  tipoCambio: z.number().positive().optional(),
  gastos: z
    .object({
      comisionBancaria: gastoUpdate(),
      comisionPlataforma: gastoUpdate(),
      courierFlete: gastoUpdate(),
      seguro: gastoUpdate(),
      aduanas: gastoUpdate(),
      almacenaje: gastoUpdate(),
      transporteLocal: gastoUpdate(),
      otros: gastoUpdate(),
    })
    .optional(),
  observaciones: z.string().optional(),
});

export type CrearCosteoInput = z.infer<typeof crearCosteoSchema>;
export type ActualizarCosteoInput = z.infer<typeof actualizarCosteoSchema>;
export type GastosImportacionInput = z.infer<NonNullable<CrearCosteoInput["gastos"]>>;
export type { Moneda };
