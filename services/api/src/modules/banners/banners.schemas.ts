import { z } from "zod";

export const createBannerSchema = z.object({
  body: z.object({
    title: z.string().min(2),
    subtitle: z.string().optional(),
    imageUrl: z.string().url(),
    ctaLabel: z.string().optional(),
    ctaLink: z.string().optional(),
    target: z.enum(["HOME", "PROMOTION", "LOYALTY"]).default("HOME"),
    startsAt: z.string().datetime().optional(),
    endsAt: z.string().datetime().optional(),
    isActive: z.boolean().optional()
  })
});

export const updateBannerSchema = z.object({
  params: z.object({
    id: z.string().min(1)
  }),
  body: z.object({
    title: z.string().min(2).optional(),
    subtitle: z.string().optional(),
    imageUrl: z.string().url().optional(),
    ctaLabel: z.string().optional(),
    ctaLink: z.string().optional(),
    target: z.enum(["HOME", "PROMOTION", "LOYALTY"]).optional(),
    startsAt: z.string().datetime().optional(),
    endsAt: z.string().datetime().optional(),
    isActive: z.boolean().optional()
  })
});

