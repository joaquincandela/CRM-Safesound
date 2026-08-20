import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/error.js";
import * as controller from "../controllers/influencers.controller.js";

const router = Router();

router.post("/", requireAuth, requireRole("ADMIN"), asyncHandler(controller.crear));
router.get("/", requireAuth, requireRole("ADMIN", "VENTAS"), asyncHandler(controller.listar));
router.get("/top", requireAuth, requireRole("ADMIN", "VENTAS"), asyncHandler(controller.topInfluencers));
router.get("/mi", requireAuth, requireRole("INFLUENCER"), asyncHandler(controller.mi));
router.patch("/mi/tareas/:tareaId", requireAuth, requireRole("INFLUENCER"), asyncHandler(controller.marcarMiTarea));
router.patch("/mi/objetivo/:objetivoId", requireAuth, requireRole("INFLUENCER"), asyncHandler(controller.marcarMiObjetivo));
router.get("/:id", requireAuth, requireRole("ADMIN", "VENTAS"), asyncHandler(controller.obtener));
router.patch("/:id", requireAuth, requireRole("ADMIN"), asyncHandler(controller.actualizar));
router.delete("/:id", requireAuth, requireRole("ADMIN"), asyncHandler(controller.eliminar));
router.post("/:id/metricas", requireAuth, requireRole("ADMIN", "VENTAS"), asyncHandler(controller.crearMetrica));
router.patch("/:id/metricas/:metricaId", requireAuth, requireRole("ADMIN", "VENTAS"), asyncHandler(controller.actualizarMetrica));
router.get("/:id/metricas", requireAuth, requireRole("ADMIN", "VENTAS"), asyncHandler(controller.listarMetricas));
router.post("/:id/tareas", requireAuth, requireRole("ADMIN"), asyncHandler(controller.crearTarea));
router.patch("/:id/tareas/:tareaId", requireAuth, requireRole("ADMIN"), asyncHandler(controller.actualizarTarea));
router.delete("/:id/tareas/:tareaId", requireAuth, requireRole("ADMIN"), asyncHandler(controller.eliminarTarea));
router.post("/:id/objetivo", requireAuth, requireRole("ADMIN"), asyncHandler(controller.crearObjetivo));
router.patch("/:id/objetivo/:objetivoId", requireAuth, requireRole("ADMIN"), asyncHandler(controller.actualizarObjetivo));
router.delete("/:id/objetivo/:objetivoId", requireAuth, requireRole("ADMIN"), asyncHandler(controller.eliminarObjetivo));

export default router;
