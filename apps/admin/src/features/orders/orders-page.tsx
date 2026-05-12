import { useEffect, useState } from "react";

import { fallbackOrders, getOrders, updateOrderStatus, type OrderRecord } from "../../lib/api";
import { formatCurrency, formatDate } from "../../lib/format";
import { StatusPill } from "../../components/status-pill";

type Props = {
  token: string;
};

const nextStatuses = ["CONFIRMED", "PREPARING", "OUT_FOR_DELIVERY", "DELIVERED"];

export function OrdersPage({ token }: Props) {
  const [orders, setOrders] = useState<OrderRecord[]>(fallbackOrders);

  useEffect(() => {
    getOrders(token).then(setOrders).catch(() => setOrders(fallbackOrders));
  }, [token]);

  async function handleAdvance(orderId: string, status: string) {
    try {
      const statusIndex = nextStatuses.indexOf(status);
      const nextStatus = nextStatuses[Math.min(statusIndex + 1, nextStatuses.length - 1)];
      await updateOrderStatus(token, orderId, nextStatus);
      setOrders((current) =>
        current.map((order) => (order.id === orderId ? { ...order, status: nextStatus } : order))
      );
    } catch {
      setOrders((current) =>
        current.map((order) =>
          order.id === orderId && order.status !== "DELIVERED" ? { ...order, status: "OUT_FOR_DELIVERY" } : order
        )
      );
    }
  }

  return (
    <section className="panel-card">
      <div className="section-head">
        <h2>Pedidos e entregas</h2>
        <span>Atualize o fluxo operacional em tempo real</span>
      </div>

      <div className="table-grid">
        {orders.map((order) => (
          <article className="order-card" key={order.id}>
            <div className="order-card-head">
              <div>
                <strong>#{order.id.slice(-6)}</strong>
                <p>{order.user?.name ?? "Cliente"}</p>
              </div>
              <StatusPill label={order.status} />
            </div>
            <div className="order-card-body">
              <p>{order.items.map((item) => `${item.quantity}x ${item.productName}`).join(", ")}</p>
              <p>{formatDate(order.createdAt)}</p>
              <p>{formatCurrency(Number(order.total))}</p>
              <p>
                {order.paymentMethod} • {order.paymentStatus}
              </p>
            </div>
            <button className="primary-button" onClick={() => handleAdvance(order.id, order.status)} type="button">
              Avançar status
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

