import { z } from "zod";

export const adjustLoyaltySchema = z.object({
  body: z.object({
    userId: z.string().min(1),
    points: z.number().int(),
    reason: z.string().min(2),
    entryType: z.enum(["EARN", "REDEEM", "BONUS"])
  })
});

