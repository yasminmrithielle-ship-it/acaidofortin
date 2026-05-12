import { Router } from "express";
import { UserRole } from "@prisma/client";

import { authenticate } from "../../../middlewares/authenticate";
import { validateRequest } from "../../../middlewares/validate-request";
import { notificationsController } from "../controllers/notifications.controller";
import { broadcastNotificationSchema } from "../notifications.schemas";

export const notificationsRoutes = Router();

notificationsRoutes.get("/me", authenticate(), notificationsController.mine);
notificationsRoutes.post("/broadcast", authenticate([UserRole.ADMIN]), validateRequest(broadcastNotificationSchema), notificationsController.broadcast);

