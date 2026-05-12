import { z } from "zod";

export const createCouponSchema = z.object({
  body: z.object({
    code: z.string().min(3),
    description: z.string().optional(),
    discountType: z.enum(["PERCENT", "FIXED", "DELIVERY"]),
    value: z.number().min(0),
    minOrderValue: z.number().min(0).optional(),
    maxDiscount: z.number().min(0).optional(),
    usageLimit: z.number().int().min(1).optional(),
    startsAt: z.string().datetime().optional(),
    endsAt: z.string().datetime().optional(),
    isActive: z.boolean().optional()
  })
});

export const validateCouponSchema = z.object({
  body: z.object({
    code: z.string().min(3),
    subtotal: z.number().min(0)
  })
});

