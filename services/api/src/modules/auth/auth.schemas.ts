import { z } from "zod";

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(3),
    email: z.string().email(),
    phone: z.string().min(10).optional(),
    password: z.string().min(6)
  })
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(6)
  })
});

export const socialLoginSchema = z.object({
  body: z.object({
    provider: z.enum(["google", "apple"]),
    providerId: z.string().min(2),
    email: z.string().email(),
    name: z.string().min(2),
    avatarUrl: z.string().url().optional()
  })
});

