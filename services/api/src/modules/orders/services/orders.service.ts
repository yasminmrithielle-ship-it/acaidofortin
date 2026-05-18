import { CouponType, LoyaltyEntryType, NotificationType, OrderStatus, PaymentMethod, PaymentStatus, Prisma } from "@prisma/client";

import { AppError } from "../../../lib/errors";
import { cache } from "../../../lib/cache";
import { emitOrderUpdated } from "../../../lib/socket";
import { prisma } from "../../../lib/prisma";
import { formatOrderCode, notifyWhatsAppOrder } from "../../../lib/whatsapp";

type ProductOption = {
  id: string;
  name: string;
  price: number;
};

type CreateOrderInput = {
  addressId?: string;
  deliveryAddress?: {
    zipCode?: string;
    street: string;
    number: string;
    referencePoint?: string;
    phone: string;
    neighborhood: string;
    city?: string;
    state?: string;
  };
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

const DEMO_CUSTOMER_EMAIL = "cliente@fortin.com";

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

function withPublicCode<T extends { id: string }>(order: T) {
  return {
    ...order,
    publicCode: formatOrderCode(order.id)
  };
}

export const ordersService = {
  async create(userId: string, input: CreateOrderInput) {
    const deliveryFee = 0;

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

    const address = input.addressId && !input.deliveryAddress
      ? await prisma.address.findFirst({
          where: {
            id: input.addressId,
            userId
          }
        })
      : null;

    if (input.addressId && !input.deliveryAddress && !address) {
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
      let orderAddressId = input.deliveryAddress ? undefined : input.addressId;

      if (input.deliveryAddress) {
        await transaction.user.update({
          where: { id: userId },
          data: {
            phone: input.deliveryAddress.phone
          }
        });

        const createdAddress = await transaction.address.create({
          data: {
            userId,
            label: "Entrega",
            street: input.deliveryAddress.street,
            number: input.deliveryAddress.number,
            complement: input.deliveryAddress.referencePoint,
            neighborhood: input.deliveryAddress.neighborhood,
            city: input.deliveryAddress.city || "Belo Horizonte",
            state: input.deliveryAddress.state || "MG",
            zipCode: input.deliveryAddress.zipCode || "",
            isDefault: false
          }
        });

        orderAddressId = createdAddress.id;
      } else if (address) {
        orderAddressId = address.id;
      }

      const orderNotes = [
        input.notes,
        input.deliveryAddress?.referencePoint ? `Ponto de referencia: ${input.deliveryAddress.referencePoint}` : null
      ].filter(Boolean).join("\n");

      const createdOrder = await transaction.order.create({
        data: {
          userId,
          addressId: orderAddressId,
          couponId: couponRecord?.id,
          status: OrderStatus.PENDING,
          paymentMethod: input.paymentMethod,
          paymentStatus: initialPaymentStatus,
          subtotal,
          discount,
          deliveryFee,
          total,
          notes: orderNotes || undefined,
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
          address: true,
          user: {
            select: {
              name: true,
              phone: true
            }
          }
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
          message: `Seu pedido #${formatOrderCode(createdOrder.id)} entrou na fila de preparacao.`,
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

    const publicOrder = withPublicCode(order);
    await notifyWhatsAppOrder("created", publicOrder);

    return publicOrder;
  },

  async listMyOrders(userId: string) {
    const orders = await prisma.order.findMany({
      where: { userId },
      include: {
        items: true,
        payment: true,
        address: true
      },
      orderBy: { createdAt: "desc" }
    });

    return orders.map(withPublicCode);
  },

  async listAll(status?: OrderStatus) {
    const orders = await prisma.order.findMany({
      where: {
        ...(status ? { status } : {}),
        user: {
          email: {
            not: DEMO_CUSTOMER_EMAIL
          }
        }
      },
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

    return orders.map(withPublicCode);
  },

  async trackByCode(rawCode: string) {
    const normalizedCode = rawCode
      .replace(/^#/, "")
      .replace(/^FRT-/i, "")
      .replace(/[^a-z0-9]/gi, "")
      .toLowerCase();

    if (normalizedCode.length < 3) {
      throw new AppError(400, "Numero do pedido invalido");
    }

    const order = await prisma.order.findFirst({
      where: {
        id: {
          endsWith: normalizedCode
        }
      },
      include: {
        items: true,
        payment: true,
        address: true
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    if (!order) {
      throw new AppError(404, "Pedido nao encontrado");
    }

    return withPublicCode(order);
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
        payment: true,
        items: true,
        address: true,
        user: {
          select: {
            name: true,
            phone: true
          }
        }
      }
    });

    await prisma.notification.create({
      data: {
        userId: order.userId,
        title: "Atualizacao do pedido",
        message: `Seu pedido #${formatOrderCode(order.id)} agora esta como ${order.status}.`,
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

    const publicOrder = withPublicCode(order);
    await notifyWhatsAppOrder("status_updated", publicOrder);

    return publicOrder;
  }
};
