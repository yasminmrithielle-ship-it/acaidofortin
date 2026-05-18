import { useEffect, useState } from "react";

import { fallbackDashboard, getDashboardSummary, type DashboardSummary } from "../../lib/api";
import { formatCurrency, formatPaymentMethod, formatShortDate } from "../../lib/format";

type Props = {
  token: string;
};

export function ReportsPage({ token }: Props) {
  const [summary, setSummary] = useState<DashboardSummary>(fallbackDashboard);

  useEffect(() => {
    let mounted = true;

    async function loadSummary() {
      try {
        const result = await getDashboardSummary(token);
        if (mounted) {
          setSummary(result);
        }
      } catch {
        if (mounted) {
          setSummary(fallbackDashboard);
        }
      }
    }

    loadSummary();
    const interval = window.setInterval(loadSummary, 15000);

    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, [token]);

  return (
    <section className="page-grid">
      <article className="panel-card">
        <div className="section-head">
          <h2>Relatorios financeiros</h2>
          <span>Panorama executivo do delivery</span>
        </div>
        <div className="report-grid">
          <div className="report-item">
            <strong>{formatCurrency(summary.metrics.revenue)}</strong>
            <span>Faturamento</span>
          </div>
          <div className="report-item">
            <strong>{formatCurrency(summary.metrics.profit ?? 0)}</strong>
            <span>Lucro estimado</span>
          </div>
          <div className="report-item">
            <strong>{formatCurrency(summary.metrics.productCost ?? 0)}</strong>
            <span>Custo dos produtos</span>
          </div>
          <div className="report-item">
            <strong>{summary.metrics.ordersCount}</strong>
            <span>Pedidos totais</span>
          </div>
          <div className="report-item">
            <strong>{summary.metrics.productsCount}</strong>
            <span>SKUs cadastrados</span>
          </div>
        </div>
      </article>

      <article className="panel-card">
        <div className="section-head">
          <h2>Formas de pagamento</h2>
          <span>Faturamento por metodo</span>
        </div>
        <div className="list-stack">
          {summary.paymentBreakdown.length ? (
            summary.paymentBreakdown.map((payment) => (
              <div className="list-row" key={payment.method}>
                <strong>{formatPaymentMethod(payment.method)}</strong>
                <span>
                  {payment.ordersCount} pedidos • {formatCurrency(payment.revenue)}
                </span>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <strong>Sem movimentacao financeira</strong>
              <p>As formas de pagamento aparecem aqui quando os pedidos forem lancados.</p>
            </div>
          )}
        </div>
      </article>

      <article className="panel-card">
        <div className="section-head">
          <h2>Datas</h2>
          <span>Faturamento e lucro por dia</span>
        </div>
        <div className="list-stack">
          {summary.revenueByDate.length ? (
            summary.revenueByDate.map((day) => (
              <div className="list-row report-row" key={day.date}>
                <strong>{formatShortDate(day.date)}</strong>
                <span>{day.ordersCount} pedidos</span>
                <span>{formatCurrency(day.revenue)}</span>
                <span>{formatCurrency(day.profit)}</span>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <strong>Sem historico ainda</strong>
              <p>Os totais diarios serao preenchidos quando os primeiros pedidos forem registrados.</p>
            </div>
          )}
        </div>
      </article>

      <article className="panel-card">
        <div className="section-head">
          <h2>Itens mais vendidos</h2>
          <span>Indicadores de venda</span>
        </div>
        <div className="list-stack">
          {summary.topProducts.length ? (
            summary.topProducts.map((product) => (
              <div className="list-row" key={product.name}>
                <strong>{product.name}</strong>
                <span>{product.quantity} unidades</span>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <strong>Sem itens vendidos</strong>
              <p>Esta lista sera montada automaticamente conforme os pedidos forem entrando.</p>
            </div>
          )}
        </div>
      </article>
    </section>
  );
}
