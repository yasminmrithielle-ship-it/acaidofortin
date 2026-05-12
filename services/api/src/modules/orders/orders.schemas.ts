import { z } from "zod";

export const createOrderSchema = z.object({
  body: z.object({
    addressId: z.string().optional(),
    couponCode: z.string().optional(),
    paymentMethod: z.enum(["PIX", "CARD", "CASH"]),
    changeFor: z.number().min(0).optional(),
    notes: z.string().optional(),
    deliveryLat: z.number().optional(),
    deliveryLng: z.number().optional(),
    items: z.array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().min(1),
        selectedSizeId: z.string().min(1),
        selectedAddOnIds: z.array(z.string()).default([]),
        notes: z.string().optional()
      })
    ).min(1)
  })
});

export const updateOrderStatusSchema = z.object({
  params: z.object({
    id: z.string().min(1)
  }),
  body: z.object({
    status: z.enum(["PENDING", "CONFIRMED", "PREPARING", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELED"]),
    paymentStatus: z.enum(["PENDING", "PAID", "FAILED", "REFUNDED"]).optional(),
    estimatedMinutes: z.number().int().min(0).optional()
  })
});

