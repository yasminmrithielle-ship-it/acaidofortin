import { ChartColumnBig, LayoutDashboard, LogOut, Package, Percent, ShoppingBasket } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";

type Props = {
  onLogout: () => void;
};

const navigation = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/orders", label: "Pedidos", icon: ShoppingBasket },
  { to: "/products", label: "Produtos", icon: Package },
  { to: "/promotions", label: "Promoções", icon: Percent },
  { to: "/reports", label: "Relatórios", icon: ChartColumnBig }
];

export function AppShell({ onLogout }: Props) {
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <img alt="Açaí do Fortin" className="brand-mark" src="/assets/fortin-logo.jpeg" />
          <div>
            <strong>Açaí do Fortin</strong>
            <small>Painel premium</small>
          </div>
        </div>

        <nav className="nav">
          {navigation.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <button className="ghost-button logout-button" onClick={onLogout} type="button">
          <LogOut size={16} />
          <span>Sair</span>
        </button>
      </aside>

      <main className="content">
        <header className="topbar">
          <div>
            <p className="eyebrow">Operação em tempo real</p>
            <h1>Gestão de delivery, fidelidade e promoções</h1>
          </div>
          <div className="topbar-chip">Açaí artesanal premium</div>
        </header>
        <Outlet />
      </main>
    </div>
  );
}
