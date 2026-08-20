-- Gastos de importación: moneda propia por cada gasto.
ALTER TABLE "costeos_importacion" ADD COLUMN "comisionBancariaMoneda" TEXT NOT NULL DEFAULT 'PEN';
ALTER TABLE "costeos_importacion" ADD COLUMN "comisionPlataformaMoneda" TEXT NOT NULL DEFAULT 'PEN';
ALTER TABLE "costeos_importacion" ADD COLUMN "courierFleteMoneda" TEXT NOT NULL DEFAULT 'PEN';
ALTER TABLE "costeos_importacion" ADD COLUMN "seguroMoneda" TEXT NOT NULL DEFAULT 'PEN';
ALTER TABLE "costeos_importacion" ADD COLUMN "aduanasMoneda" TEXT NOT NULL DEFAULT 'PEN';
ALTER TABLE "costeos_importacion" ADD COLUMN "almacenajeMoneda" TEXT NOT NULL DEFAULT 'PEN';
ALTER TABLE "costeos_importacion" ADD COLUMN "transporteLocalMoneda" TEXT NOT NULL DEFAULT 'PEN';
ALTER TABLE "costeos_importacion" ADD COLUMN "otrosMoneda" TEXT NOT NULL DEFAULT 'PEN';
