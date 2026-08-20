import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/error.js";
import * as controller from "../controllers/movimientos.controller.js";

const router = Router();

router.post("/", requireAuth, requireRole("ADMIN", "INVENTARIO", "OPERACIONES"), asyncHandler(controller.registrar));
router.get("/", requireAuth, asyncHandler(controller.listar));
router.get("/producto/:id/kardex", requireAuth, asyncHandler(controller.obtenerKardex));
router.get("/producto/:id/stock", requireAuth, asyncHandler(controller.obtenerStock));
router.get("/stock", requireAuth, asyncHandler(controller.obtenerStocksGlobal));

export default router;
