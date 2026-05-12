import { z } from "zod";

export const broadcastNotificationSchema = z.object({
  body: z.object({
    title: z.string().min(2),
    message: z.string().min(4),
    type: z.enum(["PROMOTION", "ORDER", "SYSTEM"]).default("PROMOTION")
  })
});

