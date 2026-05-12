import { Router } from "express";
import { UserRole } from "@prisma/client";

import { authenticate } from "../../../middlewares/authenticate";
import { validateRequest } from "../../../middlewares/validate-request";
import { bannersController } from "../controllers/banners.controller";
import { createBannerSchema, updateBannerSchema } from "../banners.schemas";

export const bannersRoutes = Router();

bannersRoutes.get("/", bannersController.listPublic);
bannersRoutes.get("/admin", authenticate([UserRole.ADMIN]), bannersController.listAdmin);
bannersRoutes.post("/", authenticate([UserRole.ADMIN]), validateRequest(createBannerSchema), bannersController.create);
bannersRoutes.patch("/:id", authenticate([UserRole.ADMIN]), validateRequest(updateBannerSchema), bannersController.update);

