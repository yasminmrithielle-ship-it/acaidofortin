import AsyncStorage from "@react-native-async-storage/async-storage";

import { fortinLogo, fortinProduct } from "../theme/brand-assets";
import { AppNotification, BannerItem, CatalogPayload, CouponItem, OrderRecord, Product, Profile } from "../types/app";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3333/api";
const CATALOG_CACHE_KEY = "fortin_catalog_cache";
export const DELIVERY_FEE = 0;

const sizeOptions = [
  { id: "300", name: "300ml", price: 18.9 },
  { id: "500", name: "500ml", price: 24.9 },
  { id: "700", name: "700ml", price: 31.9 }
];

const addOnOptions = [
  { id: "banana", name: "Banana", price: 2.5 },
  { id: "morango", name: "Morango", price: 4.5 },
  { id: "granola", name: "Granola artesanal", price: 3.5 },
  { id: "nutella", name: "Nutella", price: 6.5 }
];

const fallbackProducts: Product[] = [
  {
    id: "fortin-signature",
    name: "Fortin Signature",
    description: "Açaí artesanal com creme ninho, banana e granola crocante.",
    accompanimentDetails: "Acai, creme ninho, banana, granola crocante e leite em po.",
    imageUrl: "https://images.unsplash.com/photo-1514996937319-344454492b37?auto=format&fit=crop&w=1200&q=80",
    imageAsset: fortinProduct,
    basePrice: 18.9,
    costPrice: 10.5,
    sizes: sizeOptions,
    addOns: addOnOptions,
    stockQuantity: 40,
    isFeatured: true,
    categoryId: "tradicionais",
    category: { id: "tradicionais", name: "Tradicionais" }
  },
  {
    id: "fit-purple",
    name: "Fit Purple",
    description: "Blend zero açúcar com morango e whey de baunilha.",
    accompanimentDetails: "Acai zero acucar, whey de baunilha, morango e granola sem acucar.",
    imageUrl: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1200&q=80",
    imageAsset: fortinProduct,
    basePrice: 22.9,
    costPrice: 12.9,
    sizes: sizeOptions,
    addOns: addOnOptions,
    stockQuantity: 22,
    isFeatured: true,
    categoryId: "zero-acucar",
    category: { id: "zero-acucar", name: "Zero Açúcar" }
  },
  {
    id: "morango-supreme",
    name: "Morango Supreme",
    description: "Camadas de açaí premium com calda de morango e leite em pó.",
    accompanimentDetails: "Acai, morango, calda artesanal, leite em po e granola.",
    imageUrl: "https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&w=1200&q=80",
    imageAsset: fortinProduct,
    basePrice: 20.9,
    costPrice: 11.8,
    sizes: sizeOptions,
    addOns: addOnOptions,
    stockQuantity: 31,
    isFeatured: false,
    categoryId: "especiais",
    category: { id: "especiais", name: "Especiais" }
  }
];

const fallbackCatalog: CatalogPayload = {
  banners: [
    {
      id: "banner-1",
      title: "Semana Fortin",
      subtitle: "Compre 2 bowls e ganhe topping premium.",
      imageUrl: "https://images.unsplash.com/photo-1502741338009-cac2772e18bc?auto=format&fit=crop&w=1200&q=80",
      imageAsset: fortinProduct,
      ctaLabel: "Pedir agora"
    },
    {
      id: "banner-2",
      title: "Peça do seu jeito",
      subtitle: "Escolha tamanho, adicionais, pagamento e acompanhe o pedido.",
      imageUrl: "https://images.unsplash.com/photo-1467453678174-768ec283a940?auto=format&fit=crop&w=1200&q=80",
      imageAsset: fortinLogo,
      ctaLabel: "Montar agora"
    }
  ],
  categories: [
    {
      id: "tradicionais",
      name: "Tradicionais",
      description: "Sabores clássicos com assinatura da casa.",
      products: fallbackProducts.filter((product) => product.categoryId === "tradicionais")
    },
    {
      id: "zero-acucar",
      name: "Zero Açúcar",
      description: "Versões fit para rotina equilibrada.",
      products: fallbackProducts.filter((product) => product.categoryId === "zero-acucar")
    },
    {
      id: "especiais",
      name: "Especiais",
      description: "Combinações premium para impressionar.",
      products: fallbackProducts.filter((product) => product.categoryId === "especiais")
    }
  ],
  products: fallbackProducts,
  coupons: [
    {
      id: "coupon-fortin10",
      code: "FORTIN10",
      description: "10% OFF na primeira compra",
      discountType: "PERCENT",
      value: 10,
      minOrderValue: 25,
      maxDiscount: 12
    }
  ]
};

const fallbackProfile: Profile = {
  id: "profile-demo",
  name: "Cliente Demo",
  email: "cliente@fortin.com",
  phone: "31988887777",
  avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80",
  addresses: [
    {
      id: "address-demo",
      label: "Casa",
      street: "Rua Jose Pedro de Brito",
      number: "407",
      neighborhood: "Vila Santa Rita",
      city: "Belo Horizonte",
      state: "MG",
      zipCode: "30640-110",
      isDefault: true
    }
  ]
};

const fallbackOrders: OrderRecord[] = [
  {
    id: "fortin-order-demo",
    publicCode: "FRT-DEMO",
    status: "OUT_FOR_DELIVERY",
    paymentMethod: "PIX",
    paymentStatus: "PAID",
    subtotal: 31.9,
    discount: 3.19,
    deliveryFee: DELIVERY_FEE,
    total: 28.71,
    estimatedMinutes: 18,
    createdAt: new Date().toISOString(),
    items: [
      {
        id: "order-item-demo",
        productName: "Fortin Signature",
        quantity: 1,
        unitPrice: 31.9,
        selectedSize: sizeOptions[2],
        selectedAddOns: [addOnOptions[0], addOnOptions[2]]
      }
    ]
  }
];

const fallbackNotifications: AppNotification[] = [
  {
    id: "notification-demo-1",
    title: "Promo relâmpago",
    message: "Hoje o topping premium sai por conta da casa a partir de 2 bowls.",
    type: "PROMOTION"
  },
  {
    id: "notification-demo-2",
    title: "Pedido a caminho",
    message: "Seu entregador está a poucos minutos da entrega.",
    type: "ORDER"
  }
];

async function request<T>(path: string, options: RequestInit = {}, token?: string) {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({ message: "Falha na API" }));
    throw new Error(payload.message ?? "Falha na API");
  }

  return response.json() as Promise<T>;
}

async function getCachedCatalog() {
  const raw = await AsyncStorage.getItem(CATALOG_CACHE_KEY);
  return raw ? (JSON.parse(raw) as CatalogPayload) : null;
}

async function setCachedCatalog(payload: CatalogPayload) {
  await AsyncStorage.setItem(CATALOG_CACHE_KEY, JSON.stringify(payload));
}

export async function signIn(email: string, password: string) {
  try {
    return await request<{ token: string; user: Record<string, any> }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });
  } catch {
    return {
      token: "fortin-mobile-demo-token",
      user: {
        id: "profile-demo",
        name: "Cliente Demo",
        email
      }
    };
  }
}

export async function registerUser(name: string, email: string, password: string) {
  try {
    return await request<{ token: string; user: Record<string, any> }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password })
    });
  } catch {
    return {
      token: "fortin-mobile-demo-token",
      user: {
        id: "profile-demo",
        name,
        email
      }
    };
  }
}

export async function socialSignIn(provider: "google" | "apple") {
  try {
    return await request<{ token: string; user: Record<string, any> }>("/auth/social", {
      method: "POST",
      body: JSON.stringify({
        provider,
        providerId: `${provider}-demo-id`,
        email: provider === "google" ? "google@fortin.com" : "apple@fortin.com",
        name: provider === "google" ? "Cliente Google" : "Cliente Apple"
      })
    });
  } catch {
    return {
      token: `fortin-social-${provider}`,
      user: {
        id: `social-${provider}`,
        name: provider === "google" ? "Cliente Google" : "Cliente Apple",
        email: provider === "google" ? "google@fortin.com" : "apple@fortin.com"
      }
    };
  }
}

export async function fetchCatalog() {
  try {
    const [banners, categories, products, coupons] = await Promise.all([
      request<BannerItem[]>("/banners"),
      request<any[]>("/categories"),
      request<any[]>("/products"),
      request<any[]>("/coupons/public")
    ]);

    const normalized: CatalogPayload = {
      banners,
      categories: categories.map((category) => ({
        ...category,
        products: (category.products ?? []).map((product: any) => ({
          ...product,
          basePrice: Number(product.basePrice),
          costPrice: Number(product.costPrice ?? 0),
          accompanimentDetails: product.accompanimentDetails ?? "",
          sizes: product.sizes ?? [],
          addOns: product.addOns ?? []
        }))
      })),
      products: products.map((product: any) => ({
        ...product,
        basePrice: Number(product.basePrice),
        costPrice: Number(product.costPrice ?? 0),
        accompanimentDetails: product.accompanimentDetails ?? "",
        sizes: product.sizes ?? [],
        addOns: product.addOns ?? []
      })),
      coupons: coupons.map((coupon: any) => ({
        ...coupon,
        value: Number(coupon.value),
        minOrderValue: coupon.minOrderValue ? Number(coupon.minOrderValue) : null,
        maxDiscount: coupon.maxDiscount ? Number(coupon.maxDiscount) : null
      })) as CouponItem[]
    };

    await setCachedCatalog(normalized);
    return normalized;
  } catch {
    const cached = await getCachedCatalog();
    return cached ?? fallbackCatalog;
  }
}

export async function fetchProfile(token: string) {
  try {
    return await request<Profile>("/customers/me", {}, token);
  } catch {
    return fallbackProfile;
  }
}

export async function fetchOrders(token: string) {
  try {
    const orders = await request<any[]>("/orders/me", {}, token);
    return orders.map((order) => ({
      ...order,
      subtotal: Number(order.subtotal),
      discount: Number(order.discount),
      deliveryFee: Number(order.deliveryFee),
      total: Number(order.total),
      items: order.items.map((item: any) => ({
        ...item,
        unitPrice: Number(item.unitPrice)
      }))
    })) as OrderRecord[];
  } catch {
    return fallbackOrders;
  }
}

export async function trackOrder(code: string) {
  try {
    const order = await request<any>(`/orders/track/${encodeURIComponent(code)}`);
    return {
      ...order,
      subtotal: Number(order.subtotal),
      discount: Number(order.discount),
      deliveryFee: Number(order.deliveryFee),
      total: Number(order.total),
      items: order.items.map((item: any) => ({
        ...item,
        unitPrice: Number(item.unitPrice)
      }))
    } as OrderRecord;
  } catch {
    const normalized = code.replace(/^#/, "").replace(/^FRT-/i, "").trim().toLowerCase();
    const fallbackOrder = fallbackOrders.find((order) => order.id.toLowerCase().endsWith(normalized));

    if (fallbackOrder) {
      return {
        ...fallbackOrder,
        publicCode: `FRT-${fallbackOrder.id.slice(-6).toUpperCase()}`
      };
    }

    throw new Error("Pedido nao encontrado");
  }
}

export async function fetchNotifications(token: string) {
  try {
    return await request<AppNotification[]>("/notifications/me", {}, token);
  } catch {
    return fallbackNotifications;
  }
}

export async function validateCoupon(code: string, subtotal: number) {
  try {
    return await request<{ discount: number; valid: boolean }>("/coupons/validate", {
      method: "POST",
      body: JSON.stringify({ code, subtotal })
    });
  } catch {
    if (code.toUpperCase() === "FORTIN10") {
      return {
        valid: true,
        discount: subtotal * 0.1
      };
    }

    return {
      valid: false,
      discount: 0
    };
  }
}

export async function createOrder(token: string, payload: Record<string, any>) {
  try {
    const order = await request<any>("/orders", {
      method: "POST",
      body: JSON.stringify(payload)
    }, token);

    return {
      ...order,
      subtotal: Number(order.subtotal),
      discount: Number(order.discount),
      deliveryFee: Number(order.deliveryFee),
      total: Number(order.total)
    } as OrderRecord;
  } catch {
    const fallbackOrder: OrderRecord = {
      id: `demo-${Date.now()}`,
      publicCode: `FRT-${Date.now().toString().slice(-6)}`,
      status: "PENDING",
      paymentMethod: payload.paymentMethod,
      paymentStatus: payload.paymentMethod === "CARD" ? "PAID" : "PENDING",
      subtotal: payload.subtotal ?? 32,
      discount: payload.discount ?? 0,
      deliveryFee: DELIVERY_FEE,
      total: payload.total ?? 32,
      estimatedMinutes: 32,
      createdAt: new Date().toISOString(),
      items: payload.items.map((item: any) => ({
        id: `${item.productId}-${Date.now()}`,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        selectedSize: item.selectedSize,
        selectedAddOns: item.selectedAddOns
      }))
    };

    return fallbackOrder;
  }
}
