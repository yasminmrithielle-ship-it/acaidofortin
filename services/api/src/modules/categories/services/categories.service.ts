import { prisma } from "../../../lib/prisma";
import { slugify } from "../../../lib/slugify";
import { cache } from "../../../lib/cache";

const CATEGORY_CACHE_KEY = "categories:public";

export const categoriesService = {
  async listPublic() {
    const cached = cache.get(CATEGORY_CACHE_KEY);

    if (cached) {
      return cached;
    }

    const categories = await prisma.category.findMany({
      where: { isActive: true },
      include: {
        products: {
          where: { isActive: true },
          orderBy: { createdAt: "desc" }
        }
      },
      orderBy: { sortOrder: "asc" }
    });

    cache.set(CATEGORY_CACHE_KEY, categories);

    return categories;
  },

  async listAdmin() {
    return prisma.category.findMany({
      include: {
        _count: {
          select: { products: true }
        }
      },
      orderBy: { sortOrder: "asc" }
    });
  },

  async create(data: {
    name: string;
    description?: string;
    imageUrl?: string;
    sortOrder?: number;
    isActive?: boolean;
  }) {
    const category = await prisma.category.create({
      data: {
        ...data,
        slug: slugify(data.name)
      }
    });

    cache.del(CATEGORY_CACHE_KEY);
    return category;
  },

  async update(id: string, data: {
    name?: string;
    description?: string;
    imageUrl?: string;
    sortOrder?: number;
    isActive?: boolean;
  }) {
    const category = await prisma.category.update({
      where: { id },
      data: {
        ...data,
        ...(data.name ? { slug: slugify(data.name) } : {})
      }
    });

    cache.del(CATEGORY_CACHE_KEY);
    return category;
  }
};

