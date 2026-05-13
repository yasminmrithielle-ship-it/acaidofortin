import { useState } from "react";
import { ChartColumnBig, LayoutDashboard, LogOut, Menu, Package, Percent, ShoppingBasket, X } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import fortinLogo from "../../../mobile/assets/brand/fortin-logo.jpeg";

type Props = {
  onLogout: () => void;
};

const navigation = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/orders", label: "Pedidos", icon: ShoppingBasket },
  { to: "/products", label: "Produtos", icon: Package },
  { to: "/promotions", label: "Promocoes", icon: Percent },
  { to: "/reports", label: "Relatorios", icon: ChartColumnBig }
];

export function AppShell({ onLogout }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="shell">
      <aside className={sidebarOpen ? "sidebar open" : "sidebar"}>
        <div className="brand">
          <img alt="Acai do Fortin" className="brand-mark" src={fortinLogo} />
          <div>
            <strong>Acai do Fortin</strong>
            <small>Painel premium</small>
          </div>
          <button aria-label="Fechar menu" className="sidebar-close" onClick={() => setSidebarOpen(false)} type="button">
            <X size={18} />
          </button>
        </div>

        <nav className="nav">
          {navigation.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                onClick={() => setSidebarOpen(false)}
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
      <button
        aria-label="Fechar menu"
        className={sidebarOpen ? "sidebar-backdrop visible" : "sidebar-backdrop"}
        onClick={() => setSidebarOpen(false)}
        type="button"
      />

      <main className="content">
        <header className="topbar">
          <div className="topbar-title">
            <button aria-label="Abrir menu" className="menu-toggle" onClick={() => setSidebarOpen(true)} type="button">
              <Menu size={22} />
            </button>
            <div>
              <p className="eyebrow">Operacao em tempo real</p>
              <h1>Gestao de delivery, fidelidade e promocoes</h1>
            </div>
          </div>
          <div className="topbar-chip">Acai artesanal premium</div>
        </header>
        <Outlet />
      </main>
    </div>
  );
}
