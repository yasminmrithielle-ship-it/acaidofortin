export function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(value);
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}

export function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short"
  }).format(new Date(`${value}T00:00:00`));
}

const statusLabelMap: Record<string, string> = {
  PENDING: "Recebido",
  CONFIRMED: "Confirmado",
  PREPARING: "Em preparo",
  OUT_FOR_DELIVERY: "Saiu para entrega",
  DELIVERED: "Entregue",
  CANCELED: "Cancelado",
  PAID: "Pago",
  FAILED: "Falhou",
  REFUNDED: "Estornado"
};

const paymentMethodMap: Record<string, string> = {
  PIX: "Pix",
  CARD: "Cartao",
  CASH: "Dinheiro"
};

export function formatStatusLabel(value: string) {
  return statusLabelMap[value] ?? value.split("_").join(" ");
}

export function formatPaymentMethod(value: string) {
  return paymentMethodMap[value] ?? value;
}
