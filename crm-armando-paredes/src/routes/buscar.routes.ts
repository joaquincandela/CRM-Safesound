import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/error.js";
import * as controller from "../controllers/buscar.controller.js";

const router = Router();

router.get("/", requireAuth, asyncHandler(controller.buscar));

export default router;
