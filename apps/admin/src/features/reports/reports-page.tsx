import { useEffect, useState } from "react";

import { fallbackDashboard, getDashboardSummary, type DashboardSummary } from "../../lib/api";
import { formatCurrency } from "../../lib/format";

type Props = {
  token: string;
};

export function ReportsPage({ token }: Props) {
  const [summary, setSummary] = useState<DashboardSummary>(fallbackDashboard);

  useEffect(() => {
    getDashboardSummary(token).then(setSummary).catch(() => setSummary(fallbackDashboard));
  }, [token]);

  return (
    <section className="page-grid">
      <article className="panel-card">
        <div className="section-head">
          <h2>Relatórios financeiros</h2>
          <span>Panorama executivo do delivery</span>
        </div>
        <div className="report-grid">
          <div className="report-item">
            <strong>{formatCurrency(summary.metrics.revenue)}</strong>
            <span>Receita consolidada</span>
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
          <h2>Itens mais vendidos</h2>
          <span>Indicadores de venda</span>
        </div>
        <div className="list-stack">
          {summary.topProducts.map((product) => (
            <div className="list-row" key={product.name}>
              <strong>{product.name}</strong>
              <span>{product.quantity} unidades</span>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}

