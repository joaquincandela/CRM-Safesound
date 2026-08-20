import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/error.js";
import * as controller from "../controllers/dashboard.controller.js";

const router = Router();

router.get("/kpis", requireAuth, requireRole("ADMIN", "VENTAS", "INVENTARIO", "OPERACIONES"), asyncHandler(controller.obtenerKPIs));

export default router;
