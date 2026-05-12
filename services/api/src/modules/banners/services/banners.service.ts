import { prisma } from "../../../lib/prisma";

export const bannersService = {
  async listPublic() {
    const now = new Date();

    return prisma.banner.findMany({
      where: {
        isActive: true,
        OR: [
          { startsAt: null, endsAt: null },
          {
            AND: [
              {
                OR: [{ startsAt: null }, { startsAt: { lte: now } }]
              },
              {
                OR: [{ endsAt: null }, { endsAt: { gte: now } }]
              }
            ]
          }
        ]
      },
      orderBy: { createdAt: "desc" }
    });
  },

  async listAdmin() {
    return prisma.banner.findMany({
      orderBy: { createdAt: "desc" }
    });
  },

  async create(data: {
    title: string;
    subtitle?: string;
    imageUrl: string;
    ctaLabel?: string;
    ctaLink?: string;
    target: "HOME" | "PROMOTION" | "LOYALTY";
    startsAt?: string;
    endsAt?: string;
    isActive?: boolean;
  }) {
    return prisma.banner.create({
      data: {
        ...data,
        startsAt: data.startsAt ? new Date(data.startsAt) : undefined,
        endsAt: data.endsAt ? new Date(data.endsAt) : undefined
      }
    });
  },

  async update(id: string, data: {
    title?: string;
    subtitle?: string;
    imageUrl?: string;
    ctaLabel?: string;
    ctaLink?: string;
    target?: "HOME" | "PROMOTION" | "LOYALTY";
    startsAt?: string;
    endsAt?: string;
    isActive?: boolean;
  }) {
    return prisma.banner.update({
      where: { id },
      data: {
        ...data,
        startsAt: data.startsAt ? new Date(data.startsAt) : undefined,
        endsAt: data.endsAt ? new Date(data.endsAt) : undefined
      }
    });
  }
};

