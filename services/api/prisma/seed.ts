import bcrypt from "bcryptjs";

import { PrismaClient, UserRole, PaymentMethod, PaymentStatus, OrderStatus, CouponType, BannerTarget } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash("Admin@123", 10);
  const customerPassword = await bcrypt.hash("Cliente@123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@fortin.com" },
    update: {},
    create: {
      name: "Equipe Fortin",
      email: "admin@fortin.com",
      phone: "31999990000",
      passwordHash: adminPassword,
      role: UserRole.ADMIN
    }
  });

  const customer = await prisma.user.upsert({
    where: { email: "cliente@fortin.com" },
    update: {},
    create: {
      name: "Cliente Demo",
      email: "cliente@fortin.com",
      phone: "31988887777",
      passwordHash: customerPassword,
      role: UserRole.CUSTOMER,
      loyaltyAccount: {
        create: {
          points: 55,
          currentLevel: "Prata",
          nextRewardAt: 120
        }
      }
    }
  });

  const address = await prisma.address.upsert({
    where: { id: "fortin-address-demo" },
    update: {},
    create: {
      id: "fortin-address-demo",
      userId: customer.id,
      label: "Casa",
      street: "Rua Jose Pedro de Brito",
      number: "407",
      neighborhood: "Vila Santa Rita",
      city: "Belo Horizonte",
      state: "MG",
      zipCode: "30640-110",
      latitude: -19.98386,
      longitude: -44.01537,
      isDefault: true
    }
  });

  const categoryTradicionais = await prisma.category.upsert({
    where: { slug: "tradicionais" },
    update: {},
    create: {
      name: "Tradicionais",
      slug: "tradicionais",
      description: "Açaís clássicos com cremes premium",
      sortOrder: 1
    }
  });

  const categoryZero = await prisma.category.upsert({
    where: { slug: "zero-acucar" },
    update: {},
    create: {
      name: "Zero Açúcar",
      slug: "zero-acucar",
      description: "Sabores equilibrados para rotina fit",
      sortOrder: 2
    }
  });

  const sizeOptions = [
    { id: "300", name: "300ml", price: 18.9 },
    { id: "500", name: "500ml", price: 24.9 },
    { id: "700", name: "700ml", price: 31.9 }
  ];

  const addOnOptions = [
    { id: "banana", name: "Banana", price: 2.5 },
    { id: "morango", name: "Morango", price: 4.5 },
    { id: "leite-po", name: "Leite em pó", price: 3 },
    { id: "nutella", name: "Nutella", price: 6.5 },
    { id: "granola", name: "Granola artesanal", price: 3.5 }
  ];

  const product = await prisma.product.upsert({
    where: { slug: "fortin-signature" },
    update: {
      costPrice: 10.5,
      accompanimentDetails: "Acai, creme ninho, banana, granola crocante e leite em po."
    },
    create: {
      name: "Fortin Signature",
      slug: "fortin-signature",
      description: "Açaí artesanal com creme ninho, banana e granola crocante.",
      accompanimentDetails: "Acai, creme ninho, banana, granola crocante e leite em po.",
      imageUrl: "https://images.unsplash.com/photo-1514996937319-344454492b37?auto=format&fit=crop&w=1200&q=80",
      basePrice: 18.9,
      costPrice: 10.5,
      sizes: sizeOptions,
      addOns: addOnOptions,
      stockQuantity: 80,
      isFeatured: true,
      categoryId: categoryTradicionais.id
    }
  });

  await prisma.product.upsert({
    where: { slug: "fit-purple" },
    update: {
      costPrice: 12.9,
      accompanimentDetails: "Acai zero acucar, whey de baunilha, morango e granola sem acucar."
    },
    create: {
      name: "Fit Purple",
      slug: "fit-purple",
      description: "Blend zero açúcar com whey de baunilha e morangos.",
      accompanimentDetails: "Acai zero acucar, whey de baunilha, morango e granola sem acucar.",
      imageUrl: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1200&q=80",
      basePrice: 22.9,
      costPrice: 12.9,
      sizes: sizeOptions,
      addOns: addOnOptions,
      stockQuantity: 45,
      isFeatured: true,
      categoryId: categoryZero.id
    }
  });

  await prisma.banner.upsert({
    where: { id: "banner-home-fortin" },
    update: {},
    create: {
      id: "banner-home-fortin",
      title: "Leve 2, ganhe topping premium",
      subtitle: "Semana Fortin com combos exclusivos no app.",
      imageUrl: "https://images.unsplash.com/photo-1502741338009-cac2772e18bc?auto=format&fit=crop&w=1200&q=80",
      ctaLabel: "Pedir agora",
      ctaLink: "/catalogo",
      target: BannerTarget.HOME
    }
  });

  await prisma.coupon.upsert({
    where: { code: "FORTIN10" },
    update: {},
    create: {
      code: "FORTIN10",
      description: "10% OFF na primeira compra",
      discountType: CouponType.PERCENT,
      value: 10,
      minOrderValue: 25,
      maxDiscount: 12
    }
  });

  const existingOrder = await prisma.order.findFirst({
    where: {
      userId: customer.id
    }
  });

  if (!existingOrder) {
    await prisma.order.create({
      data: {
        userId: customer.id,
        addressId: address.id,
        status: OrderStatus.OUT_FOR_DELIVERY,
        paymentMethod: PaymentMethod.PIX,
        paymentStatus: PaymentStatus.PAID,
        subtotal: 31.9,
        discount: 3.19,
        deliveryFee: 0,
        total: 28.71,
        estimatedMinutes: 18,
        items: {
          create: {
            productId: product.id,
            productName: product.name,
            quantity: 1,
            unitPrice: 31.9,
            selectedSize: sizeOptions[2],
            selectedAddOns: [addOnOptions[0], addOnOptions[4]]
          }
        },
        payment: {
          create: {
            amount: 28.71,
            method: PaymentMethod.PIX,
            status: PaymentStatus.PAID,
            pixCode: "PIX-DEMO-FORTIN-001",
            paidAt: new Date()
          }
        }
      }
    });
  }

  await prisma.loyaltyAccount.upsert({
    where: { userId: customer.id },
    update: {},
    create: {
      userId: customer.id,
      points: 55,
      currentLevel: "Prata",
      nextRewardAt: 120
    }
  });

  console.log("Seed concluído.", { admin: admin.email, customer: customer.email });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
