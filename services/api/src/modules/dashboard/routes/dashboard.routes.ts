import { Router } from "express";
import { UserRole } from "@prisma/client";

import { authenticate } from "../../../middlewares/authenticate";
import { dashboardController } from "../controllers/dashboard.controller";

export const dashboardRoutes = Router();

dashboardRoutes.get("/summary", authenticate([UserRole.ADMIN]), dashboardController.summary);

