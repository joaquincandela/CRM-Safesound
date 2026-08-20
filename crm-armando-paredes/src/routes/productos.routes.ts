import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/error.js";
import { validate } from "../middleware/validate.js";
import { crearProductoSchema, actualizarProductoSchema } from "../validators/productos.validator.js";
import * as controller from "../controllers/productos.controller.js";

const router = Router();

router.post("/", requireAuth, requireRole("ADMIN", "INVENTARIO"), validate({ body: crearProductoSchema }), asyncHandler(controller.crear));
router.get("/", requireAuth, asyncHandler(controller.listar));
router.get("/:id", requireAuth, asyncHandler(controller.obtener));
router.get("/:id/stock", requireAuth, asyncHandler(controller.obtenerStock));
router.patch("/:id", requireAuth, requireRole("ADMIN", "INVENTARIO"), validate({ body: actualizarProductoSchema }), asyncHandler(controller.actualizar));
router.delete("/:id", requireAuth, requireRole("ADMIN", "INVENTARIO"), asyncHandler(controller.eliminar));

export default router;
