import { CouponType } from "@prisma/client";

import { AppError } from "../../../lib/errors";
import { prisma } from "../../../lib/prisma";

function ensureCouponAvailable(coupon: Awaited<ReturnType<typeof prisma.coupon.findUnique>>) {
  if (!coupon || !coupon.isActive) {
    throw new AppError(404, "Cupom inválido");
  }

  const now = new Date();

  if (coupon.startsAt && coupon.startsAt > now) {
    throw new AppError(400, "Cupom ainda não está ativo");
  }

  if (coupon.endsAt && coupon.endsAt < now) {
    throw new AppError(400, "Cupom expirado");
  }

  if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
    throw new AppError(400, "Cupom sem saldo disponível");
  }
}

function calculateDiscount(params: {
  discountType: CouponType;
  value: number;
  subtotal: number;
  maxDiscount?: number | null;
  deliveryFee?: number;
}) {
  if (params.discountType === CouponType.PERCENT) {
    const percentageDiscount = (params.subtotal * params.value) / 100;
    return params.maxDiscount ? Math.min(percentageDiscount, params.maxDiscount) : percentageDiscount;
  }

  if (params.discountType === CouponType.DELIVERY) {
    return params.deliveryFee ?? 0;
  }

  return params.value;
}

export const couponsService = {
  async list() {
    return prisma.coupon.findMany({
      orderBy: { createdAt: "desc" }
    });
  },

  async create(data: {
    code: string;
    description?: string;
    discountType: CouponType;
    value: number;
    minOrderValue?: number;
    maxDiscount?: number;
    usageLimit?: number;
    startsAt?: string;
    endsAt?: string;
    isActive?: boolean;
  }) {
    return prisma.coupon.create({
      data: {
        code: data.code.toUpperCase(),
        description: data.description,
        discountType: data.discountType,
        value: data.value,
        minOrderValue: data.minOrderValue,
        maxDiscount: data.maxDiscount,
        usageLimit: data.usageLimit,
        startsAt: data.startsAt ? new Date(data.startsAt) : undefined,
        endsAt: data.endsAt ? new Date(data.endsAt) : undefined,
        isActive: data.isActive
      }
    });
  },

  async validate(code: string, subtotal: number, deliveryFee = 6.5) {
    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() }
    });

    ensureCouponAvailable(coupon);

    if (coupon.minOrderValue && subtotal < Number(coupon.minOrderValue)) {
      throw new AppError(400, "Subtotal mínimo não atingido para este cupom");
    }

    const discount = calculateDiscount({
      discountType: coupon.discountType,
      value: Number(coupon.value),
      subtotal,
      maxDiscount: coupon.maxDiscount ? Number(coupon.maxDiscount) : null,
      deliveryFee
    });

    return {
      valid: true,
      coupon,
      discount
    };
  }
};

