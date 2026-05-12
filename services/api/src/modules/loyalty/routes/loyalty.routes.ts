import { Router } from "express";
import { UserRole } from "@prisma/client";

import { authenticate } from "../../../middlewares/authenticate";
import { validateRequest } from "../../../middlewares/validate-request";
import { loyaltyController } from "../controllers/loyalty.controller";
import { adjustLoyaltySchema } from "../loyalty.schemas";

export const loyaltyRoutes = Router();

loyaltyRoutes.get("/me", authenticate(), loyaltyController.me);
loyaltyRoutes.post("/adjust", authenticate([UserRole.ADMIN]), validateRequest(adjustLoyaltySchema), loyaltyController.adjust);

