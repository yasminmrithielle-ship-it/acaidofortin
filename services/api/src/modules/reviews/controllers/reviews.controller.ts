import { Request, Response } from "express";

import { reviewsService } from "../services/reviews.service";

export const reviewsController = {
  async create(request: Request, response: Response) {
    const result = await reviewsService.create(request.user!.sub, request.body);
    return response.status(201).json(result);
  },

  async listByProduct(request: Request, response: Response) {
    const result = await reviewsService.listByProduct(request.params.productId);
    return response.json(result);
  }
};

