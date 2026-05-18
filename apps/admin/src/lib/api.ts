function isLocalHost(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "0.0.0.0";
}

function normalizeApiUrl(url: string) {
  return url.replace(/\/$/, "");
}

function resolveApiUrl() {
  const configuredUrl = import.meta.env.VITE_API_URL?.trim();
  if (configuredUrl) {
    return normalizeApiUrl(configuredUrl);
  }

  if (typeof window !== "undefined") {
    if (isLocalHost(window.location.hostname)) {
      return "http://localhost:3333/api";
    }

    return `${window.location.origin}/api`;
  }

  return "http://localhost:3333/api";
}

function isRemotePanelPointingToLocalApi() {
  if (typeof window === "undefined") return false;
  if (isLocalHost(window.location.hostname)) return false;
  return /^http:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?\/api$/i.test(API_URL);
}

const API_URL = resolveApiUrl();
const TOKEN_KEY = "fortin_admin_token";
const LOCAL_ORDERS_KEY = "fortin_live_orders";

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

export type WhatsAppConnection = {
  configured: boolean;
  connected: boolean;
  status: string;
  apiUrl?: string;
  botUrl?: string;
  phone?: string | null;
  accountName?: string | null;
  qrCodeDataUrl?: string | null;
  lastUpdatedAt?: string | null;
  lastError?: string | null;
  instructions: string[];
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

function normalizeOrderRecord(raw: any): OrderRecord {
  return {
    id: String(raw?.id ?? ""),
    publicCode: raw?.publicCode ? String(raw.publicCode) : undefined,
    status: String(raw?.status ?? "PENDING"),
    total: Number(raw?.total ?? 0),
    createdAt: String(raw?.createdAt ?? new Date().toISOString()),
    estimatedMinutes: Number(raw?.estimatedMinutes ?? 35),
    paymentMethod: String(raw?.paymentMethod ?? "PIX"),
    paymentStatus: String(raw?.paymentStatus ?? "PENDING"),
    user: raw?.user
      ? {
          name: String(raw.user.name ?? "Cliente"),
          phone: raw.user.phone ? String(raw.user.phone) : undefined
        }
      : undefined,
    address: raw?.address
      ? {
          street: String(raw.address.street ?? ""),
          number: String(raw.address.number ?? ""),
          complement: raw.address.complement ? String(raw.address.complement) : undefined,
          referencePoint: raw.address.referencePoint ? String(raw.address.referencePoint) : undefined,
          neighborhood: String(raw.address.neighborhood ?? ""),
          city: String(raw.address.city ?? ""),
          state: String(raw.address.state ?? ""),
          zipCode: raw.address.zipCode ? String(raw.address.zipCode) : undefined
        }
      : null,
    items: Array.isArray(raw?.items)
      ? raw.items.map((item: any, index: number) => ({
          id: String(item?.id ?? `${raw?.id ?? "order"}-${index}`),
          productName: String(item?.productName ?? "Item"),
          quantity: Number(item?.quantity ?? 0),
          unitPrice: Number(item?.unitPrice ?? 0),
          selectedSize: item?.selectedSize
            ? {
                name: item.selectedSize.name ? String(item.selectedSize.name) : undefined,
                price: item.selectedSize.price ? Number(item.selectedSize.price) : undefined
              }
            : undefined,
          selectedAddOns: Array.isArray(item?.selectedAddOns)
            ? item.selectedAddOns.map((addOn: any) => ({
                name: addOn?.name ? String(addOn.name) : undefined,
                price: addOn?.price ? Number(addOn.price) : undefined
              }))
            : [],
          notes: item?.notes ? String(item.notes) : undefined
        }))
      : []
  };
}

function getLocalOrders() {
  try {
    const raw = localStorage.getItem(LOCAL_ORDERS_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.map(normalizeOrderRecord).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch {
    return [];
  }
}

function persistLocalOrders(orders: OrderRecord[]) {
  localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(orders));
}

function buildLocalDashboardSummary(orders: OrderRecord[]): DashboardSummary {
  const activeOrders = orders.filter((order) => order.status !== "CANCELED");
  const revenue = activeOrders.reduce((total, order) => total + Number(order.total ?? 0), 0);
  const pendingOrders = activeOrders.filter((order) => ["PENDING", "CONFIRMED", "PREPARING"].includes(order.status)).length;
  const paymentBreakdownMap = new Map<string, { method: string; ordersCount: number; revenue: number }>();
  const revenueByDateMap = new Map<string, { date: string; ordersCount: number; revenue: number; profit: number }>();
  const topProductsMap = new Map<string, { name: string; quantity: number }>();
  const customers = new Set<string>();

  activeOrders.forEach((order) => {
    const paymentMethod = order.paymentMethod || "PIX";
    const paymentBreakdown = paymentBreakdownMap.get(paymentMethod) ?? {
      method: paymentMethod,
      ordersCount: 0,
      revenue: 0
    };

    paymentBreakdown.ordersCount += 1;
    paymentBreakdown.revenue += Number(order.total ?? 0);
    paymentBreakdownMap.set(paymentMethod, paymentBreakdown);

    const dateKey = String(order.createdAt ?? "").slice(0, 10);
    const revenueByDate = revenueByDateMap.get(dateKey) ?? {
      date: dateKey,
      ordersCount: 0,
      revenue: 0,
      profit: 0
    };

    revenueByDate.ordersCount += 1;
    revenueByDate.revenue += Number(order.total ?? 0);
    revenueByDateMap.set(dateKey, revenueByDate);

    if (order.user?.phone || order.user?.name) {
      customers.add(String(order.user?.phone ?? order.user?.name));
    }

    order.items.forEach((item) => {
      const current = topProductsMap.get(item.productName) ?? {
        name: item.productName,
        quantity: 0
      };

      current.quantity += Number(item.quantity ?? 0);
      topProductsMap.set(item.productName, current);
    });
  });

  return {
    metrics: {
      revenue,
      profit: 0,
      productCost: 0,
      ordersCount: activeOrders.length,
      customersCount: customers.size,
      productsCount: 0,
      pendingOrders
    },
    recentOrders: activeOrders.slice(0, 6),
    lowStockProducts: [],
    topProducts: Array.from(topProductsMap.values()).sort((a, b) => b.quantity - a.quantity).slice(0, 5),
    paymentBreakdown: Array.from(paymentBreakdownMap.values()).sort((a, b) => b.ordersCount - a.ordersCount),
    revenueByDate: Array.from(revenueByDateMap.values()).sort((a, b) => b.date.localeCompare(a.date))
  };
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
  try {
    return await request<DashboardSummary>("/dashboard/summary", { token });
  } catch {
    return buildLocalDashboardSummary(getLocalOrders());
  }
}

export async function getOrders(token: string) {
  try {
    return await request<OrderRecord[]>("/orders", { token });
  } catch {
    return getLocalOrders();
  }
}

export async function updateOrderStatus(token: string, orderId: string, status: string) {
  try {
    return await request(`/orders/${orderId}/status`, {
      method: "PATCH",
      token,
      body: JSON.stringify({ status })
    });
  } catch {
    const nextOrders = getLocalOrders().map((order) =>
      order.id === orderId
        ? {
            ...order,
            status,
            paymentStatus: status === "DELIVERED" ? "PAID" : order.paymentStatus
          }
        : order
    );

    persistLocalOrders(nextOrders);
    return nextOrders.find((order) => order.id === orderId);
  }
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

export async function getWhatsAppConnection(token: string) {
  try {
    return await request<WhatsAppConnection>("/whatsapp/connection", { token });
  } catch {
    if (isRemotePanelPointingToLocalApi()) {
      return {
        configured: false,
        connected: false,
        status: "api_inacessivel",
        apiUrl: API_URL,
        qrCodeDataUrl: null,
        lastUpdatedAt: null,
        lastError: "O painel publicado esta apontando para http://localhost:3333/api. Em uma pagina HTTPS do Netlify o navegador bloqueia essa chamada local.",
        instructions: [
          "Para testar agora, abra o painel localmente na mesma maquina do Docker.",
          "Para funcionar no site publicado, publique a API em HTTPS e configure VITE_API_URL no build."
        ]
      } satisfies WhatsAppConnection;
    }

    return {
      configured: false,
      connected: false,
      status: "offline",
      apiUrl: API_URL,
      qrCodeDataUrl: null,
      lastUpdatedAt: null,
      lastError: "Nao foi possivel consultar o servico do WhatsApp.",
      instructions: [
        "Verifique se a URL da API do painel esta correta e acessivel neste navegador.",
        "Se o painel estiver publicado, a API e o chatbot precisam estar publicados em HTTPS."
      ]
    } satisfies WhatsAppConnection;
  }
}

export const fallbackDashboard: DashboardSummary = buildLocalDashboardSummary([]);
export const fallbackOrders: OrderRecord[] = [];
