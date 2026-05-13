import { FormEvent, useState } from "react";

import { AppRoutes } from "./routes/app-routes";
import { ADMIN_PASSWORD, ADMIN_USERNAME, clearStoredToken, getStoredToken, loginAdmin, persistToken } from "./lib/api";

const AUTH_KEY = "fortin_admin_access";

function hasAdminAccess() {
  return localStorage.getItem(AUTH_KEY) === "1";
}

export default function App() {
  const [token, setToken] = useState(() => (hasAdminAccess() ? getStoredToken() : ""));
  const [form, setForm] = useState({
    username: "",
    password: ""
  });
  const [error, setError] = useState("");

  async function handleLogin(event: FormEvent) {
    event.preventDefault();

    if (form.username.trim().toUpperCase() !== ADMIN_USERNAME || form.password !== ADMIN_PASSWORD) {
      setError("Usuario ou senha invalidos");
      return;
    }

    try {
      const response = await loginAdmin({
        email: "admin@fortin.com",
        password: "Admin@123"
      });
      localStorage.setItem(AUTH_KEY, "1");
      persistToken(response.token);
      setToken(response.token);
      setError("");
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Falha no login");
    }
  }

  function handleLogout() {
    localStorage.removeItem(AUTH_KEY);
    clearStoredToken();
    setToken("");
  }

  if (!token) {
    return (
      <div className="login-screen">
        <div className="login-orb login-orb-a" />
        <div className="login-orb login-orb-b" />
        <form className="login-card" onSubmit={handleLogin}>
          <img alt="Acai do Fortin" className="login-logo" src="/assets/fortin-logo.jpeg" />
          <span className="eyebrow">Painel administrativo</span>
          <h1>Acai do Fortin</h1>
          <p>Controle pedidos, promocoes, estoque e relatorios em uma unica operacao.</p>
          <input
            placeholder="Usuario"
            value={form.username}
            onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
          />
          <input
            type="password"
            placeholder="Senha"
            value={form.password}
            onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
          />
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
