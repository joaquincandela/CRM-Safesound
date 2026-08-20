import { Router } from "express";
import * as ctrl from "../controllers/auth.controller.js";
import { asyncHandler } from "../middleware/error.js";
import { validate } from "../middleware/validate.js";
import { loginBody } from "../validators/auth.validator.js";

const router = Router();

router.post("/login", validate({ body: loginBody }), asyncHandler(ctrl.login));

export default router;
