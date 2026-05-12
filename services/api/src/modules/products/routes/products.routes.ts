import { Router } from "express";
import { UserRole } from "@prisma/client";

import { authenticate } from "../../../middlewares/authenticate";
import { validateRequest } from "../../../middlewares/validate-request";
import { productsController } from "../controllers/products.controller";
import { createProductSchema, productsQuerySchema, updateProductSchema } from "../products.schemas";

export const productsRoutes = Router();

productsRoutes.get("/", validateRequest(productsQuerySchema), productsController.list);
productsRoutes.get("/admin", authenticate([UserRole.ADMIN]), productsController.listAdmin);
productsRoutes.get("/:id", productsController.getById);
productsRoutes.post("/", authenticate([UserRole.ADMIN]), validateRequest(createProductSchema), productsController.create);
productsRoutes.patch("/:id", authenticate([UserRole.ADMIN]), validateRequest(updateProductSchema), productsController.update);

