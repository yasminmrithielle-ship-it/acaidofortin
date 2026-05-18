import { useEffect, useMemo, useState } from "react";

import fortinLogo from "../assets/brand/fortin-logo.jpeg";
import fortinProduct from "../assets/brand/fortin-product.jpeg";

type ScreenKey = "home" | "catalog" | "cart" | "orders";
type PaymentMethod = "PIX" | "CARD" | "CASH";

type ProductOption = {
  id: string;
  name: string;
  price: number;
};

type Product = {
  id: string;
  name: string;
  description: string;
  accompanimentDetails?: string;
  imageUrl?: string;
  basePrice: number;
  stockQuantity: number;
  category?: {
    id: string;
    name: string;
  };
  sizes: ProductOption[];
  addOns: ProductOption[];
  isFeatured?: boolean;
};

type Banner = {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  ctaLabel?: string;
};

type CartItem = {
  id: string;
  productId: string;
  name: string;
  imageUrl: string;
  size: ProductOption;
  addOns: ProductOption[];
  quantity: number;
  notes?: string;
};

type DeliveryForm = {
  customerName: string;
  zipCode: string;
  street: string;
  number: string;
  neighborhood: string;
  referencePoint: string;
  phone: string;
  city: string;
  state: string;
};

type TrackedOrder = {
  id: string;
  publicCode?: string;
  status: string;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  createdAt?: string;
  date?: string;
  items: Array<{ quantity: number; productName: string }>;
};

function isLocalHost(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "0.0.0.0";
}

function normalizeApiUrl(url: string) {
  return url.replace(/\/$/, "");
}

function resolveApiUrl() {
  const configuredUrl = import.meta.env.VITE_API_URL?.trim() ?? import.meta.env.EXPO_PUBLIC_API_URL?.trim();
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

const API_URL = resolveApiUrl();
const CART_KEY = "fortin_web_cart";
const ORDERS_KEY = "fortin_live_orders";
const CUSTOMER_TOKEN_KEY = "fortin_customer_token";
const CUSTOMER_IDENTITY_KEY = "fortin_customer_identity";

const sizeOptions: ProductOption[] = [
  { id: "300", name: "300ml", price: 18.9 },
  { id: "500", name: "500ml", price: 24.9 },
  { id: "700", name: "700ml", price: 31.9 }
];

const addOnOptions: ProductOption[] = [];

const fallbackProducts: Product[] = [
  {
    id: "fortin-signature",
    name: "Fortin Signature",
    description: "Acai artesanal com creme ninho, banana e granola crocante.",
    accompanimentDetails: "Acai, creme ninho, banana, granola crocante e leite em po.",
    imageUrl: fortinProduct,
    basePrice: 31.9,
    stockQuantity: 40,
    sizes: sizeOptions,
    addOns: [],
    isFeatured: true,
    category: { id: "tradicionais", name: "Tradicionais" }
  },
  {
    id: "fit-purple",
    name: "Fit Purple",
    description: "Blend zero acucar com morango e whey de baunilha.",
    accompanimentDetails: "Acai zero acucar, whey de baunilha, morango e granola sem acucar.",
    imageUrl: fortinProduct,
    basePrice: 34.9,
    stockQuantity: 22,
    sizes: sizeOptions,
    addOns: [],
    isFeatured: true,
    category: { id: "zero-acucar", name: "Zero acucar" }
  },
  {
    id: "morango-supreme",
    name: "Morango Supreme",
    description: "Camadas premium com calda de morango e leite em po.",
    accompanimentDetails: "Acai, morango, calda artesanal, leite em po e granola.",
    imageUrl: fortinProduct,
    basePrice: 29.9,
    stockQuantity: 31,
    sizes: sizeOptions,
    addOns: [],
    category: { id: "especiais", name: "Especiais" }
  }
];

const fallbackBanners: Banner[] = [
  {
    id: "banner-1",
    title: "Semana Fortin",
    subtitle: "Sabores premium para iniciar os pedidos da loja.",
    imageUrl: fortinProduct,
    ctaLabel: "Pedir agora"
  },
  {
    id: "banner-2",
    title: "Monte do seu jeito",
    subtitle: "Tamanhos, entrega gratis ate 6 km e pedido rapido.",
    imageUrl: fortinProduct,
    ctaLabel: "Explorar"
  }
];

const defaultDeliveryForm: DeliveryForm = {
  customerName: "",
  zipCode: "",
  street: "",
  number: "",
  neighborhood: "",
  referencePoint: "",
  phone: "",
  city: "Belo Horizonte",
  state: "MG"
};

function money(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

function getStoredJson<T>(key: string, fallback: T) {
  const raw = window.localStorage.getItem(key);
  return raw ? (JSON.parse(raw) as T) : fallback;
}

function getOrderCode(order: TrackedOrder) {
  return order.publicCode ?? order.id;
}

async function apiRequest<T>(path: string, options: RequestInit & { token?: string } = {}) {
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
    throw new Error("Falha de API");
  }

  return response.json() as Promise<T>;
}

function buildGuestCredentials(phone: string) {
  const digits = onlyDigits(phone).padStart(10, "0").slice(-10);

  return {
    email: `pedido.${digits}@fortin.local`,
    password: `Fortin#${digits}`
  };
}

function normalizeTrackedOrder(order: any): TrackedOrder {
  return {
    id: String(order.id),
    publicCode: order.publicCode ? String(order.publicCode) : undefined,
    status: String(order.status ?? "PENDING"),
    total: Number(order.total ?? 0),
    paymentMethod: String(order.paymentMethod ?? "PIX"),
    paymentStatus: String(order.paymentStatus ?? "PENDING"),
    createdAt: String(order.createdAt ?? new Date().toISOString()),
    items: Array.isArray(order.items)
      ? order.items.map((item: any) => ({
          quantity: Number(item.quantity ?? 0),
          productName: String(item.productName ?? "Item")
        }))
      : []
  };
}

function persistOrder(order: any) {
  const orders = getStoredJson<any[]>(ORDERS_KEY, []);
  orders.unshift(order);
  window.localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
}

async function ensureCustomerToken(deliveryForm: DeliveryForm) {
  const credentials = buildGuestCredentials(deliveryForm.phone);
  const storedToken = window.localStorage.getItem(CUSTOMER_TOKEN_KEY);
  const storedIdentity = window.localStorage.getItem(CUSTOMER_IDENTITY_KEY);

  if (storedToken && storedIdentity === credentials.email) {
    return storedToken;
  }

  try {
    const loginResponse = await apiRequest<{ token: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials)
    });

    window.localStorage.setItem(CUSTOMER_TOKEN_KEY, loginResponse.token);
    window.localStorage.setItem(CUSTOMER_IDENTITY_KEY, credentials.email);
    return loginResponse.token;
  } catch {
    const registerResponse = await apiRequest<{ token: string }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name: deliveryForm.customerName.trim(),
        email: credentials.email,
        phone: deliveryForm.phone,
        password: credentials.password
      })
    });

    window.localStorage.setItem(CUSTOMER_TOKEN_KEY, registerResponse.token);
    window.localStorage.setItem(CUSTOMER_IDENTITY_KEY, credentials.email);
    return registerResponse.token;
  }
}

async function createApiOrder(
  cart: CartItem[],
  deliveryForm: DeliveryForm,
  couponCode: string,
  paymentMethod: PaymentMethod,
  changeFor?: number
) {
  const token = await ensureCustomerToken(deliveryForm);

  return apiRequest<any>("/orders", {
    method: "POST",
    token,
    body: JSON.stringify({
      deliveryAddress: {
        zipCode: deliveryForm.zipCode,
        street: deliveryForm.street,
        number: deliveryForm.number,
        referencePoint: deliveryForm.referencePoint,
        phone: deliveryForm.phone,
        neighborhood: deliveryForm.neighborhood,
        city: deliveryForm.city,
        state: deliveryForm.state
      },
      couponCode: couponCode.trim() || undefined,
      paymentMethod,
      changeFor,
      items: cart.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        selectedSizeId: item.size.id,
        selectedAddOnIds: [],
        notes: item.notes
      }))
    })
  });
}

function createLocalOrder(
  cart: CartItem[],
  deliveryForm: DeliveryForm,
  total: number,
  paymentMethod: PaymentMethod,
  changeFor?: number
) {
  const publicCode = `FRT-${Math.floor(100000 + Math.random() * 900000)}`;

  return {
    id: `local-${Date.now()}`,
    publicCode,
    status: "PENDING",
    total,
    paymentMethod,
    paymentStatus: paymentMethod === "CASH" ? "PENDING" : "PAID",
    estimatedMinutes: 35,
    createdAt: new Date().toISOString(),
    user: {
      name: deliveryForm.customerName.trim(),
      phone: deliveryForm.phone
    },
    address: {
      street: deliveryForm.street,
      number: deliveryForm.number,
      neighborhood: deliveryForm.neighborhood,
      city: deliveryForm.city,
      state: deliveryForm.state,
      zipCode: deliveryForm.zipCode,
      referencePoint: deliveryForm.referencePoint
    },
    items: cart.map((item, index) => ({
      id: `${publicCode}-${index}`,
      productName: item.name,
      quantity: item.quantity,
      unitPrice: item.size.price,
      selectedSize: item.size,
      selectedAddOns: [],
      notes: item.notes
    })),
    payment: changeFor ? { changeFor } : undefined
  };
}

function normalizeProduct(product: any): Product {
  return {
    id: product.id,
    name: product.name,
    description: product.description ?? "Acai artesanal premium.",
    accompanimentDetails: product.accompanimentDetails ?? "",
    imageUrl: product.imageUrl || fortinProduct,
    basePrice: Number(product.basePrice ?? 0),
    stockQuantity: Number(product.stockQuantity ?? 0),
    sizes: Array.isArray(product.sizes) && product.sizes.length ? product.sizes : sizeOptions,
    addOns: [],
    isFeatured: Boolean(product.isFeatured),
    category: product.category ? { id: product.category.id, name: product.category.name } : undefined
  };
}

async function loadCatalog() {
  try {
    const [productsResponse, bannersResponse] = await Promise.all([
      fetch(`${API_URL}/products`),
      fetch(`${API_URL}/banners`)
    ]);

    if (!productsResponse.ok || !bannersResponse.ok) {
      throw new Error("Falha ao carregar catalogo");
    }

    const [products, banners] = await Promise.all([productsResponse.json(), bannersResponse.json()]);
    return {
      products: (products as any[]).map(normalizeProduct),
      banners: (banners as any[]).map((banner) => ({
        id: banner.id,
        title: banner.title,
        subtitle: banner.subtitle,
        imageUrl: banner.imageUrl || fortinProduct,
        ctaLabel: banner.ctaLabel || "Pedir agora"
      }))
    };
  } catch {
    return { products: fallbackProducts, banners: fallbackBanners };
  }
}

export default function App() {
  const [screen, setScreen] = useState<ScreenKey>("home");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>(fallbackProducts);
  const [banners, setBanners] = useState<Banner[]>(fallbackBanners);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Todos");
  const [selectedProduct, setSelectedProduct] = useState<Product>(fallbackProducts[0]);
  const [selectedSize, setSelectedSize] = useState<ProductOption>(fallbackProducts[0].sizes[2]);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>(() => getStoredJson<CartItem[]>(CART_KEY, []));
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("PIX");
  const [needsChange, setNeedsChange] = useState(false);
  const [changeFor, setChangeFor] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [deliveryForm, setDeliveryForm] = useState<DeliveryForm>(defaultDeliveryForm);
  const [cepStatus, setCepStatus] = useState("");
  const [notice, setNotice] = useState("");
  const [trackCode, setTrackCode] = useState("");
  const [trackedOrder, setTrackedOrder] = useState<TrackedOrder | null>(null);

  useEffect(() => {
    loadCatalog().then(({ products: nextProducts, banners: nextBanners }) => {
      setProducts(nextProducts);
      setBanners(nextBanners);
      if (nextProducts.length > 0) {
        setSelectedProduct(nextProducts[0]);
        setSelectedSize(nextProducts[0].sizes[0] ?? sizeOptions[0]);
      }
    });
  }, []);

  useEffect(() => {
    window.localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 2400);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const categories = useMemo(() => ["Todos", ...new Set(products.map((product) => product.category?.name).filter(Boolean) as string[])], [products]);

  const filteredProducts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return products.filter((product) => {
      const matchesCategory = category === "Todos" || product.category?.name === category;
      const matchesSearch = `${product.name} ${product.description}`.toLowerCase().includes(normalizedSearch);
      return matchesCategory && matchesSearch;
    });
  }, [category, products, search]);

  const subtotal = useMemo(
    () =>
      cart.reduce((sum, item) => sum + item.size.price * item.quantity, 0),
    [cart]
  );

  const discount = couponCode.trim().toUpperCase() === "FORTIN10" ? subtotal * 0.1 : 0;
  const total = cart.length ? subtotal - discount : 0;
  const changeForValue = Number(changeFor || 0);
  const changeAmount = needsChange && changeForValue >= total ? changeForValue - total : 0;

  function openBuilder(product: Product) {
    setSelectedProduct(product);
    setSelectedSize(product.sizes[0] ?? sizeOptions[0]);
    setBuilderOpen(true);
  }

  function addToCart() {
    setCart((current) => [
      {
        id: `${selectedProduct.id}-${selectedSize.id}-${Date.now()}`,
        productId: selectedProduct.id,
        name: selectedProduct.name,
        imageUrl: selectedProduct.imageUrl || fortinProduct,
        size: selectedSize,
        addOns: [],
        quantity: 1
      },
      ...current
    ]);
    setBuilderOpen(false);
    setScreen("cart");
    setNotice("Item adicionado ao carrinho.");
  }

  function removeCartItem(itemId: string) {
    setCart((current) => current.filter((item) => item.id !== itemId));
  }

  function updateDeliveryField(field: keyof DeliveryForm, value: string) {
    setDeliveryForm((current) => ({ ...current, [field]: value }));
  }

  async function lookupCep() {
    const zipCode = onlyDigits(deliveryForm.zipCode);
    if (!zipCode) {
      setCepStatus("");
      return;
    }
    if (zipCode.length !== 8) {
      setCepStatus("Informe 8 digitos para buscar o CEP.");
      return;
    }

    setCepStatus("Buscando CEP...");

    try {
      const response = await fetch(`https://viacep.com.br/ws/${zipCode}/json/`);
      const data = await response.json();

      if (!response.ok || data.erro) {
        setCepStatus("CEP nao encontrado. Preencha manualmente.");
        return;
      }

      setDeliveryForm((current) => ({
        ...current,
        zipCode: data.cep || current.zipCode,
        street: data.logradouro || current.street,
        neighborhood: data.bairro || current.neighborhood,
        city: data.localidade || current.city,
        state: data.uf || current.state
      }));
      setCepStatus("Endereco localizado pelo CEP.");
    } catch {
      setCepStatus("Nao foi possivel consultar o CEP agora.");
    }
  }

  function validateDelivery() {
    if (!deliveryForm.customerName.trim()) return "Informe o nome do cliente.";
    if (!deliveryForm.street.trim()) return "Informe a rua.";
    if (!deliveryForm.number.trim()) return "Informe o numero.";
    if (!deliveryForm.neighborhood.trim()) return "Informe o bairro.";
    if (!onlyDigits(deliveryForm.phone)) return "Informe o telefone com WhatsApp.";
    if (paymentMethod === "CASH" && needsChange) {
      if (!changeFor.trim()) return "Informe o valor para troco.";
      if (changeForValue < total) return "O valor para troco precisa ser maior ou igual ao total.";
    }
    return "";
  }

  async function checkout() {
    if (cart.length === 0) {
      setNotice("Adicione um item antes de finalizar.");
      return;
    }

    const error = validateDelivery();
    if (error) {
      setNotice(error);
      return;
    }

    let createdOrder: any;
    const nextChangeFor = paymentMethod === "CASH" && needsChange ? changeForValue : undefined;

    try {
      createdOrder = await createApiOrder(cart, deliveryForm, couponCode, paymentMethod, nextChangeFor);
    } catch {
      createdOrder = createLocalOrder(cart, deliveryForm, total, paymentMethod, nextChangeFor);
    }

    persistOrder(createdOrder);
    const tracked = normalizeTrackedOrder(createdOrder);

    setTrackedOrder(tracked);
    setTrackCode(getOrderCode(tracked));
    setCart([]);
    setNeedsChange(false);
    setChangeFor("");
    setCouponCode("");
    setDeliveryForm(defaultDeliveryForm);
    setScreen("orders");
    setNotice(`Pedido ${getOrderCode(tracked)} enviado.`);
  }

  async function trackOrder() {
    const normalizedCode = trackCode.trim();
    if (!normalizedCode) {
      setNotice("Informe o numero do pedido.");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/orders/track/${encodeURIComponent(normalizedCode)}`);
      if (!response.ok) {
        throw new Error("Pedido nao encontrado");
      }
      const order = await response.json();
      setTrackedOrder({
        id: order.id,
        publicCode: order.publicCode,
        status: order.status,
        total: Number(order.total ?? 0),
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        createdAt: order.createdAt,
        items: (order.items ?? []).map((item: any) => ({
          quantity: Number(item.quantity ?? 0),
          productName: item.productName
        }))
      });
    } catch {
      const stored = getStoredJson<TrackedOrder[]>(ORDERS_KEY, []).find((order) => getOrderCode(order).toUpperCase() === normalizedCode.toUpperCase());
      setTrackedOrder(stored ?? null);
      if (!stored) {
        setNotice("Pedido nao encontrado.");
      }
    }
  }

  const featuredProducts = products.filter((product) => product.isFeatured).slice(0, 4);

  return (
    <div className="storefront-shell">
      <div className="storefront-layout">
        <aside className="storefront-summary">
          <img alt="Acai do Fortin" className="summary-logo" src={fortinLogo} />
          <span className="summary-eyebrow">React + Vite</span>
          <h1>Acai do Fortin</h1>
          <p>Catalogo digital, montagem por tamanho, carrinho e acompanhamento de pedido em uma interface web unica e responsiva.</p>
          <div className="summary-metrics">
            <article className="summary-metric">
              <strong>28 min</strong>
              <span>Entrega media</span>
            </article>
            <article className="summary-metric">
              <strong>R$ 0</strong>
              <span>Entrega ate 6 km</span>
            </article>
            <article className="summary-metric">
              <strong>/admin</strong>
              <span>Painel separado</span>
            </article>
          </div>
        </aside>

        <main className="storefront-app">
          <header className="app-header">
            <div className="brand-lockup">
              <img alt="Acai do Fortin" className="brand-logo" src={fortinLogo} />
              <div>
                <strong>Acai do Fortin</strong>
                <span>Entrega gratis ate 6 km</span>
              </div>
            </div>
            <button className="menu-toggle-web" onClick={() => setDrawerOpen(true)} type="button">
              Menu
            </button>
          </header>

          <nav className="top-nav">
            {[
              { key: "home", label: "Inicio" },
              { key: "catalog", label: "Cardapio" },
              { key: "cart", label: `Carrinho (${cart.length})` },
              { key: "orders", label: "Pedidos" }
            ].map((item) => (
              <button
                key={item.key}
                className={screen === item.key ? "nav-pill active" : "nav-pill"}
                onClick={() => setScreen(item.key as ScreenKey)}
                type="button"
              >
                {item.label}
              </button>
            ))}
          </nav>

          {screen === "home" ? (
            <section className="page-stack">
              <article className="hero-card">
                <div className="hero-copy">
                  <span className="hero-eyebrow">Semana Fortin</span>
                  <h2>Monte seu acai premium do seu jeito.</h2>
                  <p>Tamanhos, cupom e acompanhamento por numero de pedido.</p>
                  <button className="primary-button-web" onClick={() => setScreen("catalog")} type="button">
                    Pedir agora
                  </button>
                </div>
                <img alt="Produto Fortin" className="hero-image" src={fortinProduct} />
              </article>

              <section className="page-section">
                <div className="section-heading">
                  <div>
                    <h3>Mais pedidos</h3>
                    <p>Selecao pronta para vender rapido</p>
                  </div>
                </div>
                <div className="product-grid">
                  {featuredProducts.map((product) => (
                    <article className="product-card-web" key={product.id}>
                      <img alt={product.name} className="product-thumb" src={product.imageUrl || fortinProduct} />
                      <div className="product-copy">
                        <strong>{product.name}</strong>
                        <p>{product.description}</p>
                        <div className="product-meta">
                          <span>{money(product.basePrice)}</span>
                          <button className="secondary-button-web" onClick={() => openBuilder(product)} type="button">
                            Montar
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>

              <section className="page-section">
                <div className="section-heading">
                  <div>
                    <h3>Promocoes</h3>
                    <p>Atualizadas pelo painel</p>
                  </div>
                </div>
                <div className="banner-grid">
                  {banners.map((banner) => (
                    <article className="banner-card" key={banner.id}>
                      <img alt={banner.title} className="banner-image" src={banner.imageUrl || fortinProduct} />
                      <div className="banner-copy">
                        <strong>{banner.title}</strong>
                        <p>{banner.subtitle}</p>
                        <button className="secondary-button-web" onClick={() => setScreen("catalog")} type="button">
                          {banner.ctaLabel || "Explorar"}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            </section>
          ) : null}

          {screen === "catalog" ? (
            <section className="page-stack">
              <div className="catalog-toolbar">
                <input
                  className="text-input-web"
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar sabor"
                  value={search}
                />
                <div className="chip-row">
                  {categories.map((item) => (
                    <button
                      key={item}
                      className={category === item ? "chip-web active" : "chip-web"}
                      onClick={() => setCategory(item)}
                      type="button"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div className="product-grid">
                {filteredProducts.map((product) => (
                  <article className="product-card-web" key={product.id}>
                    <img alt={product.name} className="product-thumb" src={product.imageUrl || fortinProduct} />
                    <div className="product-copy">
                      <strong>{product.name}</strong>
                      <p>{product.description}</p>
                      <div className="product-meta">
                        <span>{money(product.basePrice)}</span>
                        <button className="secondary-button-web" onClick={() => openBuilder(product)} type="button">
                          Montar
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {screen === "cart" ? (
            <section className="page-stack">
              <div className="cart-layout">
                <div className="cart-column">
                  <section className="page-section">
                    <div className="section-heading">
                      <div>
                        <h3>Seu carrinho</h3>
                        <p>Cupom, pagamento e entrega</p>
                      </div>
                    </div>
                    <div className="stack-list">
                      {cart.length ? (
                        cart.map((item) => (
                          <article className="cart-card" key={item.id}>
                            <img alt={item.name} className="cart-thumb" src={item.imageUrl} />
                            <div className="cart-copy">
                              <strong>{item.name}</strong>
                              <p>
                                {item.size.name}
                              </p>
                              <span>{money(item.size.price * item.quantity)}</span>
                            </div>
                            <button className="link-button-web" onClick={() => removeCartItem(item.id)} type="button">
                              Remover
                            </button>
                          </article>
                        ))
                      ) : (
                        <article className="empty-card">
                          <strong>Carrinho vazio</strong>
                          <p>Monte um acai para continuar.</p>
                        </article>
                      )}
                    </div>
                  </section>
                </div>

                <aside className="cart-column cart-column-side">
                  <section className="page-section">
                    <div className="section-heading">
                      <div>
                        <h3>Entrega</h3>
                        <p>Gratis ate 6 km</p>
                      </div>
                    </div>
                    <div className="form-grid-web">
                      <input
                        className="text-input-web"
                        onBlur={lookupCep}
                        onChange={(event) => updateDeliveryField("zipCode", event.target.value)}
                        placeholder="CEP opcional"
                        value={deliveryForm.zipCode}
                      />
                      {cepStatus ? <span className="helper-text">{cepStatus}</span> : null}
                      <input className="text-input-web" onChange={(event) => updateDeliveryField("customerName", event.target.value)} placeholder="Nome do cliente" value={deliveryForm.customerName} />
                      <input className="text-input-web" onChange={(event) => updateDeliveryField("street", event.target.value)} placeholder="Rua" value={deliveryForm.street} />
                      <div className="two-columns-web">
                        <input className="text-input-web" onChange={(event) => updateDeliveryField("number", event.target.value)} placeholder="Numero" value={deliveryForm.number} />
                        <input className="text-input-web" onChange={(event) => updateDeliveryField("neighborhood", event.target.value)} placeholder="Bairro" value={deliveryForm.neighborhood} />
                      </div>
                      <input className="text-input-web" onChange={(event) => updateDeliveryField("referencePoint", event.target.value)} placeholder="Ponto de referencia" value={deliveryForm.referencePoint} />
                      <input className="text-input-web" onChange={(event) => updateDeliveryField("phone", event.target.value)} placeholder="Telefone com WhatsApp" value={deliveryForm.phone} />
                    </div>
                  </section>

                  <section className="page-section">
                    <div className="form-grid-web">
                      <input className="text-input-web" onChange={(event) => setCouponCode(event.target.value)} placeholder="Cupom: FORTIN10" value={couponCode} />
                      <div className="chip-row">
                        {[
                          { key: "PIX", label: "PIX" },
                          { key: "CARD", label: "Cartao" },
                          { key: "CASH", label: "Dinheiro" }
                        ].map((item) => (
                          <button
                            key={item.key}
                            className={paymentMethod === item.key ? "chip-web active" : "chip-web"}
                            onClick={() => {
                              setPaymentMethod(item.key as PaymentMethod);
                              if (item.key !== "CASH") {
                                setNeedsChange(false);
                                setChangeFor("");
                              }
                            }}
                            type="button"
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                      {paymentMethod === "CASH" ? (
                        <div className="payment-option-card">
                          <label className="checkbox-row">
                            <input
                              checked={needsChange}
                              onChange={(event) => {
                                setNeedsChange(event.target.checked);
                                if (!event.target.checked) {
                                  setChangeFor("");
                                }
                              }}
                              type="checkbox"
                            />
                            <span>Precisa de troco</span>
                          </label>
                          {needsChange ? (
                            <>
                              <input
                                className="text-input-web"
                                onChange={(event) => setChangeFor(event.target.value)}
                                placeholder="Troco para quanto?"
                                value={changeFor}
                              />
                              <span className="helper-text">
                                {changeForValue >= total
                                  ? `Troco previsto: ${money(changeAmount)}`
                                  : "Informe um valor maior ou igual ao total do pedido."}
                              </span>
                            </>
                          ) : null}
                        </div>
                      ) : null}
                      <div className="summary-card">
                        <div className="summary-row"><span>Subtotal</span><strong>{money(subtotal)}</strong></div>
                        <div className="summary-row"><span>Desconto</span><strong>{money(discount)}</strong></div>
                        <div className="summary-row"><span>Entrega</span><strong>Gratis ate 6 km</strong></div>
                        <div className="summary-row total"><span>Total</span><strong>{money(total)}</strong></div>
                      </div>
                      <button className="primary-button-web wide" onClick={checkout} type="button">
                        Finalizar pedido
                      </button>
                    </div>
                  </section>
                </aside>
              </div>
            </section>
          ) : null}

          {screen === "orders" ? (
            <section className="page-stack">
              <section className="page-section narrow">
                <div className="section-heading">
                  <div>
                    <h3>Acompanhar pedido</h3>
                    <p>Cole o numero enviado no WhatsApp</p>
                  </div>
                </div>
                <div className="form-grid-web">
                  <input className="text-input-web" onChange={(event) => setTrackCode(event.target.value)} placeholder="Ex: FRT-204" value={trackCode} />
                  <button className="primary-button-web wide" onClick={trackOrder} type="button">
                    Ver atualizacoes
                  </button>
                </div>
              </section>

              <section className="page-section narrow">
                {trackedOrder ? (
                  <article className="tracking-card">
                    <strong>Pedido #{getOrderCode(trackedOrder)}</strong>
                    <p>{trackedOrder.items.map((item) => `${item.quantity}x ${item.productName}`).join(", ")}</p>
                    <p>
                      {trackedOrder.paymentMethod} · {trackedOrder.paymentStatus} · {money(trackedOrder.total)}
                    </p>
                    <div className="status-list">
                      {[
                        { key: "PENDING", label: "Recebido" },
                        { key: "PREPARING", label: "Em preparo" },
                        { key: "OUT_FOR_DELIVERY", label: "Saiu para entrega" },
                        { key: "DELIVERED", label: "Entregue" }
                      ].map((step, index, steps) => {
                        const activeIndex = Math.max(steps.findIndex((item) => item.key === trackedOrder.status), 0);
                        return (
                          <div className={index <= activeIndex ? "status-step active" : "status-step"} key={step.key}>
                            <span className="status-dot" />
                            <span>{step.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </article>
                ) : (
                  <article className="empty-card">
                    <strong>Sem pedido carregado</strong>
                    <p>Informe o numero do pedido para acompanhar o status.</p>
                  </article>
                )}
              </section>
            </section>
          ) : null}
        </main>
      </div>

      {builderOpen ? (
        <div className="builder-overlay" onClick={() => setBuilderOpen(false)}>
          <div className="builder-modal" onClick={(event) => event.stopPropagation()}>
            <div className="builder-head">
              <div>
                <strong>{selectedProduct.name}</strong>
                <p>{selectedProduct.description}</p>
              </div>
              <button className="menu-toggle-web" onClick={() => setBuilderOpen(false)} type="button">
                Fechar
              </button>
            </div>

            <img alt={selectedProduct.name} className="builder-image" src={selectedProduct.imageUrl || fortinProduct} />

            <section className="builder-section">
              <h3>Tamanho</h3>
              <div className="chip-row">
                {selectedProduct.sizes.map((size) => (
                  <button
                    key={size.id}
                    className={selectedSize.id === size.id ? "chip-web active" : "chip-web"}
                    onClick={() => setSelectedSize(size)}
                    type="button"
                  >
                    {size.name} · {money(size.price)}
                  </button>
                ))}
              </div>
            </section>

            <button className="primary-button-web wide" onClick={addToCart} type="button">
              Adicionar ao carrinho
            </button>
          </div>
        </div>
      ) : null}

      {drawerOpen ? (
        <div className="drawer-overlay" onClick={() => setDrawerOpen(false)}>
          <aside className="drawer-panel" onClick={(event) => event.stopPropagation()}>
            <div className="drawer-brand">
              <img alt="Acai do Fortin" className="brand-logo" src={fortinLogo} />
              <button className="menu-toggle-web" onClick={() => setDrawerOpen(false)} type="button">
                Fechar
              </button>
            </div>
            {[
              { key: "home", label: "Inicio" },
              { key: "catalog", label: "Cardapio" },
              { key: "cart", label: "Carrinho" },
              { key: "orders", label: "Pedidos" }
            ].map((item) => (
              <button
                key={item.key}
                className={screen === item.key ? "drawer-link active" : "drawer-link"}
                onClick={() => {
                  setScreen(item.key as ScreenKey);
                  setDrawerOpen(false);
                }}
                type="button"
              >
                {item.label}
              </button>
            ))}
          </aside>
        </div>
      ) : null}

      {notice ? <div className="notice-web">{notice}</div> : null}
    </div>
  );
}
