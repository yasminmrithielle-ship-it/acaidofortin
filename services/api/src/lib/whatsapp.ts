import { env } from "../config/env";

type WhatsAppEvent = "created" | "status_updated";

const statusLabels: Record<string, string> = {
  PENDING: "Pedido recebido",
  CONFIRMED: "Confirmado",
  PREPARING: "Em preparo",
  OUT_FOR_DELIVERY: "Saiu para entrega",
  DELIVERED: "Entregue",
  CANCELED: "Cancelado"
};

export function formatOrderCode(orderId: string) {
  return `FRT-${orderId.slice(-6).toUpperCase()}`;
}

function normalizePhone(phone?: string | null) {
  const digits = String(phone ?? "").replace(/\D/g, "");
  if (!digits) return "";
  return digits.startsWith("55") ? digits : `55${digits}`;
}

function botUrl(path: string) {
  if (!env.WHATSAPP_BOT_URL) return "";
  return `${env.WHATSAPP_BOT_URL.replace(/\/$/, "")}${path}`;
}

export async function notifyWhatsAppOrder(event: WhatsAppEvent, order: any) {
  const phone = normalizePhone(order.user?.phone);
  const url = botUrl(event === "created" ? "/send-order" : "/send-status");

  if (!url || !phone) return;

  const payload = {
    event,
    phone,
    order: {
      id: order.id,
      code: formatOrderCode(order.id),
      status: order.status,
      statusLabel: statusLabels[order.status] ?? order.status,
      estimatedMinutes: order.estimatedMinutes,
      subtotal: Number(order.subtotal ?? 0),
      discount: Number(order.discount ?? 0),
      deliveryFee: Number(order.deliveryFee ?? 0),
      total: Number(order.total ?? 0),
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      createdAt: order.createdAt,
      items: (order.items ?? []).map((item: any) => ({
        quantity: item.quantity,
        productName: item.productName,
        unitPrice: Number(item.unitPrice ?? 0),
        selectedSize: item.selectedSize,
        selectedAddOns: item.selectedAddOns,
        notes: item.notes
      })),
      address: order.address
        ? {
            street: order.address.street,
            number: order.address.number,
            referencePoint: order.address.complement,
            neighborhood: order.address.neighborhood,
            city: order.address.city,
            state: order.address.state,
            zipCode: order.address.zipCode
          }
        : null,
      customer: {
        name: order.user?.name,
        phone: order.user?.phone
      }
    }
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4000);

  try {
    await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(env.WHATSAPP_BOT_SECRET ? { "x-fortin-secret": env.WHATSAPP_BOT_SECRET } : {})
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
  } catch {
    // WhatsApp delivery is best-effort and must not block order creation/status updates.
  } finally {
    clearTimeout(timeout);
  }
}
