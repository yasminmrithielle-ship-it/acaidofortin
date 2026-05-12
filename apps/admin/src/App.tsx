import { FormEvent, useState } from "react";

import { AppRoutes } from "./routes/app-routes";
import { clearStoredToken, getStoredToken, loginAdmin, persistToken } from "./lib/api";

export default function App() {
  const [token, setToken] = useState(getStoredToken());
  const [form, setForm] = useState({
    email: "admin@fortin.com",
    password: "Admin@123"
  });
  const [error, setError] = useState("");

  async function handleLogin(event: FormEvent) {
    event.preventDefault();

    try {
      const response = await loginAdmin(form);
      persistToken(response.token);
      setToken(response.token);
      setError("");
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Falha no login");
    }
  }

  function handleLogout() {
    clearStoredToken();
    setToken("");
  }

  if (!token) {
    return (
      <div className="login-screen">
        <div className="login-orb login-orb-a" />
        <div className="login-orb login-orb-b" />
        <form className="login-card" onSubmit={handleLogin}>
          <img alt="Açaí do Fortin" className="login-logo" src="/assets/fortin-logo.jpeg" />
          <span className="eyebrow">Painel administrativo</span>
          <h1>Açaí do Fortin</h1>
          <p>Controle pedidos, promoções, estoque e relatórios em uma única operação.</p>
          <input value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
          <input type="password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} />
          {error ? <span className="error-text">{error}</span> : null}
          <button className="primary-button" type="submit">
            Entrar no painel
          </button>
        </form>
      </div>
    );
  }

  return <AppRoutes token={token} onLogout={handleLogout} />;
}
