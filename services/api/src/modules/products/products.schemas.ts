import { z } from "zod";

const productOptionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  price: z.number().min(0)
});

export const createProductSchema = z.object({
  body: z.object({
    categoryId: z.string().optional(),
    name: z.string().min(2),
    description: z.string().optional(),
    accompanimentDetails: z.string().optional(),
    imageUrl: z.string().url().optional(),
    basePrice: z.number().min(0),
    costPrice: z.number().min(0).optional(),
    sizes: z.array(productOptionSchema).min(1),
    addOns: z.array(productOptionSchema).default([]),
    stockQuantity: z.number().int().min(0),
    isFeatured: z.boolean().optional(),
    isActive: z.boolean().optional()
  })
});

export const updateProductSchema = z.object({
  params: z.object({
    id: z.string().min(1)
  }),
  body: z.object({
    categoryId: z.string().nullable().optional(),
    name: z.string().min(2).optional(),
    description: z.string().optional(),
    accompanimentDetails: z.string().optional(),
    imageUrl: z.string().url().optional(),
    basePrice: z.number().min(0).optional(),
    costPrice: z.number().min(0).optional(),
    sizes: z.array(productOptionSchema).optional(),
    addOns: z.array(productOptionSchema).optional(),
    stockQuantity: z.number().int().min(0).optional(),
    isFeatured: z.boolean().optional(),
    isActive: z.boolean().optional()
  })
});

export const productsQuerySchema = z.object({
  query: z.object({
    categoryId: z.string().optional(),
    featured: z.enum(["true", "false"]).optional(),
    search: z.string().optional()
  })
});
