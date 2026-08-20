import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/error.js";
import * as controller from "../controllers/recepciones.controller.js";

const router = Router();

router.post("/", requireAuth, requireRole("ADMIN", "INVENTARIO", "OPERACIONES"), asyncHandler(controller.crear));
router.get("/", requireAuth, asyncHandler(controller.listar));
router.get("/:id", requireAuth, asyncHandler(controller.obtener));
router.delete("/:id", requireAuth, requireRole("ADMIN", "INVENTARIO"), asyncHandler(controller.eliminar));

export default router;
