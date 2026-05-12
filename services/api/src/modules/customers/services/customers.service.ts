import { UserRole } from "@prisma/client";

import { AppError } from "../../../lib/errors";
import { prisma } from "../../../lib/prisma";

export const customersService = {
  async listCustomers() {
    const customers = await prisma.user.findMany({
      where: {
        role: UserRole.CUSTOMER
      },
      include: {
        orders: true,
        loyaltyAccount: true
      },
      orderBy: { createdAt: "desc" }
    });

    return customers.map((customer) => ({
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      createdAt: customer.createdAt,
      loyaltyPoints: customer.loyaltyAccount?.points ?? 0,
      ordersCount: customer.orders.length,
      totalSpent: customer.orders.reduce((total, order) => total + Number(order.total), 0)
    }));
  },

  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        addresses: true,
        loyaltyAccount: {
          include: {
            entries: {
              orderBy: { createdAt: "desc" },
              take: 10
            }
          }
        },
        favorites: {
          include: {
            product: true
          }
        }
      }
    });

    if (!user) {
      throw new AppError(404, "Cliente não encontrado");
    }

    const { passwordHash, ...safeUser } = user;
    return safeUser;
  },

  async addAddress(userId: string, data: {
    label: string;
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
    latitude?: number;
    longitude?: number;
    isDefault?: boolean;
  }) {
    if (data.isDefault) {
      await prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false }
      });
    }

    return prisma.address.create({
      data: {
        userId,
        ...data
      }
    });
  },

  async getFavorites(userId: string) {
    return prisma.favorite.findMany({
      where: { userId },
      include: {
        product: true
      },
      orderBy: { createdAt: "desc" }
    });
  },

  async toggleFavorite(userId: string, productId: string) {
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      throw new AppError(404, "Produto não encontrado");
    }

    const favorite = await prisma.favorite.findUnique({
      where: {
        userId_productId: {
          userId,
          productId
        }
      }
    });

    if (favorite) {
      await prisma.favorite.delete({
        where: { id: favorite.id }
      });

      return { favorited: false };
    }

    await prisma.favorite.create({
      data: {
        userId,
        productId
      }
    });

    return { favorited: true };
  }
};
