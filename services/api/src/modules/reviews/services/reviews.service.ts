import { OrderStatus } from "@prisma/client";

import { AppError } from "../../../lib/errors";
import { prisma } from "../../../lib/prisma";

export const reviewsService = {
  async create(userId: string, data: {
    orderId: string;
    productId: string;
    rating: number;
    comment?: string;
  }) {
    const order = await prisma.order.findFirst({
      where: {
        id: data.orderId,
        userId,
        status: OrderStatus.DELIVERED
      }
    });

    if (!order) {
      throw new AppError(400, "Somente pedidos entregues podem ser avaliados");
    }

    return prisma.review.create({
      data: {
        userId,
        orderId: data.orderId,
        productId: data.productId,
        rating: data.rating,
        comment: data.comment
      }
    });
  },

  async listByProduct(productId: string) {
    return prisma.review.findMany({
      where: { productId },
      include: {
        user: {
          select: {
            name: true,
            avatarUrl: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });
  }
};

