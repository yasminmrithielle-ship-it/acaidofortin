import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Linking } from "react-native";
import { PropsWithChildren, createContext, useContext, useEffect, useState } from "react";

import { createOrder, fetchCatalog, fetchNotifications, fetchOrders, fetchProfile, registerUser, signIn, socialSignIn, validateCoupon } from "../services/api";
import { getCurrentLocationLabel } from "../services/location";
import { connectRealtime, disconnectRealtime } from "../services/realtime";
import { AppNotification, CartItem, CatalogPayload, OrderRecord, Product, ProductOption, Profile } from "../types/app";

type PaymentMethod = "PIX" | "CARD" | "CASH";

type AppContextValue = {
  ready: boolean;
  token: string;
  catalog: CatalogPayload;
  profile: Profile | null;
  orders: OrderRecord[];
  notifications: AppNotification[];
  cart: CartItem[];
  locationLabel: string;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  registerAccount: (name: string, email: string, password: string) => Promise<void>;
  signInWithProvider: (provider: "google" | "apple") => Promise<void>;
  signOut: () => Promise<void>;
  refreshData: () => Promise<void>;
  addToCart: (product: Product, selectedSize: ProductOption, selectedAddOns: ProductOption[], quantity: number, notes?: string) => void;
  updateCartItemQuantity: (itemId: string, delta: number) => void;
  removeCartItem: (itemId: string) => void;
  applyCoupon: (code: string, subtotal: number) => Promise<number>;
  checkout: (paymentMethod: PaymentMethod, couponCode?: string) => Promise<void>;
  requestLocation: () => Promise<void>;
  openWhatsApp: () => Promise<void>;
};

const STORAGE_KEYS = {
  token: "fortin_token",
  cart: "fortin_cart"
};

const GUEST_TOKEN = "fortin-guest-order-token";

const emptyCatalog: CatalogPayload = {
  banners: [],
  categories: [],
  products: []
};

const AppContext = createContext<AppContextValue>({} as AppContextValue);

async function registerNotifications() {
  const settings = await Notifications.getPermissionsAsync();

  if (!settings.granted) {
    await Notifications.requestPermissionsAsync();
  }
}

export function AppProvider({ children }: PropsWithChildren) {
  const [ready, setReady] = useState(false);
  const [token, setToken] = useState(GUEST_TOKEN);
  const [catalog, setCatalog] = useState<CatalogPayload>(emptyCatalog);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [locationLabel, setLocationLabel] = useState("Entregando perto de você");

  useEffect(() => {
    async function bootstrap() {
      const [storedToken, storedCart] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.token),
        AsyncStorage.getItem(STORAGE_KEYS.cart)
      ]);

      const authToken = storedToken ?? GUEST_TOKEN;

      setToken(authToken);
      if (storedCart) setCart(JSON.parse(storedCart));

      const loadedCatalog = await fetchCatalog();
      setCatalog(loadedCatalog);
      await loadUserData(authToken);

      setReady(true);
    }

    bootstrap().catch(() => setReady(true));
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEYS.cart, JSON.stringify(cart)).catch(() => undefined);
  }, [cart]);

  useEffect(() => {
    if (!token) {
      disconnectRealtime();
      return;
    }

    const socket = connectRealtime();
    const activeOrder = orders.find((order) => order.status !== "DELIVERED" && order.status !== "CANCELED");

    if (activeOrder) {
      socket.emit("order:subscribe", activeOrder.id);
    }

    socket.on("order:updated", (payload: { orderId: string; status: OrderRecord["status"]; estimatedMinutes: number }) => {
      setOrders((current) =>
        current.map((order) =>
          order.id === payload.orderId
            ? {
                ...order,
                status: payload.status,
                estimatedMinutes: payload.estimatedMinutes
              }
            : order
        )
      );
    });

    return () => {
      socket.removeAllListeners("order:updated");
    };
  }, [token, orders]);

  async function loadUserData(authToken: string) {
    const [loadedProfile, loadedOrders, loadedNotifications] = await Promise.all([
      fetchProfile(authToken),
      fetchOrders(authToken),
      fetchNotifications(authToken)
    ]);

    setProfile(loadedProfile);
    setOrders(loadedOrders);
    setNotifications(loadedNotifications);
    registerNotifications().catch(() => undefined);
  }

  async function persistToken(nextToken: string) {
    setToken(nextToken);
    await AsyncStorage.setItem(STORAGE_KEYS.token, nextToken);
  }

  async function signInWithPassword(email: string, password: string) {
    const response = await signIn(email, password);
    await persistToken(response.token);
    await loadUserData(response.token);
  }

  async function registerAccount(name: string, email: string, password: string) {
    const response = await registerUser(name, email, password);
    await persistToken(response.token);
    await loadUserData(response.token);
  }

  async function signInWithProvider(provider: "google" | "apple") {
    const response = await socialSignIn(provider);
    await persistToken(response.token);
    await loadUserData(response.token);
  }

  async function signOut() {
    setToken("");
    setProfile(null);
    setOrders([]);
    setNotifications([]);
    setCart([]);
    await AsyncStorage.multiRemove([STORAGE_KEYS.token, STORAGE_KEYS.cart]);
  }

  async function refreshData() {
    const loadedCatalog = await fetchCatalog();
    setCatalog(loadedCatalog);

    if (token) {
      await loadUserData(token);
    }
  }

  function addToCart(product: Product, selectedSize: ProductOption, selectedAddOns: ProductOption[], quantity: number, notes?: string) {
    setCart((current) => [
      {
        id: `${product.id}-${selectedSize.id}-${Date.now()}`,
        product,
        quantity,
        selectedSize,
        selectedAddOns,
        notes
      },
      ...current
    ]);
  }

  function updateCartItemQuantity(itemId: string, delta: number) {
    setCart((current) =>
      current
        .map((item) => (item.id === itemId ? { ...item, quantity: item.quantity + delta } : item))
        .filter((item) => item.quantity > 0)
    );
  }

  function removeCartItem(itemId: string) {
    setCart((current) => current.filter((item) => item.id !== itemId));
  }

  async function applyCoupon(code: string, subtotal: number) {
    const result = await validateCoupon(code, subtotal);
    return result.valid ? result.discount : 0;
  }

  async function checkout(paymentMethod: PaymentMethod, couponCode?: string) {
    if (!token || !profile || cart.length === 0) {
      return;
    }

    const subtotal = cart.reduce((total, item) => {
      const addOnsTotal = item.selectedAddOns.reduce((sum, addOn) => sum + addOn.price, 0);
      return total + (item.selectedSize.price + addOnsTotal) * item.quantity;
    }, 0);

    const discount = couponCode ? await applyCoupon(couponCode, subtotal) : 0;
    const payload = {
      addressId: profile.addresses[0]?.id,
      couponCode: couponCode || undefined,
      paymentMethod,
      subtotal,
      discount,
      total: subtotal - discount + 6.5,
      items: cart.map((item) => ({
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        unitPrice: item.selectedSize.price + item.selectedAddOns.reduce((sum, addOn) => sum + addOn.price, 0),
        selectedSize: item.selectedSize,
        selectedSizeId: item.selectedSize.id,
        selectedAddOns: item.selectedAddOns,
        selectedAddOnIds: item.selectedAddOns.map((addOn) => addOn.id)
      }))
    };

    const order = await createOrder(token, payload);
    setOrders((current) => [order, ...current]);
    setCart([]);
  }

  async function requestLocation() {
    const label = await getCurrentLocationLabel();
    setLocationLabel(label);
  }

  async function openWhatsApp() {
    await Linking.openURL("https://wa.me/5511999990000?text=Oi%20A%C3%A7a%C3%AD%20do%20Fortin%2C%20preciso%20de%20ajuda%20com%20meu%20pedido.");
  }

  return (
    <AppContext.Provider
      value={{
        ready,
        token,
        catalog,
        profile,
        orders,
        notifications,
        cart,
        locationLabel,
        signInWithPassword,
        registerAccount,
        signInWithProvider,
        signOut,
        refreshData,
        addToCart,
        updateCartItemQuantity,
        removeCartItem,
        applyCoupon,
        checkout,
        requestLocation,
        openWhatsApp
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
