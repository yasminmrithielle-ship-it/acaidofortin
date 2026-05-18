import { useEffect, useState } from "react";
import { MessageSquareShare, RefreshCw } from "lucide-react";

import { getWhatsAppConnection, type WhatsAppConnection } from "../../lib/api";

type Props = {
  token: string;
};

const POLL_INTERVAL_MS = 15000;

const fallbackConnection: WhatsAppConnection = {
  configured: false,
  connected: false,
  status: "offline",
  qrCodeDataUrl: null,
  lastUpdatedAt: null,
  lastError: null,
  instructions: [
    "Configure o bot do WhatsApp para exibir o QR Code nesta tela.",
    "Depois use o WhatsApp da loja para escanear e conectar."
  ]
};

export function ChatbotPage({ token }: Props) {
  const [connection, setConnection] = useState<WhatsAppConnection>(fallbackConnection);
  const [loading, setLoading] = useState(true);

  async function loadConnection() {
    setLoading(true);
    try {
      const result = await getWhatsAppConnection(token);
      setConnection(result);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let mounted = true;

    async function loadAndGuard() {
      setLoading(true);
      try {
        const result = await getWhatsAppConnection(token);
        if (mounted) {
          setConnection(result);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadAndGuard();
    const interval = window.setInterval(loadAndGuard, POLL_INTERVAL_MS);

    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, [token]);

  return (
    <section className="page-grid">
      <article className="panel-card">
        <div className="section-head">
          <div>
            <h2>Chatbot e WhatsApp</h2>
            <span>Conexao dedicada para atendimento automatico e notificacoes</span>
          </div>
          <button className="ghost-button icon-action" onClick={loadConnection} type="button">
            <RefreshCw size={16} />
            <span>{loading ? "Atualizando..." : "Atualizar"}</span>
          </button>
        </div>

        <div className="chatbot-grid">
          <div className="qr-card">
            {connection.qrCodeDataUrl ? (
              <img alt="QR Code do WhatsApp" className="qr-image" src={connection.qrCodeDataUrl} />
            ) : (
              <div className="empty-state qr-empty">
                <MessageSquareShare size={34} />
                <strong>QR Code indisponivel</strong>
                <p>Quando o bot gerar um QR Code, ele aparecera aqui para o admin escanear.</p>
              </div>
            )}
          </div>

          <div className="chatbot-details">
            <div className="report-grid chatbot-status-grid">
              <div className="report-item">
                <strong>{connection.connected ? "Conectado" : "Aguardando"}</strong>
                <span>Status da sessao</span>
              </div>
              <div className="report-item">
                <strong>{connection.phone || "-"}</strong>
                <span>Numero vinculado</span>
              </div>
              <div className="report-item">
                <strong>{connection.accountName || "-"}</strong>
                <span>Conta ativa</span>
              </div>
            </div>

            <div className="panel-subsection">
              <strong>Como conectar</strong>
              <div className="list-stack">
                {connection.instructions.map((instruction) => (
                  <div className="list-row" key={instruction}>
                    <span>{instruction}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel-subsection">
              <strong>Diagnostico</strong>
              <div className="list-stack">
                <div className="list-row">
                  <span>Configurado na API</span>
                  <strong>{connection.configured ? "Sim" : "Nao"}</strong>
                </div>
                <div className="list-row">
                  <span>Status tecnico</span>
                  <strong>{connection.status}</strong>
                </div>
                {connection.apiUrl ? (
                  <div className="list-row">
                    <span>API consultada</span>
                    <strong>{connection.apiUrl}</strong>
                  </div>
                ) : null}
                <div className="list-row">
                  <span>Ultima atualizacao</span>
                  <strong>{connection.lastUpdatedAt ? new Date(connection.lastUpdatedAt).toLocaleString("pt-BR") : "-"}</strong>
                </div>
                {connection.botUrl ? (
                  <div className="list-row">
                    <span>Servico vinculado</span>
                    <strong>{connection.botUrl}</strong>
                  </div>
                ) : null}
                {connection.lastError ? (
                  <div className="list-row">
                    <span>Ultimo erro</span>
                    <strong>{connection.lastError}</strong>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </article>
    </section>
  );
}
