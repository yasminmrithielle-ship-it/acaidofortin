import { OrderStatus, PaymentMethod, UserRole } from "@prisma/client";

import { cache } from "../../../lib/cache";
import { prisma } from "../../../lib/prisma";

const DASHBOARD_KEY = "dashboard:summary";

export const dashboardService = {
  async getSummary() {
    const cached = cache.get(DASHBOARD_KEY);

    if (cached) {
      return cached;
    }

    const [ordersCount, customersCount, productsCount, orders, lowStockProducts, reportOrders] = await Promise.all([
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
      }),
      prisma.order.findMany({
        where: {
          status: {
            not: OrderStatus.CANCELED
          }
        },
        include: {
          items: {
            include: {
              product: {
                select: {
                  costPrice: true
                }
              }
            }
          },
          payment: true
        },
        orderBy: { createdAt: "desc" }
      })
    ]);

    const revenue = reportOrders.reduce((total, order) => total + Number(order.total), 0);
    const productCost = reportOrders.reduce((orderTotal, order) => {
      const orderCost = order.items.reduce((itemTotal, item) => {
        return itemTotal + Number(item.product.costPrice) * item.quantity;
      }, 0);

      return orderTotal + orderCost;
    }, 0);
    const profit = reportOrders.reduce((total, order) => total + Number(order.subtotal) - Number(order.discount), 0) - productCost;
    const paymentBreakdown = Object.values(PaymentMethod).map((method) => {
      const matchingOrders = reportOrders.filter((order) => order.paymentMethod === method);

      return {
        method,
        ordersCount: matchingOrders.length,
        revenue: matchingOrders.reduce((total, order) => total + Number(order.total), 0)
      };
    });
    const revenueByDate = Array.from(
      reportOrders
        .reduce((dates, order) => {
          const dateKey = order.createdAt.toISOString().slice(0, 10);
          const current = dates.get(dateKey) ?? { date: dateKey, ordersCount: 0, revenue: 0, profit: 0 };
          const orderCost = order.items.reduce((total, item) => total + Number(item.product.costPrice) * item.quantity, 0);

          dates.set(dateKey, {
            date: dateKey,
            ordersCount: current.ordersCount + 1,
            revenue: current.revenue + Number(order.total),
            profit: current.profit + Number(order.subtotal) - Number(order.discount) - orderCost
          });

          return dates;
        }, new Map<string, { date: string; ordersCount: number; revenue: number; profit: number }>())
        .values()
    ).sort((a, b) => b.date.localeCompare(a.date));

    const topProductsMap = new Map<string, { name: string; quantity: number }>();

    reportOrders.forEach((order) => {
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
        profit,
        productCost,
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
      topProducts: Array.from(topProductsMap.values()).sort((a, b) => b.quantity - a.quantity),
      paymentBreakdown,
      revenueByDate
    };

    cache.set(DASHBOARD_KEY, summary, 120);

    return summary;
  }
};
