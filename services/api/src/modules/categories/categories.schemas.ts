import { z } from "zod";

export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(2),
    description: z.string().optional(),
    imageUrl: z.string().url().optional(),
    sortOrder: z.number().int().min(0).default(0),
    isActive: z.boolean().optional()
  })
});

export const updateCategorySchema = z.object({
  params: z.object({
    id: z.string().min(1)
  }),
  body: z.object({
    name: z.string().min(2).optional(),
    description: z.string().optional(),
    imageUrl: z.string().url().optional(),
    sortOrder: z.number().int().min(0).optional(),
    isActive: z.boolean().optional()
  })
});

