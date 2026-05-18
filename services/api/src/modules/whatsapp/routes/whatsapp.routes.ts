import { Router } from "express";
import { UserRole } from "@prisma/client";

import { authenticate } from "../../../middlewares/authenticate";
import { whatsappController } from "../controllers/whatsapp.controller";

export const whatsappRoutes = Router();

whatsappRoutes.get("/connection", authenticate([UserRole.ADMIN]), whatsappController.connection);
