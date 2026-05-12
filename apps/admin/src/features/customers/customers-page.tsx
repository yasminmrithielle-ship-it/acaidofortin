import { useEffect, useState } from "react";

import { getCustomers } from "../../lib/api";
import { formatCurrency } from "../../lib/format";

type Props = {
  token: string;
};

export function CustomersPage({ token }: Props) {
  const [customers, setCustomers] = useState<Array<Record<string, any>>>([]);

  useEffect(() => {
    getCustomers(token).then(setCustomers).catch(() => setCustomers([]));
  }, [token]);

  return (
    <section className="panel-card">
      <div className="section-head">
        <h2>Gestão de clientes</h2>
        <span>Fidelidade, recorrência e ticket médio</span>
      </div>
      <div className="table-grid">
        {customers.map((customer) => (
          <article className="customer-card" key={customer.id}>
            <strong>{customer.name}</strong>
            <p>{customer.email}</p>
            <p>Pedidos: {customer.ordersCount}</p>
            <p>Pontos: {customer.loyaltyPoints}</p>
            <p>Faturamento: {formatCurrency(Number(customer.totalSpent))}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

