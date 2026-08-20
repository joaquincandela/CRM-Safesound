-- CreateEnum
CREATE TYPE "EstadoCosteo" AS ENUM ('BORRADOR', 'CONFIRMADO');

-- AlterTable
ALTER TABLE "movimientos_inventario" ADD COLUMN     "costoUnitario" DECIMAL(12,2);

-- AlterTable
ALTER TABLE "productos" ADD COLUMN     "ultimaImportacionFecha" TIMESTAMP(3),
ADD COLUMN     "ultimoCosteoId" TEXT;

-- CreateTable
CREATE TABLE "costeos_importacion" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "recepcionId" TEXT NOT NULL,
    "ordenId" TEXT NOT NULL,
    "proveedorId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "moneda" TEXT NOT NULL DEFAULT 'PEN',
    "tipoCambio" DECIMAL(12,4),
    "costoProductos" DECIMAL(12,2) NOT NULL,
    "comisionBancaria" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "comisionPlataforma" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "courierFlete" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "seguro" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "aduanas" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "almacenaje" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "transporteLocal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "otros" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "gastosTotal" DECIMAL(12,2) NOT NULL,
    "costoTotal" DECIMAL(12,2) NOT NULL,
    "costoUnitario" DECIMAL(12,2) NOT NULL,
    "observaciones" TEXT,
    "estado" "EstadoCosteo" NOT NULL DEFAULT 'BORRADOR',
    "usuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "costeos_importacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lotes_importacion" (
    "id" TEXT NOT NULL,
    "costeoId" TEXT NOT NULL,
    "recepcionId" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "costoUnitario" DECIMAL(12,2) NOT NULL,
    "costoTotal" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lotes_importacion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "costeos_importacion_numero_key" ON "costeos_importacion"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "costeos_importacion_recepcionId_key" ON "costeos_importacion"("recepcionId");

-- CreateIndex
CREATE INDEX "costeos_importacion_ordenId_idx" ON "costeos_importacion"("ordenId");

-- CreateIndex
CREATE INDEX "costeos_importacion_proveedorId_idx" ON "costeos_importacion"("proveedorId");

-- CreateIndex
CREATE INDEX "costeos_importacion_fecha_idx" ON "costeos_importacion"("fecha");

-- CreateIndex
CREATE INDEX "lotes_importacion_costeoId_idx" ON "lotes_importacion"("costeoId");

-- CreateIndex
CREATE INDEX "lotes_importacion_productoId_idx" ON "lotes_importacion"("productoId");

-- AddForeignKey
ALTER TABLE "productos" ADD CONSTRAINT "productos_ultimoCosteoId_fkey" FOREIGN KEY ("ultimoCosteoId") REFERENCES "costeos_importacion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "costeos_importacion" ADD CONSTRAINT "costeos_importacion_recepcionId_fkey" FOREIGN KEY ("recepcionId") REFERENCES "recepciones_mercaderia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "costeos_importacion" ADD CONSTRAINT "costeos_importacion_ordenId_fkey" FOREIGN KEY ("ordenId") REFERENCES "ordenes_compra"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "costeos_importacion" ADD CONSTRAINT "costeos_importacion_proveedorId_fkey" FOREIGN KEY ("proveedorId") REFERENCES "proveedores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "costeos_importacion" ADD CONSTRAINT "costeos_importacion_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lotes_importacion" ADD CONSTRAINT "lotes_importacion_costeoId_fkey" FOREIGN KEY ("costeoId") REFERENCES "costeos_importacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lotes_importacion" ADD CONSTRAINT "lotes_importacion_recepcionId_fkey" FOREIGN KEY ("recepcionId") REFERENCES "recepciones_mercaderia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lotes_importacion" ADD CONSTRAINT "lotes_importacion_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
