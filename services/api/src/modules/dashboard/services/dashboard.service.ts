import { OrderStatus, UserRole } from "@prisma/client";

import { cache } from "../../../lib/cache";
import { prisma } from "../../../lib/prisma";

const DASHBOARD_KEY = "dashboard:summary";

export const dashboardService = {
  async getSummary() {
    const cached = cache.get(DASHBOARD_KEY);

    if (cached) {
      return cached;
    }

    const [ordersCount, customersCount, productsCount, orders, lowStockProducts] = await Promise.all([
      prisma.order.count(),
      prisma.user.count({ where: { role: UserRole.CUSTOMER } }),
      prisma.product.count(),
      prisma.order.findMany({
        include: {
          items: true
        },
        orderBy: { createdAt: "desc" },
        take: 6
      }),
      prisma.product.findMany({
        where: {
          stockQuantity: {
            lte: 10
          }
        },
        orderBy: { stockQuantity: "asc" },
        take: 5
      })
    ]);

    const deliveredOrders = await prisma.order.findMany({
      where: {
        status: OrderStatus.DELIVERED
      }
    });

    const revenue = deliveredOrders.reduce((total, order) => total + Number(order.total), 0);

    const topProductsMap = new Map<string, { name: string; quantity: number }>();

    orders.forEach((order) => {
      order.items.forEach((item) => {
        const current = topProductsMap.get(item.productId) ?? {
          name: item.productName,
          quantity: 0
        };

        topProductsMap.set(item.productId, {
          name: item.productName,
          quantity: current.quantity + item.quantity
        });
      });
    });

    const summary = {
      metrics: {
        revenue,
        ordersCount,
        customersCount,
        productsCount,
        pendingOrders: await prisma.order.count({
          where: {
            status: {
              in: [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PREPARING]
            }
          }
        })
      },
      recentOrders: orders,
      lowStockProducts,
      topProducts: Array.from(topProductsMap.values()).sort((a, b) => b.quantity - a.quantity)
    };

    cache.set(DASHBOARD_KEY, summary, 120);

    return summary;
  }
};
