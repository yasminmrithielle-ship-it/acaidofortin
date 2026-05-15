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

const API_URL = import.meta.env.VITE_API_URL ?? import.meta.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3333/api";
const CART_KEY = "fortin_web_cart";
const ORDERS_KEY = "fortin_web_orders";

const sizeOptions: ProductOption[] = [
  { id: "300", name: "300ml", price: 18.9 },
  { id: "500", name: "500ml", price: 24.9 },
  { id: "700", name: "700ml", price: 31.9 }
];

const addOnOptions: ProductOption[] = [
  { id: "banana", name: "Banana", price: 2.5 },
  { id: "morango", name: "Morango", price: 4.5 },
  { id: "granola", name: "Granola artesanal", price: 3.5 },
  { id: "nutella", name: "Nutella", price: 6.5 }
];

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
    addOns: addOnOptions,
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
    addOns: addOnOptions,
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
    addOns: addOnOptions,
    category: { id: "especiais", name: "Especiais" }
  }
];

const fallbackBanners: Banner[] = [
  {
    id: "banner-1",
    title: "Semana Fortin",
    subtitle: "Compre 2 bowls e ganhe topping premium.",
    imageUrl: fortinProduct,
    ctaLabel: "Pedir agora"
  },
  {
    id: "banner-2",
    title: "Monte do seu jeito",
    subtitle: "Tamanhos, adicionais e entrega gratis ate 6 km.",
    imageUrl: fortinProduct,
    ctaLabel: "Explorar"
  }
];

const defaultDeliveryForm: DeliveryForm = {
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
    addOns: Array.isArray(product.addOns) && product.addOns.length ? product.addOns : addOnOptions,
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
  const [selectedAddOns, setSelectedAddOns] = useState<ProductOption[]>([fallbackProducts[0].addOns[2]]);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>(() => getStoredJson<CartItem[]>(CART_KEY, []));
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("PIX");
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
        setSelectedAddOns([]);
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
      cart.reduce((sum, item) => {
        const addOnTotal = item.addOns.reduce((total, addOn) => total + addOn.price, 0);
        return sum + (item.size.price + addOnTotal) * item.quantity;
      }, 0),
    [cart]
  );

  const discount = couponCode.trim().toUpperCase() === "FORTIN10" ? subtotal * 0.1 : 0;
  const total = cart.length ? subtotal - discount : 0;

  function openBuilder(product: Product) {
    setSelectedProduct(product);
    setSelectedSize(product.sizes[0] ?? sizeOptions[0]);
    setSelectedAddOns([]);
    setBuilderOpen(true);
  }

  function toggleAddon(addOn: ProductOption) {
    setSelectedAddOns((current) =>
      current.some((item) => item.id === addOn.id) ? current.filter((item) => item.id !== addOn.id) : [...current, addOn]
    );
  }

  function addToCart() {
    setCart((current) => [
      {
        id: `${selectedProduct.id}-${selectedSize.id}-${Date.now()}`,
        productId: selectedProduct.id,
        name: selectedProduct.name,
        imageUrl: selectedProduct.imageUrl || fortinProduct,
        size: selectedSize,
        addOns: selectedAddOns,
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
    if (!deliveryForm.street.trim()) return "Informe a rua.";
    if (!deliveryForm.number.trim()) return "Informe o numero.";
    if (!deliveryForm.neighborhood.trim()) return "Informe o bairro.";
    if (!onlyDigits(deliveryForm.phone)) return "Informe o telefone com WhatsApp.";
    return "";
  }

  function checkout() {
    if (cart.length === 0) {
      setNotice("Adicione um item antes de finalizar.");
      return;
    }

    const error = validateDelivery();
    if (error) {
      setNotice(error);
      return;
    }

    const createdOrder: TrackedOrder = {
      id: `FRT-${Math.floor(100000 + Math.random() * 900000)}`,
      status: "PENDING",
      total,
      paymentMethod,
      paymentStatus: paymentMethod === "CASH" ? "PENDING" : "PAID",
      createdAt: new Date().toISOString(),
      items: cart.map((item) => ({ quantity: item.quantity, productName: item.name }))
    };

    const orders = getStoredJson<TrackedOrder[]>(ORDERS_KEY, []);
    orders.unshift(createdOrder);
    window.localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));

    setTrackedOrder(createdOrder);
    setTrackCode(getOrderCode(createdOrder));
    setCart([]);
    setCouponCode("");
    setDeliveryForm(defaultDeliveryForm);
    setScreen("orders");
    setNotice(`Pedido ${getOrderCode(createdOrder)} enviado.`);
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
          <p>Catalogo digital, montagem de acai, carrinho e acompanhamento de pedido em uma interface web unica e responsiva.</p>
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
                  <p>Tamanhos, adicionais, cupom e acompanhamento por numero de pedido.</p>
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
                  placeholder="Buscar sabor ou adicional"
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
                                {item.size.name} · {item.addOns.map((addOn) => addOn.name).join(", ") || "Sem adicionais"}
                              </p>
                              <span>{money((item.size.price + item.addOns.reduce((sum, addOn) => sum + addOn.price, 0)) * item.quantity)}</span>
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
                            onClick={() => setPaymentMethod(item.key as PaymentMethod)}
                            type="button"
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
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

            <section className="builder-section">
              <h3>Adicionais</h3>
              <div className="chip-row">
                {selectedProduct.addOns.map((addOn) => (
                  <button
                    key={addOn.id}
                    className={selectedAddOns.some((item) => item.id === addOn.id) ? "chip-web active" : "chip-web"}
                    onClick={() => toggleAddon(addOn)}
                    type="button"
                  >
                    {addOn.name} · {money(addOn.price)}
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
