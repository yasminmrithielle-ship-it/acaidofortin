import { LoyaltyEntryType } from "@prisma/client";

import { prisma } from "../../../lib/prisma";

export const loyaltyService = {
  async getMyAccount(userId: string) {
    return prisma.loyaltyAccount.findUnique({
      where: { userId },
      include: {
        entries: {
          orderBy: { createdAt: "desc" }
        }
      }
    });
  },

  async adjust(data: {
    userId: string;
    points: number;
    reason: string;
    entryType: LoyaltyEntryType;
  }) {
    const account = await prisma.loyaltyAccount.upsert({
      where: {
        userId: data.userId
      },
      update: {
        points: {
          increment: data.points
        }
      },
      create: {
        userId: data.userId,
        points: data.points
      }
    });

    await prisma.loyaltyEntry.create({
      data: {
        accountId: account.id,
        points: data.points,
        reason: data.reason,
        entryType: data.entryType
      }
    });

    return prisma.loyaltyAccount.findUnique({
      where: { id: account.id },
      include: {
        entries: {
          orderBy: { createdAt: "desc" }
        }
      }
    });
  }
};

