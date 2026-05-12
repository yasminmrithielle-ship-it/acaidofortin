import { Router } from "express";
import { UserRole } from "@prisma/client";

import { authenticate } from "../../../middlewares/authenticate";
import { validateRequest } from "../../../middlewares/validate-request";
import { categoriesController } from "../controllers/categories.controller";
import { createCategorySchema, updateCategorySchema } from "../categories.schemas";

export const categoriesRoutes = Router();

categoriesRoutes.get("/", categoriesController.listPublic);
categoriesRoutes.get("/admin", authenticate([UserRole.ADMIN]), categoriesController.listAdmin);
categoriesRoutes.post("/", authenticate([UserRole.ADMIN]), validateRequest(createCategorySchema), categoriesController.create);
categoriesRoutes.patch("/:id", authenticate([UserRole.ADMIN]), validateRequest(updateCategorySchema), categoriesController.update);

