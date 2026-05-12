import { z } from "zod";

export const createAddressSchema = z.object({
  body: z.object({
    label: z.string().min(2),
    street: z.string().min(2),
    number: z.string().min(1),
    complement: z.string().optional(),
    neighborhood: z.string().min(2),
    city: z.string().min(2),
    state: z.string().min(2),
    zipCode: z.string().min(8),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    isDefault: z.boolean().optional()
  })
});

export const favoriteParamsSchema = z.object({
  params: z.object({
    productId: z.string().min(1)
  })
});

