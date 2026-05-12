import { z } from "zod";

export const createReviewSchema = z.object({
  body: z.object({
    orderId: z.string().min(1),
    productId: z.string().min(1),
    rating: z.number().int().min(1).max(5),
    comment: z.string().optional()
  })
});

