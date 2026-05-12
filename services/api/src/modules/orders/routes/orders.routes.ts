import { Router } from "express";
import { UserRole } from "@prisma/client";

import { authenticate } from "../../../middlewares/authenticate";
import { validateRequest } from "../../../middlewares/validate-request";
import { ordersController } from "../controllers/orders.controller";
import { createOrderSchema, updateOrderStatusSchema } from "../orders.schemas";

export const ordersRoutes = Router();

ordersRoutes.get("/me", authenticate(), ordersController.listMine);
ordersRoutes.get("/", authenticate([UserRole.ADMIN]), ordersController.listAll);
ordersRoutes.post("/", authenticate(), validateRequest(createOrderSchema), ordersController.create);
ordersRoutes.patch("/:id/status", authenticate([UserRole.ADMIN]), validateRequest(updateOrderStatusSchema), ordersController.updateStatus);

