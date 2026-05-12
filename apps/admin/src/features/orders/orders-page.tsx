import { useEffect, useRef, useState, type MutableRefObject } from "react";
import { Printer, Volume2 } from "lucide-react";

import { StatusPill } from "../../components/status-pill";
import { fallbackOrders, getOrders, updateOrderStatus, type OrderRecord } from "../../lib/api";
import { formatCurrency, formatDate } from "../../lib/format";

type Props = {
  token: string;
};

const nextStatuses = ["PENDING", "CONFIRMED", "PREPARING", "OUT_FOR_DELIVERY", "DELIVERED"];
const POLL_INTERVAL_MS = 15000;

function getNextStatus(status: string) {
  const statusIndex = nextStatuses.indexOf(status);
  return nextStatuses[Math.min(statusIndex + 1, nextStatuses.length - 1)] ?? "CONFIRMED";
}

function playOrderSound(contextRef: MutableRefObject<AudioContext | null>) {
  const context = contextRef.current ?? new AudioContext();
  contextRef.current = context;

  if (context.state === "suspended") {
    context.resume().catch(() => undefined);
  }

  const now = context.currentTime;
  [
    { frequency: 880, start: 0, duration: 0.14 },
    { frequency: 1174, start: 0.16, duration: 0.16 },
    { frequency: 988, start: 0.36, duration: 0.22 }
  ].forEach((note) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(note.frequency, now + note.start);
    gain.gain.setValueAtTime(0.0001, now + note.start);
    gain.gain.exponentialRampToValueAtTime(0.24, now + note.start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + note.start + note.duration);

    oscillator.connect(gain).connect(context.destination);
    oscillator.start(now + note.start);
    oscillator.stop(now + note.start + note.duration + 0.03);
  });
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .split("&").join("&amp;")
    .split("<").join("&lt;")
    .split(">").join("&gt;")
    .split('"').join("&quot;")
    .split("'").join("&#039;");
}

function formatAddress(order: OrderRecord) {
  if (!order.address) return "Endereco nao informado";

  return `${order.address.street}, ${order.address.number} - ${order.address.neighborhood}, ${order.address.city}/${order.address.state}`;
}

function printOrder(order: OrderRecord) {
  const printWindow = window.open("", "_blank", "width=460,height=720");
  if (!printWindow) return;

  const items = order.items
    .map((item) => {
      const addOns = item.selectedAddOns?.map((addOn) => addOn.name).filter(Boolean).join(", ");
      const details = [item.selectedSize?.name, addOns].filter(Boolean).join(" - ");

      return `
        <tr>
          <td>${escapeHtml(item.quantity)}x</td>
          <td>
            <strong>${escapeHtml(item.productName)}</strong>
            ${details ? `<small>${escapeHtml(details)}</small>` : ""}
            ${item.notes ? `<small>Obs: ${escapeHtml(item.notes)}</small>` : ""}
          </td>
          <td>${escapeHtml(formatCurrency(Number(item.unitPrice ?? 0) * item.quantity))}</td>
        </tr>
      `;
    })
    .join("");

  printWindow.document.write(`
    <!doctype html>
    <html lang="pt-BR">
      <head>
        <meta charset="utf-8" />
        <title>Pedido ${escapeHtml(order.id.slice(-6))}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 18px; color: #111; }
          h1 { font-size: 20px; margin: 0 0 4px; }
          p { margin: 4px 0; }
          table { width: 100%; border-collapse: collapse; margin: 18px 0; }
          td { border-top: 1px solid #ddd; padding: 10px 0; vertical-align: top; }
          td:last-child { text-align: right; white-space: nowrap; }
          small { display: block; color: #555; margin-top: 3px; }
          .total { font-size: 18px; font-weight: 700; text-align: right; }
        </style>
      </head>
      <body>
        <h1>Acai do Fortin</h1>
        <p><strong>Pedido:</strong> #${escapeHtml(order.id.slice(-6))}</p>
        <p><strong>Cliente:</strong> ${escapeHtml(order.user?.name ?? "Cliente")}</p>
        <p><strong>Telefone:</strong> ${escapeHtml(order.user?.phone ?? "-")}</p>
        <p><strong>Endereco:</strong> ${escapeHtml(formatAddress(order))}</p>
        <p><strong>Pagamento:</strong> ${escapeHtml(order.paymentMethod)} - ${escapeHtml(order.paymentStatus)}</p>
        <p><strong>Data:</strong> ${escapeHtml(formatDate(order.createdAt))}</p>
        <table>${items}</table>
        <p class="total">Total: ${escapeHtml(formatCurrency(Number(order.total)))}</p>
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  printWindow.setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 250);
}

export function OrdersPage({ token }: Props) {
  const [orders, setOrders] = useState<OrderRecord[]>(fallbackOrders);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const knownOrderIdsRef = useRef<Set<string> | null>(null);
  const audioEnabledRef = useRef(false);

  useEffect(() => {
    audioEnabledRef.current = audioEnabled;
  }, [audioEnabled]);

  useEffect(() => {
    let mounted = true;

    async function loadOrders(notifyNewOrders: boolean) {
      try {
        const nextOrders = await getOrders(token);
        if (!mounted) return;

        const nextIds = new Set(nextOrders.map((order) => order.id));
        const knownIds = knownOrderIdsRef.current;
        const hasNewOrder = Boolean(knownIds && nextOrders.some((order) => !knownIds.has(order.id)));

        setOrders(nextOrders);
        knownOrderIdsRef.current = nextIds;

        if (notifyNewOrders && hasNewOrder && audioEnabledRef.current) {
          playOrderSound(audioContextRef);
        }
      } catch {
        if (!knownOrderIdsRef.current) {
          setOrders(fallbackOrders);
          knownOrderIdsRef.current = new Set(fallbackOrders.map((order) => order.id));
        }
      }
    }

    loadOrders(false);
    const interval = window.setInterval(() => loadOrders(true), POLL_INTERVAL_MS);

    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, [token]);

  async function handleEnableSound() {
    setAudioEnabled(true);
    playOrderSound(audioContextRef);
  }

  async function handleAdvance(orderId: string, status: string) {
    const nextStatus = getNextStatus(status);

    try {
      await updateOrderStatus(token, orderId, nextStatus);
      setOrders((current) =>
        current.map((order) => (order.id === orderId ? { ...order, status: nextStatus } : order))
      );
    } catch {
      setOrders((current) =>
        current.map((order) =>
          order.id === orderId && order.status !== "DELIVERED" ? { ...order, status: nextStatus } : order
        )
      );
    }
  }

  return (
    <section className="panel-card">
      <div className="section-head">
        <div>
          <h2>Pedidos e entregas</h2>
          <span>Todos os pedidos feitos no app aparecem aqui</span>
        </div>
        <button className="ghost-button sound-button" onClick={handleEnableSound} type="button">
          <Volume2 size={16} />
          <span>{audioEnabled ? "Som ativo" : "Ativar toque"}</span>
        </button>
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
              <p>{formatAddress(order)}</p>
              <p>{formatDate(order.createdAt)}</p>
              <p>{formatCurrency(Number(order.total))}</p>
              <p>
                {order.paymentMethod} - {order.paymentStatus}
              </p>
            </div>
            <div className="order-actions">
              <button className="primary-button" onClick={() => handleAdvance(order.id, order.status)} type="button">
                Avancar status
              </button>
              <button className="ghost-button icon-action" onClick={() => printOrder(order)} title="Imprimir pedido" type="button">
                <Printer size={16} />
                <span>Imprimir</span>
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
