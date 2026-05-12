import { Router } from "express";

import { authenticate } from "../../../middlewares/authenticate";
import { validateRequest } from "../../../middlewares/validate-request";
import { reviewsController } from "../controllers/reviews.controller";
import { createReviewSchema } from "../reviews.schemas";

export const reviewsRoutes = Router();

reviewsRoutes.get("/product/:productId", reviewsController.listByProduct);
reviewsRoutes.post("/", authenticate(), validateRequest(createReviewSchema), reviewsController.create);

