import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/error.js";
import * as controller from "../controllers/calendario.controller.js";

const router = Router();

router.get("/", requireAuth, asyncHandler(controller.listar));
router.post("/", requireAuth, asyncHandler(controller.crear));
router.patch("/:id", requireAuth, asyncHandler(controller.actualizar));
router.delete("/:id", requireAuth, asyncHandler(controller.eliminar));

export default router;
