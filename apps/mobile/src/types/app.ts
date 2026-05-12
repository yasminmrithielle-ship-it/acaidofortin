import type { ImageSourcePropType } from "react-native";

export type BannerItem = {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  imageAsset?: ImageSourcePropType;
  ctaLabel?: string;
  ctaLink?: string;
};

export type ProductOption = {
  id: string;
  name: string;
  price: number;
};

export type Product = {
  id: string;
  name: string;
  description?: string;
  accompanimentDetails?: string;
  imageUrl?: string;
  imageAsset?: ImageSourcePropType;
  basePrice: number;
  costPrice?: number;
  sizes: ProductOption[];
  addOns: ProductOption[];
  stockQuantity: number;
  isFeatured: boolean;
  categoryId?: string | null;
  category?: {
    id: string;
    name: string;
  };
};

export type Category = {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  products: Product[];
};

export type CouponItem = {
  id: string;
  code: string;
  description?: string;
  discountType: "PERCENT" | "FIXED" | "DELIVERY";
  value: number;
  minOrderValue?: number | null;
  maxDiscount?: number | null;
  endsAt?: string | null;
};

export type CartItem = {
  id: string;
  product: Product;
  quantity: number;
  selectedSize: ProductOption;
  selectedAddOns: ProductOption[];
  notes?: string;
};

export type OrderRecord = {
  id: string;
  status: "PENDING" | "CONFIRMED" | "PREPARING" | "OUT_FOR_DELIVERY" | "DELIVERED" | "CANCELED";
  paymentMethod: "PIX" | "CARD" | "CASH";
  paymentStatus: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  estimatedMinutes: number;
  createdAt: string;
  items: Array<{
    id: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    selectedSize: ProductOption;
    selectedAddOns: ProductOption[];
  }>;
};

export type Profile = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  addresses: Array<{
    id: string;
    label: string;
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
    isDefault: boolean;
  }>;
};

export type AppNotification = {
  id: string;
  title: string;
  message: string;
  type: "PROMOTION" | "ORDER" | "SYSTEM";
};

export type CatalogPayload = {
  banners: BannerItem[];
  categories: Category[];
  products: Product[];
  coupons: CouponItem[];
};
