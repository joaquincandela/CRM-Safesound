import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/error.js";
import * as controller from "../controllers/usuarios.controller.js";

const router = Router();

router.post("/", requireAuth, requireRole("ADMIN"), asyncHandler(controller.crear));
router.get("/", requireAuth, requireRole("ADMIN"), asyncHandler(controller.listar));
router.get("/:id", requireAuth, requireRole("ADMIN"), asyncHandler(controller.obtener));
router.patch("/:id", requireAuth, requireRole("ADMIN"), asyncHandler(controller.actualizar));
router.delete("/:id", requireAuth, requireRole("ADMIN"), asyncHandler(controller.eliminar));

export default router;
