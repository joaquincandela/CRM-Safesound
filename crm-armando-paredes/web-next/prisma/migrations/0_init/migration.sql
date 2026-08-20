-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "LineaNegocio" AS ENUM ('VENTA_VIVIENDA', 'RENTA_INMOBILIARIA', 'DESARROLLO_TERCEROS');

-- CreateEnum
CREATE TYPE "TipoUnidad" AS ENUM ('DEPARTAMENTO', 'LOFT', 'TOWNHOUSE', 'OFICINA', 'HOTEL');

-- CreateEnum
CREATE TYPE "EstadoProyecto" AS ENUM ('EN_VENTA', 'EN_CONSTRUCCION', 'ENTREGADO');

-- CreateEnum
CREATE TYPE "EstadoUnidad" AS ENUM ('DISPONIBLE', 'RESERVADA', 'VENDIDA');

-- CreateEnum
CREATE TYPE "VistaUnidad" AS ENUM ('MAR', 'PARQUE', 'CIUDAD', 'INTERIOR');

-- CreateEnum
CREATE TYPE "FuenteProspecto" AS ENUM ('INSTAGRAM', 'URBANIA', 'WHATSAPP', 'REFERIDO', 'FERIA', 'WEB');

-- CreateEnum
CREATE TYPE "TipoCompra" AS ENUM ('VIVIENDA', 'INVERSION');

-- CreateEnum
CREATE TYPE "TipoContacto" AS ENUM ('CONYUGE', 'SOCIO', 'FAMILIAR', 'OTRO');

-- CreateEnum
CREATE TYPE "TipoInteraccion" AS ENUM ('WHATSAPP', 'EMAIL', 'VISITA', 'LLAMADA');

-- CreateEnum
CREATE TYPE "EtapaPipeline" AS ENUM ('NUEVO', 'CONTACTADO', 'CALIFICADO', 'VISITA_AGENDADA', 'PROPUESTA', 'NEGOCIACION', 'RESERVA', 'CERRADO_GANADO', 'CERRADO_PERDIDO');

-- CreateEnum
CREATE TYPE "EstadoReserva" AS ENUM ('ACTIVA', 'VENCIDA', 'CONVERTIDA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "FormaPago" AS ENUM ('CONTADO', 'CREDITO_HIPOTECARIO', 'MIXTO');

-- CreateEnum
CREATE TYPE "EstadoIncentivo" AS ENUM ('PENDIENTE', 'APROBADO', 'PAGADO', 'RECHAZADO');

-- CreateEnum
CREATE TYPE "EstadoMensaje" AS ENUM ('PENDIENTE', 'PROCESADO', 'ERROR');

-- CreateEnum
CREATE TYPE "CanalMensaje" AS ENUM ('WHATSAPP', 'FORMULARIO_WEB', 'URBANIA');

-- CreateTable
CREATE TABLE "asesores" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefono" TEXT,
    "passwordHash" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "asesores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proyectos" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "linea" "LineaNegocio" NOT NULL,
    "distrito" TEXT NOT NULL,
    "direccion" TEXT,
    "estado" "EstadoProyecto" NOT NULL DEFAULT 'EN_CONSTRUCCION',
    "fechaEntrega" TIMESTAMP(3),
    "avanceObra" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "proyectos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "unidades" (
    "id" TEXT NOT NULL,
    "proyectoId" TEXT NOT NULL,
    "piso" INTEGER NOT NULL,
    "numero" TEXT NOT NULL,
    "area" DECIMAL(8,2) NOT NULL,
    "dormitorios" INTEGER NOT NULL,
    "banos" INTEGER NOT NULL DEFAULT 1,
    "precio" DECIMAL(12,2) NOT NULL,
    "estado" "EstadoUnidad" NOT NULL DEFAULT 'DISPONIBLE',
    "vista" "VistaUnidad" NOT NULL DEFAULT 'INTERIOR',
    "tieneTerraza" BOOLEAN NOT NULL DEFAULT false,
    "estacionamientos" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "unidades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prospectos" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT,
    "telefono" TEXT NOT NULL,
    "fuente" "FuenteProspecto" NOT NULL,
    "tipoCompra" "TipoCompra" NOT NULL DEFAULT 'VIVIENDA',
    "presupuesto" DECIMAL(12,2),
    "hipotecaPreAprobada" BOOLEAN NOT NULL DEFAULT false,
    "hipotecaVenceEl" TIMESTAMP(3),
    "fechaMudanzaEst" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prospectos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contactos_adicionales" (
    "id" TEXT NOT NULL,
    "prospectoId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT,
    "telefono" TEXT,
    "relacion" "TipoContacto" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contactos_adicionales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interacciones" (
    "id" TEXT NOT NULL,
    "prospectoId" TEXT NOT NULL,
    "oportunidadId" TEXT,
    "asesorId" TEXT,
    "tipo" "TipoInteraccion" NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resumen" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "interacciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "score_eventos" (
    "id" TEXT NOT NULL,
    "prospectoId" TEXT NOT NULL,
    "oportunidadId" TEXT,
    "accion" TEXT NOT NULL,
    "puntos" INTEGER NOT NULL,
    "scoreResultante" INTEGER NOT NULL,
    "explicacion" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "score_eventos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oportunidades" (
    "id" TEXT NOT NULL,
    "prospectoId" TEXT NOT NULL,
    "proyectoId" TEXT NOT NULL,
    "asesorId" TEXT,
    "etapa" "EtapaPipeline" NOT NULL DEFAULT 'NUEVO',
    "score" INTEGER NOT NULL DEFAULT 0,
    "valorEstimado" DECIMAL(12,2),
    "ultimaActividad" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "motivoPerdida" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "oportunidades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservas" (
    "id" TEXT NOT NULL,
    "oportunidadId" TEXT NOT NULL,
    "unidadId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "montoSeparacion" DECIMAL(12,2) NOT NULL,
    "vencimiento" TIMESTAMP(3),
    "estado" "EstadoReserva" NOT NULL DEFAULT 'ACTIVA',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reservas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ventas" (
    "id" TEXT NOT NULL,
    "reservaId" TEXT NOT NULL,
    "precioFinal" DECIMAL(12,2) NOT NULL,
    "formaPago" "FormaPago" NOT NULL,
    "fechaEscritura" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ventas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referidos" (
    "id" TEXT NOT NULL,
    "referidoPorId" TEXT NOT NULL,
    "referidoNuevoId" TEXT NOT NULL,
    "proyectoId" TEXT,
    "incentivo" DECIMAL(12,2),
    "estadoIncentivo" "EstadoIncentivo" NOT NULL DEFAULT 'PENDIENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "referidos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mensajes_entrantes" (
    "id" TEXT NOT NULL,
    "canal" "CanalMensaje" NOT NULL,
    "telefono" TEXT,
    "email" TEXT,
    "nombre" TEXT,
    "contenido" TEXT,
    "payload" JSONB NOT NULL,
    "externalId" TEXT,
    "estado" "EstadoMensaje" NOT NULL DEFAULT 'PENDIENTE',
    "intentos" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "procesadoEn" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mensajes_entrantes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_AsesorProyectos" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_AsesorProyectos_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_UnidadesDeInteres" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_UnidadesDeInteres_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "asesores_email_key" ON "asesores"("email");

-- CreateIndex
CREATE INDEX "asesores_activo_idx" ON "asesores"("activo");

-- CreateIndex
CREATE INDEX "proyectos_estado_idx" ON "proyectos"("estado");

-- CreateIndex
CREATE INDEX "proyectos_linea_idx" ON "proyectos"("linea");

-- CreateIndex
CREATE INDEX "proyectos_distrito_idx" ON "proyectos"("distrito");

-- CreateIndex
CREATE INDEX "unidades_estado_idx" ON "unidades"("estado");

-- CreateIndex
CREATE INDEX "unidades_proyectoId_estado_idx" ON "unidades"("proyectoId", "estado");

-- CreateIndex
CREATE INDEX "unidades_precio_idx" ON "unidades"("precio");

-- CreateIndex
CREATE UNIQUE INDEX "unidades_proyectoId_numero_key" ON "unidades"("proyectoId", "numero");

-- CreateIndex
CREATE INDEX "prospectos_fuente_idx" ON "prospectos"("fuente");

-- CreateIndex
CREATE INDEX "prospectos_tipoCompra_idx" ON "prospectos"("tipoCompra");

-- CreateIndex
CREATE INDEX "prospectos_telefono_idx" ON "prospectos"("telefono");

-- CreateIndex
CREATE INDEX "contactos_adicionales_prospectoId_idx" ON "contactos_adicionales"("prospectoId");

-- CreateIndex
CREATE INDEX "interacciones_prospectoId_fecha_idx" ON "interacciones"("prospectoId", "fecha");

-- CreateIndex
CREATE INDEX "interacciones_oportunidadId_idx" ON "interacciones"("oportunidadId");

-- CreateIndex
CREATE INDEX "interacciones_fecha_idx" ON "interacciones"("fecha");

-- CreateIndex
CREATE INDEX "score_eventos_prospectoId_createdAt_idx" ON "score_eventos"("prospectoId", "createdAt");

-- CreateIndex
CREATE INDEX "score_eventos_oportunidadId_idx" ON "score_eventos"("oportunidadId");

-- CreateIndex
CREATE INDEX "score_eventos_scoreResultante_idx" ON "score_eventos"("scoreResultante");

-- CreateIndex
CREATE INDEX "oportunidades_etapa_idx" ON "oportunidades"("etapa");

-- CreateIndex
CREATE INDEX "oportunidades_score_idx" ON "oportunidades"("score");

-- CreateIndex
CREATE INDEX "oportunidades_etapa_score_idx" ON "oportunidades"("etapa", "score");

-- CreateIndex
CREATE INDEX "oportunidades_asesorId_etapa_idx" ON "oportunidades"("asesorId", "etapa");

-- CreateIndex
CREATE INDEX "oportunidades_ultimaActividad_idx" ON "oportunidades"("ultimaActividad");

-- CreateIndex
CREATE INDEX "reservas_estado_idx" ON "reservas"("estado");

-- CreateIndex
CREATE INDEX "reservas_unidadId_idx" ON "reservas"("unidadId");

-- CreateIndex
CREATE INDEX "reservas_oportunidadId_idx" ON "reservas"("oportunidadId");

-- CreateIndex
CREATE UNIQUE INDEX "ventas_reservaId_key" ON "ventas"("reservaId");

-- CreateIndex
CREATE INDEX "ventas_fechaEscritura_idx" ON "ventas"("fechaEscritura");

-- CreateIndex
CREATE INDEX "referidos_estadoIncentivo_idx" ON "referidos"("estadoIncentivo");

-- CreateIndex
CREATE UNIQUE INDEX "referidos_referidoPorId_referidoNuevoId_key" ON "referidos"("referidoPorId", "referidoNuevoId");

-- CreateIndex
CREATE INDEX "mensajes_entrantes_estado_createdAt_idx" ON "mensajes_entrantes"("estado", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "mensajes_entrantes_canal_externalId_key" ON "mensajes_entrantes"("canal", "externalId");

-- CreateIndex
CREATE INDEX "_AsesorProyectos_B_index" ON "_AsesorProyectos"("B");

-- CreateIndex
CREATE INDEX "_UnidadesDeInteres_B_index" ON "_UnidadesDeInteres"("B");

-- AddForeignKey
ALTER TABLE "unidades" ADD CONSTRAINT "unidades_proyectoId_fkey" FOREIGN KEY ("proyectoId") REFERENCES "proyectos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contactos_adicionales" ADD CONSTRAINT "contactos_adicionales_prospectoId_fkey" FOREIGN KEY ("prospectoId") REFERENCES "prospectos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interacciones" ADD CONSTRAINT "interacciones_prospectoId_fkey" FOREIGN KEY ("prospectoId") REFERENCES "prospectos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interacciones" ADD CONSTRAINT "interacciones_oportunidadId_fkey" FOREIGN KEY ("oportunidadId") REFERENCES "oportunidades"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interacciones" ADD CONSTRAINT "interacciones_asesorId_fkey" FOREIGN KEY ("asesorId") REFERENCES "asesores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "score_eventos" ADD CONSTRAINT "score_eventos_prospectoId_fkey" FOREIGN KEY ("prospectoId") REFERENCES "prospectos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "score_eventos" ADD CONSTRAINT "score_eventos_oportunidadId_fkey" FOREIGN KEY ("oportunidadId") REFERENCES "oportunidades"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oportunidades" ADD CONSTRAINT "oportunidades_prospectoId_fkey" FOREIGN KEY ("prospectoId") REFERENCES "prospectos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oportunidades" ADD CONSTRAINT "oportunidades_proyectoId_fkey" FOREIGN KEY ("proyectoId") REFERENCES "proyectos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oportunidades" ADD CONSTRAINT "oportunidades_asesorId_fkey" FOREIGN KEY ("asesorId") REFERENCES "asesores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservas" ADD CONSTRAINT "reservas_oportunidadId_fkey" FOREIGN KEY ("oportunidadId") REFERENCES "oportunidades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservas" ADD CONSTRAINT "reservas_unidadId_fkey" FOREIGN KEY ("unidadId") REFERENCES "unidades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas" ADD CONSTRAINT "ventas_reservaId_fkey" FOREIGN KEY ("reservaId") REFERENCES "reservas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referidos" ADD CONSTRAINT "referidos_referidoPorId_fkey" FOREIGN KEY ("referidoPorId") REFERENCES "prospectos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referidos" ADD CONSTRAINT "referidos_referidoNuevoId_fkey" FOREIGN KEY ("referidoNuevoId") REFERENCES "prospectos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referidos" ADD CONSTRAINT "referidos_proyectoId_fkey" FOREIGN KEY ("proyectoId") REFERENCES "proyectos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AsesorProyectos" ADD CONSTRAINT "_AsesorProyectos_A_fkey" FOREIGN KEY ("A") REFERENCES "asesores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AsesorProyectos" ADD CONSTRAINT "_AsesorProyectos_B_fkey" FOREIGN KEY ("B") REFERENCES "proyectos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UnidadesDeInteres" ADD CONSTRAINT "_UnidadesDeInteres_A_fkey" FOREIGN KEY ("A") REFERENCES "oportunidades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UnidadesDeInteres" ADD CONSTRAINT "_UnidadesDeInteres_B_fkey" FOREIGN KEY ("B") REFERENCES "unidades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

