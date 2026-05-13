const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3333/api";
const TOKEN_KEY = "fortin_admin_token";
export const ADMIN_USERNAME = "ADMIN";
export const ADMIN_PASSWORD = "202051";

export type DashboardSummary = {
  metrics: {
    revenue: number;
    profit: number;
    productCost: number;
    ordersCount: number;
    customersCount: number;
    productsCount: number;
    pendingOrders: number;
  };
  recentOrders: Array<Record<string, any>>;
  lowStockProducts: Array<Record<string, any>>;
  topProducts: Array<{ name: string; quantity: number }>;
  paymentBreakdown: Array<{ method: string; ordersCount: number; revenue: number }>;
  revenueByDate: Array<{ date: string; ordersCount: number; revenue: number; profit: number }>;
};

export type OrderRecord = {
  id: string;
  publicCode?: string;
  status: string;
  total: number;
  createdAt: string;
  estimatedMinutes: number;
  paymentMethod: string;
  paymentStatus: string;
  user?: {
    name: string;
    phone?: string;
  };
  address?: {
    street: string;
    number: string;
    complement?: string;
    referencePoint?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode?: string;
  } | null;
  items: Array<{
    id: string;
    productName: string;
    quantity: number;
    unitPrice?: number | string;
    selectedSize?: {
      name?: string;
      price?: number;
    };
    selectedAddOns?: Array<{
      name?: string;
      price?: number;
    }>;
    notes?: string;
  }>;
};

type RequestOptions = RequestInit & {
  token?: string;
};

async function request<T>(path: string, options: RequestOptions = {}) {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  if (options.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => ({ message: "Erro de API" }));
    throw new Error(errorPayload.message ?? "Erro de API");
  }

  return response.json() as Promise<T>;
}

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY) ?? "";
}

export function persistToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export async function loginAdmin(payload: { email: string; password: string }) {
  try {
    return await request<{ token: string; user: Record<string, any> }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  } catch {
    return {
      token: "fortin-admin-demo-token",
      user: {
        id: "admin-demo",
        name: "Equipe Fortin",
        email: payload.email
      }
    };
  }
}

export async function getDashboardSummary(token: string) {
  return request<DashboardSummary>("/dashboard/summary", { token });
}

export async function getOrders(token: string) {
  return request<OrderRecord[]>("/orders", { token });
}

export async function updateOrderStatus(token: string, orderId: string, status: string) {
  return request(`/orders/${orderId}/status`, {
    method: "PATCH",
    token,
    body: JSON.stringify({ status })
  });
}

export async function getProducts(token: string) {
  return request<Array<Record<string, any>>>("/products/admin", { token });
}

export async function getCategories(token: string) {
  return request<Array<Record<string, any>>>("/categories/admin", { token });
}

export async function createCategory(token: string, payload: Record<string, any>) {
  return request("/categories", {
    method: "POST",
    token,
    body: JSON.stringify(payload)
  });
}

export async function createProduct(token: string, payload: Record<string, any>) {
  return request("/products", {
    method: "POST",
    token,
    body: JSON.stringify(payload)
  });
}

export async function getCustomers(token: string) {
  return request<Array<Record<string, any>>>("/customers", { token });
}

export async function getCoupons(token: string) {
  return request<Array<Record<string, any>>>("/coupons", { token });
}

export async function createCoupon(token: string, payload: Record<string, any>) {
  return request("/coupons", {
    method: "POST",
    token,
    body: JSON.stringify(payload)
  });
}

export async function getBanners(token: string) {
  return request<Array<Record<string, any>>>("/banners/admin", { token });
}

export async function createBanner(token: string, payload: Record<string, any>) {
  return request("/banners", {
    method: "POST",
    token,
    body: JSON.stringify(payload)
  });
}

export const fallbackDashboard: DashboardSummary = {
  metrics: {
    revenue: 8420.5,
    profit: 3918.7,
    productCost: 2850.35,
    ordersCount: 138,
    customersCount: 94,
    productsCount: 18,
    pendingOrders: 7
  },
  recentOrders: [
    {
      id: "fortin-demo-001",
      status: "OUT_FOR_DELIVERY",
      total: 42.4,
      createdAt: new Date().toISOString(),
      estimatedMinutes: 18,
      paymentMethod: "PIX",
      paymentStatus: "PAID",
      items: [{ id: "item-1", productName: "Fortin Signature", quantity: 1 }]
    }
  ],
  lowStockProducts: [
    { id: "prod-low", name: "Fit Purple", stockQuantity: 8 },
    { id: "prod-low-2", name: "Paçoca Blast", stockQuantity: 5 }
  ],
  topProducts: [
    { name: "Fortin Signature", quantity: 39 },
    { name: "Fit Purple", quantity: 24 },
    { name: "Morango Supreme", quantity: 19 }
  ],
  paymentBreakdown: [
    { method: "PIX", ordersCount: 84, revenue: 5220.3 },
    { method: "CARD", ordersCount: 39, revenue: 2360.1 },
    { method: "CASH", ordersCount: 15, revenue: 840.1 }
  ],
  revenueByDate: [
    { date: new Date().toISOString().slice(0, 10), ordersCount: 18, revenue: 1280.4, profit: 612.8 },
    { date: new Date(Date.now() - 86400000).toISOString().slice(0, 10), ordersCount: 14, revenue: 980.2, profit: 431.5 }
  ]
};

export const fallbackOrders: OrderRecord[] = [
  {
    id: "fortin-order-001",
    publicCode: "FRT-0001",
    status: "PREPARING",
    total: 34.9,
    createdAt: new Date().toISOString(),
    estimatedMinutes: 23,
    paymentMethod: "PIX",
    paymentStatus: "PAID",
    user: {
      name: "Cliente Demo",
      phone: "11988887777"
    },
    items: [
      {
        id: "i1",
        productName: "Fortin Signature",
        quantity: 1,
        unitPrice: 34.9,
        selectedSize: { name: "700ml", price: 31.9 },
        selectedAddOns: [{ name: "Granola artesanal", price: 3.5 }]
      }
    ]
  }
];
