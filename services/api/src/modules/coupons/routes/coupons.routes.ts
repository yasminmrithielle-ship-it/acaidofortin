import { Router } from "express";
import { UserRole } from "@prisma/client";

import { authenticate } from "../../../middlewares/authenticate";
import { validateRequest } from "../../../middlewares/validate-request";
import { couponsController } from "../controllers/coupons.controller";
import { createCouponSchema, validateCouponSchema } from "../coupons.schemas";

export const couponsRoutes = Router();

couponsRoutes.get("/", authenticate([UserRole.ADMIN]), couponsController.list);
couponsRoutes.post("/", authenticate([UserRole.ADMIN]), validateRequest(createCouponSchema), couponsController.create);
couponsRoutes.post("/validate", validateRequest(validateCouponSchema), couponsController.validate);

