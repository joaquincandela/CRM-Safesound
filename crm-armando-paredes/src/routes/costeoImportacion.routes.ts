import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../middleware/error.js";
import * as controller from "../controllers/costeoImportacion.controller.js";
import { crearCosteoSchema, actualizarCosteoSchema } from "../validators/costeoImportacion.validator.js";

const router = Router();

router.post("/", requireAuth, requireRole("ADMIN", "INVENTARIO", "OPERACIONES"), validate({ body: crearCosteoSchema }), asyncHandler(controller.crear));
router.get("/", requireAuth, asyncHandler(controller.listar));
router.get("/:id", requireAuth, asyncHandler(controller.obtener));
router.patch("/:id", requireAuth, requireRole("ADMIN", "INVENTARIO", "OPERACIONES"), validate({ body: actualizarCosteoSchema }), asyncHandler(controller.actualizar));
router.post("/:id/confirmar", requireAuth, requireRole("ADMIN", "INVENTARIO", "OPERACIONES"), asyncHandler(controller.confirmar));
router.delete("/:id", requireAuth, requireRole("ADMIN", "INVENTARIO", "OPERACIONES"), asyncHandler(controller.eliminar));

export default router;
