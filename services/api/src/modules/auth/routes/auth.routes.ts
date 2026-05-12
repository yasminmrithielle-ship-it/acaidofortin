import { Router } from "express";

import { authenticate } from "../../../middlewares/authenticate";
import { validateRequest } from "../../../middlewares/validate-request";
import { authController } from "../controllers/auth.controller";
import { loginSchema, registerSchema, socialLoginSchema } from "../auth.schemas";

export const authRoutes = Router();

authRoutes.post("/register", validateRequest(registerSchema), authController.register);
authRoutes.post("/login", validateRequest(loginSchema), authController.login);
authRoutes.post("/social", validateRequest(socialLoginSchema), authController.socialLogin);
authRoutes.get("/me", authenticate(), authController.me);

