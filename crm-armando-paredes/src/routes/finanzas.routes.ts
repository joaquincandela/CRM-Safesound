import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/error.js";
import * as controller from "../controllers/finanzas.controller.js";

const router = Router();

router.get("/resumen", requireAuth, requireRole("ADMIN"), asyncHandler(controller.obtenerResumen));

export default router;
