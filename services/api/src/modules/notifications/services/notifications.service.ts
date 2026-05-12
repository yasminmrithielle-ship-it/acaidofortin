import { NotificationType, UserRole } from "@prisma/client";

import { prisma } from "../../../lib/prisma";

export const notificationsService = {
  async getMine(userId: string) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" }
    });
  },

  async broadcast(data: {
    title: string;
    message: string;
    type: NotificationType;
  }) {
    const customers = await prisma.user.findMany({
      where: {
        role: UserRole.CUSTOMER
      },
      select: {
        id: true
      }
    });

    await prisma.notification.createMany({
      data: customers.map((customer) => ({
        userId: customer.id,
        title: data.title,
        message: data.message,
        type: data.type
      }))
    });

    return {
      delivered: customers.length
    };
  }
};
