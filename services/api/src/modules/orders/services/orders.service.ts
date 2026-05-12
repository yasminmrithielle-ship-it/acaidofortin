import { CouponType, LoyaltyEntryType, NotificationType, OrderStatus, PaymentMethod, PaymentStatus, Prisma } from "@prisma/client";

import { AppError } from "../../../lib/errors";
import { cache } from "../../../lib/cache";
import { emitOrderUpdated } from "../../../lib/socket";
import { prisma } from "../../../lib/prisma";

type ProductOption = {
  id: string;
  name: string;
  price: number;
};

type CreateOrderInput = {
  addressId?: string;
  couponCode?: string;
  paymentMethod: PaymentMethod;
  changeFor?: number;
  notes?: string;
  deliveryLat?: number;
  deliveryLng?: number;
  items: Array<{
    productId: string;
    quantity: number;
    selectedSizeId: string;
    selectedAddOnIds: string[];
    notes?: string;
  }>;
};

function asOptionArray(value: Prisma.JsonValue): ProductOption[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value as ProductOption[];
}

function calculateCouponDiscount(params: {
  type: CouponType;
  subtotal: number;
  value: number;
  maxDiscount?: number | null;
  deliveryFee: number;
}) {
  if (params.type === CouponType.PERCENT) {
    const rawDiscount = (params.subtotal * params.value) / 100;
    return params.maxDiscount ? Math.min(rawDiscount, params.maxDiscount) : rawDiscount;
  }

  if (params.type === CouponType.DELIVERY) {
    return params.deliveryFee;
  }

  return params.value;
}

export const ordersService = {
  async create(userId: string, input: CreateOrderInput) {
    const deliveryFee = 6.5;

    const productIds = input.items.map((item) => item.productId);
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        isActive: true
      }
    });

    if (products.length !== productIds.length) {
      throw new AppError(400, "Um ou mais produtos não estão disponíveis");
    }

    const address = input.addressId
      ? await prisma.address.findFirst({
          where: {
            id: input.addressId,
            userId
          }
        })
      : null;

    if (input.addressId && !address) {
      throw new AppError(400, "Endereço inválido");
    }

    const orderItems = input.items.map((item) => {
      const product = products.find((candidate) => candidate.id === item.productId);

      if (!product) {
        throw new AppError(404, "Produto não encontrado");
      }

      const sizes = asOptionArray(product.sizes);
      const addOns = asOptionArray(product.addOns);
      const selectedSize = sizes.find((size) => size.id === item.selectedSizeId);

      if (!selectedSize) {
        throw new AppError(400, `Tamanho inválido para o produto ${product.name}`);
      }

      const selectedAddOns = addOns.filter((candidate) => item.selectedAddOnIds.includes(candidate.id));
      const addOnsPrice = selectedAddOns.reduce((total, addOn) => total + Number(addOn.price), 0);
      const unitPrice = Number(selectedSize.price) + addOnsPrice;

      return {
        orderId: "",
        productId: product.id,
        productName: product.name,
        quantity: item.quantity,
        unitPrice,
        selectedSize,
        selectedAddOns,
        notes: item.notes,
        lineTotal: unitPrice * item.quantity
      };
    });

    const subtotal = orderItems.reduce((total, item) => total + item.lineTotal, 0);

    let couponRecord: Awaited<ReturnType<typeof prisma.coupon.findUnique>> | null = null;
    let discount = 0;

    if (input.couponCode) {
      couponRecord = await prisma.coupon.findUnique({
        where: {
          code: input.couponCode.toUpperCase()
        }
      });

      if (!couponRecord || !couponRecord.isActive) {
        throw new AppError(400, "Cupom inválido");
      }

      const now = new Date();

      if (couponRecord.startsAt && couponRecord.startsAt > now) {
        throw new AppError(400, "Cupom ainda não está ativo");
      }

      if (couponRecord.endsAt && couponRecord.endsAt < now) {
        throw new AppError(400, "Cupom expirado");
      }

      if (couponRecord.usageLimit && couponRecord.usageCount >= couponRecord.usageLimit) {
        throw new AppError(400, "Cupom esgotado");
      }

      if (couponRecord.minOrderValue && subtotal < Number(couponRecord.minOrderValue)) {
        throw new AppError(400, "Subtotal mínimo não atingido");
      }

      discount = calculateCouponDiscount({
        type: couponRecord.discountType,
        subtotal,
        value: Number(couponRecord.value),
        maxDiscount: couponRecord.maxDiscount ? Number(couponRecord.maxDiscount) : null,
        deliveryFee
      });
    }

    const total = Math.max(subtotal - discount + deliveryFee, 0);
    const initialPaymentStatus = input.paymentMethod === PaymentMethod.CARD ? PaymentStatus.PAID : PaymentStatus.PENDING;

    const order = await prisma.$transaction(async (transaction) => {
      const createdOrder = await transaction.order.create({
        data: {
          userId,
          addressId: input.addressId,
          couponId: couponRecord?.id,
          status: OrderStatus.PENDING,
          paymentMethod: input.paymentMethod,
          paymentStatus: initialPaymentStatus,
          subtotal,
          discount,
          deliveryFee,
          total,
          notes: input.notes,
          deliveryLat: input.deliveryLat,
          deliveryLng: input.deliveryLng,
          items: {
            create: orderItems.map((item) => ({
              productId: item.productId,
              productName: item.productName,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              selectedSize: item.selectedSize,
              selectedAddOns: item.selectedAddOns,
              notes: item.notes
            }))
          },
          payment: {
            create: {
              amount: total,
              method: input.paymentMethod,
              status: initialPaymentStatus,
              pixCode: input.paymentMethod === PaymentMethod.PIX ? `PIX-${Date.now()}` : null,
              changeFor: input.paymentMethod === PaymentMethod.CASH ? input.changeFor : null,
              paidAt: input.paymentMethod === PaymentMethod.CARD ? new Date() : null
            }
          }
        },
        include: {
          items: true,
          payment: true,
          address: true
        }
      });

      if (couponRecord) {
        await transaction.coupon.update({
          where: { id: couponRecord.id },
          data: {
            usageCount: {
              increment: 1
            }
          }
        });
      }

      const loyaltyAccount = await transaction.loyaltyAccount.upsert({
        where: { userId },
        update: {},
        create: { userId }
      });

      const earnedPoints = Math.floor(total);

      await transaction.loyaltyAccount.update({
        where: { id: loyaltyAccount.id },
        data: {
          points: {
            increment: earnedPoints
          }
        }
      });

      await transaction.loyaltyEntry.create({
        data: {
          accountId: loyaltyAccount.id,
          points: earnedPoints,
          reason: "Pedido realizado",
          entryType: LoyaltyEntryType.EARN
        }
      });

      await transaction.notification.create({
        data: {
          userId,
          title: "Pedido recebido",
          message: `Seu pedido #${createdOrder.id.slice(-6)} entrou na fila de preparação.`,
          type: NotificationType.ORDER,
          metadata: {
            orderId: createdOrder.id,
            status: createdOrder.status
          }
        }
      });

      return createdOrder;
    });

    emitOrderUpdated(order.id, {
      orderId: order.id,
      status: order.status,
      estimatedMinutes: order.estimatedMinutes
    });
    cache.del("dashboard:summary");

    return order;
  },

  async listMyOrders(userId: string) {
    return prisma.order.findMany({
      where: { userId },
      include: {
        items: true,
        payment: true,
        address: true
      },
      orderBy: { createdAt: "desc" }
    });
  },

  async listAll(status?: OrderStatus) {
    return prisma.order.findMany({
      where: status ? { status } : undefined,
      include: {
        user: {
          select: {
            name: true,
            phone: true
          }
        },
        items: true,
        payment: true,
        address: true
      },
      orderBy: { createdAt: "desc" }
    });
  },

  async updateStatus(orderId: string, data: {
    status: OrderStatus;
    paymentStatus?: PaymentStatus;
    estimatedMinutes?: number;
  }) {
    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: data.status,
        paymentStatus: data.paymentStatus,
        estimatedMinutes: data.estimatedMinutes,
        payment: data.paymentStatus
          ? {
              update: {
                status: data.paymentStatus,
                paidAt: data.paymentStatus === PaymentStatus.PAID ? new Date() : undefined
              }
            }
          : undefined
      },
      include: {
        payment: true
      }
    });

    await prisma.notification.create({
      data: {
        userId: order.userId,
        title: "Atualização do pedido",
        message: `Seu pedido agora está como ${order.status}.`,
        type: NotificationType.ORDER,
        metadata: {
          orderId: order.id,
          status: order.status
        }
      }
    });

    emitOrderUpdated(order.id, {
      orderId: order.id,
      status: order.status,
      estimatedMinutes: order.estimatedMinutes
    });
    cache.del("dashboard:summary");

    return order;
  }
};
