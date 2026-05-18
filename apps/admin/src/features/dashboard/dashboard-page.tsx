import { useEffect, useState } from "react";

import { fallbackDashboard, getDashboardSummary, type DashboardSummary } from "../../lib/api";
import { formatCurrency, formatDate } from "../../lib/format";
import { StatCard } from "../../components/stat-card";
import { StatusPill } from "../../components/status-pill";

type Props = {
  token: string;
};

export function DashboardPage({ token }: Props) {
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
      <div className="stats-grid">
        <StatCard title="Receita" value={formatCurrency(summary.metrics.revenue)} helper="Total de pedidos entregues" />
        <StatCard title="Pedidos" value={String(summary.metrics.ordersCount)} helper="Volume total na base" />
        <StatCard title="Produtos" value={String(summary.metrics.productsCount)} helper="SKUs cadastrados no cardapio" />
        <StatCard title="Pendentes" value={String(summary.metrics.pendingOrders)} helper="Pedidos aguardando acao" />
      </div>

      <div className="page-columns">
        <article className="panel-card">
          <div className="section-head">
            <h2>Pedidos recentes</h2>
            <span>Operacao ao vivo</span>
          </div>
          <div className="list-stack">
            {summary.recentOrders.length ? (
              summary.recentOrders.map((order) => (
                <div className="list-row" key={order.id}>
                  <div>
                    <strong>#{order.id.slice(-6)}</strong>
                    <p>{formatDate(order.createdAt)}</p>
                  </div>
                  <div>
                    <StatusPill label={order.status} />
                    <p>{formatCurrency(Number(order.total))}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <strong>Nenhum pedido ainda</strong>
                <p>Assim que os primeiros pedidos entrarem, eles aparecerao aqui.</p>
              </div>
            )}
          </div>
        </article>

        <article className="panel-card">
          <div className="section-head">
            <h2>Estoque critico</h2>
            <span>Reposicao sugerida</span>
          </div>
          <div className="list-stack">
            {summary.lowStockProducts.length ? (
              summary.lowStockProducts.map((product) => (
                <div className="list-row" key={product.id}>
                  <div>
                    <strong>{product.name}</strong>
                    <p>Reposicao urgente</p>
                  </div>
                  <div>
                    <span className="inventory-badge">{product.stockQuantity} un.</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <strong>Sem alerta no momento</strong>
                <p>Os avisos de estoque baixo aparecem aqui quando houver necessidade de reposicao.</p>
              </div>
            )}
          </div>
        </article>
      </div>

      <article className="panel-card">
        <div className="section-head">
          <h2>Top produtos</h2>
          <span>Mais vendidos</span>
        </div>
        <div className="bar-list">
          {summary.topProducts.length ? (
            summary.topProducts.map((product) => (
              <div className="bar-row" key={product.name}>
                <div className="bar-copy">
                  <strong>{product.name}</strong>
                  <span>{product.quantity} unidades</span>
                </div>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${Math.min(product.quantity * 2.3, 100)}%` }} />
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <strong>Sem ranking por enquanto</strong>
              <p>Os itens mais vendidos aparecerao aqui depois dos primeiros pedidos.</p>
            </div>
          )}
        </div>
      </article>
    </section>
  );
}
