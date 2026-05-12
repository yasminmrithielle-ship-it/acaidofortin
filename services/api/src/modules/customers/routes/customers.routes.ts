import { Router } from "express";
import { UserRole } from "@prisma/client";

import { authenticate } from "../../../middlewares/authenticate";
import { validateRequest } from "../../../middlewares/validate-request";
import { customersController } from "../controllers/customers.controller";
import { createAddressSchema, favoriteParamsSchema } from "../customers.schemas";

export const customersRoutes = Router();

customersRoutes.get("/", authenticate([UserRole.ADMIN]), customersController.listCustomers);
customersRoutes.get("/me", authenticate(), customersController.getMe);
customersRoutes.post("/me/addresses", authenticate(), validateRequest(createAddressSchema), customersController.addAddress);
customersRoutes.get("/me/favorites", authenticate(), customersController.getFavorites);
customersRoutes.post("/me/favorites/:productId", authenticate(), validateRequest(favoriteParamsSchema), customersController.toggleFavorite);

