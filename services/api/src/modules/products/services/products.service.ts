import { Prisma } from "@prisma/client";

import { cache } from "../../../lib/cache";
import { prisma } from "../../../lib/prisma";
import { slugify } from "../../../lib/slugify";

const PRODUCTS_CACHE_KEY = "products:catalog";

function buildWhere(filters: { categoryId?: string; featured?: string; search?: string }): Prisma.ProductWhereInput {
  return {
    isActive: true,
    ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
    ...(filters.featured === "true" ? { isFeatured: true } : {}),
    ...(filters.search
      ? {
          OR: [
            { name: { contains: filters.search, mode: "insensitive" } },
            { description: { contains: filters.search, mode: "insensitive" } }
          ]
        }
      : {})
  };
}

export const productsService = {
  async list(filters: { categoryId?: string; featured?: string; search?: string }) {
    const cacheKey = `${PRODUCTS_CACHE_KEY}:${JSON.stringify(filters)}`;
    const cached = cache.get(cacheKey);

    if (cached) {
      return cached;
    }

    const products = await prisma.product.findMany({
      where: buildWhere(filters),
      include: {
        category: true,
        reviews: true
      },
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }]
    });

    cache.set(cacheKey, products);
    return products;
  },

  async listAdmin() {
    return prisma.product.findMany({
      include: {
        category: true
      },
      orderBy: { createdAt: "desc" }
    });
  },

  async getById(id: string) {
    return prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        reviews: {
          include: {
            user: {
              select: {
                name: true,
                avatarUrl: true
              }
            }
          },
          orderBy: { createdAt: "desc" }
        }
      }
    });
  },

  async create(data: {
    categoryId?: string;
    name: string;
    description?: string;
    imageUrl?: string;
    basePrice: number;
    sizes: Array<{ id: string; name: string; price: number }>;
    addOns: Array<{ id: string; name: string; price: number }>;
    stockQuantity: number;
    isFeatured?: boolean;
    isActive?: boolean;
  }) {
    const product = await prisma.product.create({
      data: {
        ...data,
        slug: slugify(data.name)
      }
    });

    cache.flushAll();
    return product;
  },

  async update(id: string, data: {
    categoryId?: string | null;
    name?: string;
    description?: string;
    imageUrl?: string;
    basePrice?: number;
    sizes?: Array<{ id: string; name: string; price: number }>;
    addOns?: Array<{ id: string; name: string; price: number }>;
    stockQuantity?: number;
    isFeatured?: boolean;
    isActive?: boolean;
  }) {
    const product = await prisma.product.update({
      where: { id },
      data: {
        ...data,
        ...(data.name ? { slug: slugify(data.name) } : {})
      }
    });

    cache.flushAll();
    return product;
  }
};

